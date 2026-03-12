import prisma from '../lib/prisma.js';
import type { LLMMessage } from './llm/types.js';
import { getRagContext } from './ragService.js';
import { getMemoryRecall } from './memoryService.js';

// ---------------------------------------------------------------------------
// buildContext — assemble system prompt + conversation history
// ---------------------------------------------------------------------------
export async function buildContext(params: {
  agentId: string;
  conversationId: string;
  userMessage: string;
  historyLimit?: number;
  openaiApiKey?: string;
}): Promise<{
  messages: LLMMessage[];
  model: string;
}> {
  // Load agent
  const agent = await prisma.agent.findUnique({
    where: { id: params.agentId },
    include: {
      agentDocuments: {
        where: { docType: 'soul' },
        take: 1,
      },
    },
  });

  if (!agent) throw new Error('Agent not found');

  // Build system prompt
  const features = (agent.features as Record<string, any>) || {};
  let systemPrompt: string;

  if (features.memoryEnabled && agent.agentDocuments.length > 0) {
    // Use soul.md content as system prompt
    systemPrompt = agent.agentDocuments[0].content;
  } else if (agent.instructions) {
    systemPrompt = agent.instructions;
  } else {
    systemPrompt = `You are ${agent.name}, an AI assistant. Be helpful, concise, and accurate.`;
  }

  // Platform context injection
  systemPrompt += '\n\n--- Platform Context ---';
  systemPrompt += '\nYou are running inside the financeiscooked platform.';
  systemPrompt += '\nYou have access to show content, episode planning, and financial media research tools.';

  // RAG context injection (if ragEnabled)
  if (features.ragEnabled && params.openaiApiKey) {
    try {
      const ragContext = await getRagContext(params.agentId, params.userMessage, params.openaiApiKey);
      if (ragContext) {
        systemPrompt += ragContext;
      }
    } catch (err: any) {
      console.error('RAG context injection error:', err.message);
    }
  }

  // Memory recall injection (if memoryEnabled)
  if (features.memoryEnabled && params.openaiApiKey) {
    try {
      const memoryContext = await getMemoryRecall(params.agentId, params.userMessage, params.openaiApiKey);
      if (memoryContext) {
        systemPrompt += memoryContext;
      }
    } catch (err: any) {
      console.error('Memory recall error:', err.message);
    }
  }

  // Load conversation history
  const history = await prisma.message.findMany({
    where: { conversationId: params.conversationId },
    orderBy: { createdAt: 'asc' },
    take: params.historyLimit || 50,
  });

  // Convert to LLMMessage format
  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of history) {
    if (msg.role === 'system') continue; // skip stored system messages
    const metadata = (msg.metadata as Record<string, any>) || {};
    messages.push({
      role: msg.role as LLMMessage['role'],
      content: msg.content,
      toolCallId: metadata.toolCallId,
      toolCalls: metadata.toolCalls,
    });
  }

  // Append the new user message
  messages.push({ role: 'user', content: params.userMessage });

  return {
    messages,
    model: agent.defaultModel || 'claude-sonnet-4-6',
  };
}
