import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/admin-auth.js';

const router = Router();

// ─── Encryption helpers (duplicated for independence) ────────────────

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || 'financeiscooked-default-key-32ch';
  return Buffer.from(key.padEnd(32, '0').slice(0, 32), 'utf-8');
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ─── Available providers and models ──────────────────────────────────

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'o1', name: 'o1' },
      { id: 'o1-mini', name: 'o1 Mini' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
    ],
  },
  {
    id: 'google',
    name: 'Google',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    ],
  },
];

// All routes require admin auth
router.use(requireAdmin);

// ─── GET /api/llm-config — get current LLM config ───────────────────

router.get('/', async (_req, res, next) => {
  try {
    const config = await prisma.llmConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    // Check for stored API key
    const provider = config?.provider ?? 'openai';
    const apiKey = await prisma.llmApiKey.findUnique({
      where: { provider: provider as any },
    });

    res.json({
      ok: true,
      data: {
        provider,
        model: config?.model ?? 'gpt-4o-mini',
        hasApiKey: !!apiKey,
        keyPrefix: apiKey?.keyPrefix ?? null,
      },
    });
  } catch (err) { next(err); }
});

// ─── GET /api/llm-config/providers — list available providers ────────

router.get('/providers', async (_req, res, next) => {
  try {
    // Fetch all stored API keys to show which providers have keys
    const storedKeys = await prisma.llmApiKey.findMany();
    const keyMap = new Map(storedKeys.map(k => [k.provider as string, k.keyPrefix]));

    const data = PROVIDERS.map(p => ({
      ...p,
      hasKey: keyMap.has(p.id),
      keyPrefix: keyMap.get(p.id) ?? null,
    }));

    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

// ─── PUT /api/llm-config — set provider + model ─────────────────────

router.put('/', async (req, res, next) => {
  try {
    const { provider, model } = req.body;

    if (!provider || !model) {
      res.status(400).json({ ok: false, error: 'provider and model are required' });
      return;
    }

    // Validate provider
    const validProviders = PROVIDERS.map(p => p.id);
    if (!validProviders.includes(provider)) {
      res.status(400).json({ ok: false, error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` });
      return;
    }

    // Upsert — delete old config, create new
    await prisma.llmConfig.deleteMany({});
    const config = await prisma.llmConfig.create({
      data: { provider, model },
    });

    res.json({
      ok: true,
      data: {
        provider: config.provider,
        model: config.model,
      },
    });
  } catch (err) { next(err); }
});

// ─── PUT /api/llm-config/api-key — save encrypted API key ───────────

router.put('/api-key', async (req, res, next) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      res.status(400).json({ ok: false, error: 'provider and apiKey are required' });
      return;
    }

    const encryptedKey = encrypt(apiKey);
    const keyPrefix = apiKey.slice(0, 8) + '...';

    // Upsert API key for provider
    await prisma.llmApiKey.upsert({
      where: { provider: provider as any },
      update: { encryptedKey, keyPrefix },
      create: { provider: provider as any, encryptedKey, keyPrefix },
    });

    res.json({
      ok: true,
      data: { provider, keyPrefix },
    });
  } catch (err) { next(err); }
});

// ─── DELETE /api/llm-config/api-key/:provider — delete API key ───────

router.delete('/api-key/:provider', async (req, res, next) => {
  try {
    const { provider } = req.params;

    await prisma.llmApiKey.deleteMany({
      where: { provider: provider as any },
    });

    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

export default router;
