import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/admin-auth.js';

const router = Router();

// ─── Encryption helpers ───────────────────────────────────────────────

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

// Known settings with metadata
const SETTING_META: Record<string, { label: string; description: string }> = {
  RESEND_API_KEY: {
    label: 'Resend API Key',
    description: 'Used to send emails (episode summaries, notifications)',
  },
  BRAVE_SEARCH_API_KEY: {
    label: 'Brave Search API Key',
    description: 'Used by the platform agent for web search',
  },
};

// ─── GET /api/settings — list all configured settings (no values) ─────

router.get('/', requireAdmin, async (_req, res) => {
  const stored = await prisma.platformSetting.findMany({
    orderBy: { key: 'asc' },
  });

  // Also surface env-only keys that aren't in DB yet
  const dbKeys = new Set(stored.map((s) => s.key));
  const envOnlyKeys = Object.keys(SETTING_META).filter(
    (k) => !dbKeys.has(k) && process.env[k]
  );

  const settings = [
    ...stored.map((s) => ({
      key: s.key,
      label: SETTING_META[s.key]?.label ?? s.key,
      description: SETTING_META[s.key]?.description ?? '',
      keyPrefix: s.keyPrefix,
      configured: true,
      source: 'db',
    })),
    ...envOnlyKeys.map((k) => ({
      key: k,
      label: SETTING_META[k]?.label ?? k,
      description: SETTING_META[k]?.description ?? '',
      keyPrefix: (process.env[k] ?? '').slice(0, 8) + '...',
      configured: true,
      source: 'env',
    })),
    // Unconfigured known settings
    ...Object.keys(SETTING_META)
      .filter((k) => !dbKeys.has(k) && !process.env[k])
      .map((k) => ({
        key: k,
        label: SETTING_META[k].label,
        description: SETTING_META[k].description,
        keyPrefix: null,
        configured: false,
        source: null,
      })),
  ];

  res.json({ ok: true, data: settings });
});

// ─── PUT /api/settings/:key — save or update a setting ───────────────

router.put('/:key', requireAdmin, async (req, res) => {
  const key = req.params['key'] as string;
  const { value } = req.body;

  if (!value || typeof value !== 'string') {
    return res.status(400).json({ ok: false, error: 'value is required' });
  }

  const encryptedValue = encrypt(value);
  const keyPrefix = value.slice(0, 8) + '...';

  await prisma.platformSetting.upsert({
    where: { key },
    update: { encryptedValue, keyPrefix },
    create: { key, encryptedValue, keyPrefix },
  });

  res.json({ ok: true, data: { key, keyPrefix, configured: true } });
});

// ─── DELETE /api/settings/:key — remove a setting ────────────────────

router.delete('/:key', requireAdmin, async (req, res) => {
  const key = req.params['key'] as string;

  const existing = await prisma.platformSetting.findUnique({ where: { key } });
  if (!existing) {
    return res.status(404).json({ ok: false, error: 'Setting not found' });
  }

  await prisma.platformSetting.delete({ where: { key } });
  res.json({ ok: true, data: { key, deleted: true } });
});

// ─── Internal helper — read a setting value (DB first, then env) ──────

export async function getSettingValue(key: string): Promise<string | null> {
  try {
    const stored = await prisma.platformSetting.findUnique({ where: { key } });
    if (stored) return decrypt(stored.encryptedValue);
  } catch {
    // fall through to env
  }
  return process.env[key] ?? null;
}

export default router;
