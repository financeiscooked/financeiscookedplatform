import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { buildContext } from '../services/contextBuilder.js';
import { getProviderForModel } from '../services/llm/index.js';
import { executeWithTools, streamWithTools } from '../services/toolExecutor.js';
import { DEEP_TOOLS } from '../services/deepTools.js';
import { MEMORY_TOOLS } from '../services/memoryTools.js';
import { PLATFORM_TOOLS } from '../services/platformTools.js';
import type { Tool } from '../services/llm/types.js';

const router = Router();

// ─── Encryption helpers ───────────────────────────────────────────────

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || 'financeiscooked-default-key-32ch';
  // Ensure 32 bytes for aes-256
  return Buffer.from(key.padEnd(32, '0').slice(0, 32), 'utf-8');
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ─── Resolve API key for a provider ──────────────────────────────────

async function resolveApiKey(provider: string): Promise<string | null> {
  // Try database first
  const stored = await prisma.llmApiKey.findUnique({
    where: { provider: provider as any },
  });
  if (stored) {
    return decrypt(stored.encryptedKey);
  }

  // Fallback to env vars
  const envMap: Record<string, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    google: 'GOOGLE_API_KEY',
  };
  const envVar = envMap[provider];
  return envVar ? (process.env[envVar] ?? null) : null;
}

// ─── Resolve current LLM config ─────────────────────────────────────

async function resolveLlmConfig(agent?: { defaultModel?: string | null }) {
  const config = await prisma.llmConfig.findFirst({
    orderBy: { updatedAt: 'desc' },
  });

  const provider = config?.provider ?? 'openai';
  const model = agent?.defaultModel ?? config?.model ?? 'gpt-4o-mini';
  const apiKey = await resolveApiKey(provider);

  return { provider, model, apiKey };
}

// ─── POST /api/chat/start — start a conversation ────────────────────

router.post('/start', async (req, res, next) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      res.status(400).json({ ok: false, error: 'agentId is required' });
      return;
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent || !agent.isActive) {
      res.status(404).json({ ok: false, error: 'Agent not found' });
      return;
    }

    const conversation = await prisma.conversation.create({
      data: { agentId },
    });

    res.status(201).json({
      ok: true,
      data: {
        conversationId: conversation.publicId,
        agent: {
          id: agent.id,
          name: agent.name,
          slug: agent.slug,
          description: agent.description,
          branding: agent.branding,
        },
      },
    });
  } catch (err) { next(err); }
});

// ─── GET /api/chat/conversations — list conversations ────────────────

router.get('/conversations', async (req, res, next) => {
  try {
    const { agentId, limit } = req.query;

    const conversations = await prisma.conversation.findMany({
      where: {
        isActive: true,
        ...(agentId ? { agentId: agentId as string } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string, 10) : 50,
      include: {
        agent: { select: { id: true, name: true, slug: true } },
      },
    });

    const data = conversations.map(c => ({
      id: c.publicId,
      agentId: c.agentId,
      agentName: c.agent.name,
      agentSlug: c.agent.slug,
      title: c.title,
      messageCount: c.messageCount,
      lastMessageAt: c.lastMessageAt,
      createdAt: c.createdAt,
    }));

    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

// ─── GET /api/chat/:conversationId — get conversation + messages ─────

router.get('/:conversationId', async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { publicId: req.params.conversationId as string },
      include: {
        agent: { select: { id: true, name: true, slug: true, branding: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      res.status(404).json({ ok: false, error: 'Conversation not found' });
      return;
    }

    res.json({
      ok: true,
      data: {
        id: conversation.publicId,
        agent: conversation.agent,
        title: conversation.title,
        messageCount: conversation.messageCount,
        messages: conversation.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          metadata: m.metadata,
          createdAt: m.createdAt,
        })),
        createdAt: conversation.createdAt,
      },
    });
  } catch (err) { next(err); }
});

// ─── POST /api/chat/:conversationId/stream — SSE streaming chat ─────

router.post('/:conversationId/stream', async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ ok: false, error: 'content is required' });
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { publicId: req.params.conversationId as string },
      include: {
        agent: true,
        messages: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
    });

    if (!conversation) {
      res.status(404).json({ ok: false, error: 'Conversation not found' });
      return;
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content,
      },
    });

    // Resolve LLM config
    const llmConfig = await resolveLlmConfig(conversation.agent);

    if (!llmConfig.apiKey) {
      res.status(500).json({ ok: false, error: 'No API key configured for provider: ' + llmConfig.provider });
      return;
    }

    // Build context with RAG + memory
    const ctx = await buildContext({
      agentId: conversation.agentId,
      conversationId: conversation.id,
      userMessage: content,
      openaiApiKey: await resolveApiKey('openai') ?? undefined,
    });

    // Load built-in tools
    const tools: Tool[] = [...DEEP_TOOLS, ...MEMORY_TOOLS, ...PLATFORM_TOOLS];

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent('start', { conversationId: conversation.publicId, model: ctx.model });

    let fullResponse = '';

    try {
      const { result } = await streamWithTools({
        messages: ctx.messages,
        tools,
        model: ctx.model,
        apiKey: llmConfig.apiKey!,
        context: {
          agentId: conversation.agentId,
          conversationId: conversation.id,
        },
        onChunk: (chunk) => {
          if (chunk.type === 'delta') {
            fullResponse += chunk.content;
            sendEvent('delta', { content: chunk.content });
          } else if (chunk.type === 'tool') {
            sendEvent('tool', { data: chunk.content });
          }
        },
      });

      // Capture final text if not already captured via chunks
      if (!fullResponse && result.text) {
        fullResponse = result.text;
      }
    } catch (streamErr: any) {
      sendEvent('error', { message: streamErr.message || 'Stream error' });
    }

    // Save assistant message
    if (fullResponse) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: fullResponse,
        },
      });

      // Update conversation metadata
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          messageCount: { increment: 2 },
          lastMessageAt: new Date(),
        },
      });

      // Auto-title after first exchange
      if (conversation.messageCount === 0 && llmConfig.apiKey) {
        autoTitle(conversation.id, content, fullResponse, llmConfig).catch(() => {});
      }
    }

    sendEvent('end', { messageCount: (conversation.messageCount || 0) + 2 });
    res.end();
  } catch (err) { next(err); }
});

