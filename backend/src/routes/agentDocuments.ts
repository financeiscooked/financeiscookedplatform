import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/admin-auth.js';
import { ingestDocument, searchSimilar } from '../services/ragService.js';
import { decrypt } from './chat.js';

const router = Router();

async function getOpenAIKey(): Promise<string | null> {
  const stored = await prisma.llmApiKey.findUnique({ where: { provider: 'openai' as any } });
  if (stored) return decrypt(stored.encryptedKey);
  return process.env.OPENAI_API_KEY ?? null;
}

// All routes require admin auth
// Mounted at /api/agents, so paths include /:agentId/documents

// ─── GET /api/agents/:agentId/documents — list KB documents ─────────

router.get('/:agentId/documents', requireAdmin, async (req, res, next) => {
  try {
    const agentId = req.params.agentId as string;

    const documents = await prisma.kBDocument.findMany({
      where: { agentId, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { chunks: true } },
      },
    });

    const data = documents.map(d => ({
      id: d.id,
      name: d.name,
      sourceType: d.sourceType,
      metadata: d.metadata,
      chunkCount: d._count.chunks,
      createdAt: d.createdAt,
    }));

    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

// ─── POST /api/agents/:agentId/documents — create document ──────────

router.post('/:agentId/documents', requireAdmin, async (req, res, next) => {
  try {
    const agentId = req.params.agentId as string;
    const { name, content, sourceType, metadata } = req.body;

    if (!name || !content) {
      res.status(400).json({ ok: false, error: 'name and content are required' });
      return;
    }

    // Verify agent exists
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      res.status(404).json({ ok: false, error: 'Agent not found' });
      return;
    }

    const document = await prisma.kBDocument.create({
      data: {
        agentId,
        name,
        content,
        sourceType: sourceType ?? 'text',
        metadata: metadata ?? {},
      },
    });

    // Auto-ingest (chunk + embed) if OpenAI key is available
    let ingested = false;
    try {
      const apiKey = await getOpenAIKey();
      if (apiKey) {
        await ingestDocument(document.id, agentId, content, apiKey);
        ingested = true;
      }
    } catch {
      // Non-critical — document is saved, just not embedded yet
    }

    res.status(201).json({
      ok: true,
      data: {
        id: document.id,
        name: document.name,
        sourceType: document.sourceType,
        ingested,
        createdAt: document.createdAt,
      },
    });
  } catch (err) { next(err); }
});

// ─── DELETE /api/agents/:agentId/documents/:docId — delete document ──

router.delete('/:agentId/documents/:docId', requireAdmin, async (req, res, next) => {
  try {
    const agentId = req.params.agentId as string;
    const docId = req.params.docId as string;

    // Delete chunks first (cascade should handle it, but be explicit)
    await prisma.kBDocumentChunk.deleteMany({
      where: { documentId: docId, agentId },
    });

    await prisma.kBDocument.delete({
      where: { id: docId },
    });

    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

// ─── GET /api/agents/:agentId/documents/search — semantic search ────

router.get('/:agentId/documents/search', requireAdmin, async (req, res, next) => {
  try {
    const agentId = req.params.agentId as string;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ ok: false, error: 'q query parameter is required' });
      return;
    }

    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      res.status(500).json({ ok: false, error: 'No OpenAI API key configured for embeddings' });
      return;
    }

    const results = await searchSimilar(agentId, q, apiKey);

    res.json({ ok: true, data: results });
  } catch (err) { next(err); }
});

export default router;