// ─── Auto-title helper ──────────────────────────────────────────────

async function autoTitle(
  conversationId: string,
  userMessage: string,
  assistantMessage: string,
  llmConfig: { provider: string; model: string; apiKey: string | null },
) {
  if (!llmConfig.apiKey) return;

  try {
    const provider = getProviderForModel(llmConfig.model);
    const result = await provider.generate(
      [
        { role: 'system', content: 'Generate a short title (max 6 words) for this conversation. Return ONLY the title, no quotes.' },
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantMessage.slice(0, 500) },
      ],
      llmConfig.model,
      llmConfig.apiKey,
    );

    const title = result.text.trim().slice(0, 255);
    if (title) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { title },
      });
    }
  } catch {
    // Non-critical, ignore
  }
}

// ─── POST /api/chat/:conversationId/message — non-streaming fallback ─

router.post('/:conversationId/message', async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ ok: false, error: 'content is required' });
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { publicId: req.params.conversationId as string },
      include: {
        agent: true,
        messages: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
    });

    if (!conversation) {
      res.status(404).json({ ok: false, error: 'Conversation not found' });
      return;
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content,
      },
    });

    const llmConfig = await resolveLlmConfig(conversation.agent);

    if (!llmConfig.apiKey) {
      res.status(500).json({ ok: false, error: 'No API key configured for provider: ' + llmConfig.provider });
      return;
    }

    const ctx = await buildContext({
      agentId: conversation.agentId,
      conversationId: conversation.id,
      userMessage: content,
      openaiApiKey: await resolveApiKey('openai') ?? undefined,
    });

    const tools: Tool[] = [...DEEP_TOOLS, ...MEMORY_TOOLS, ...PLATFORM_TOOLS];

    const { result } = await executeWithTools({
      messages: ctx.messages,
      tools,
      model: ctx.model,
      apiKey: llmConfig.apiKey!,
      context: {
        agentId: conversation.agentId,
        conversationId: conversation.id,
      },
    });

    // Save assistant message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: result.text,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 2 },
        lastMessageAt: new Date(),
      },
    });

    // Auto-title after first exchange
    if (conversation.messageCount === 0) {
      autoTitle(conversation.id, content, result.text, llmConfig).catch(() => {});
    }

    res.json({
      ok: true,
      data: {
        role: 'assistant',
        content: result.text,
        model: ctx.model,
      },
    });
  } catch (err) { next(err); }
});

// ─── DELETE /api/chat/:conversationId — archive conversation ─────────

router.delete('/:conversationId', async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { publicId: req.params.conversationId as string },
    });

    if (!conversation) {
      res.status(404).json({ ok: false, error: 'Conversation not found' });
      return;
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { isActive: false },
    });

    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

export default router;
