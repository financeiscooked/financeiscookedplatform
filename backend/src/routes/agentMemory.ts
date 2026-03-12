import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/admin-auth.js';

const router = Router();

// All routes require admin auth
// Mounted at /api/agents, so paths include /:agentId/memory

// ─── GET /api/agents/:agentId/memory — list memory documents ────────

router.get('/:agentId/memory', requireAdmin, async (req, res, next) => {
  try {
    const agentId = req.params.agentId as string;

    const documents = await prisma.agentDocument.findMany({
      where: { agentId },
      orderBy: { updatedAt: 'desc' },
    });

    const data = documents.map(d => ({
      id: d.id,
      docType: d.docType,
      docKey: d.docKey,
      contentPreview: d.content.slice(0, 200),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

// ─── GET /api/agents/:agentId/memory/:docKey — get memory document ──

router.get('/:agentId/memory/:docKey', requireAdmin, async (req, res, next) => {
  try {
    const agentId = req.params.agentId as string;
    const docKey = req.params.docKey as string;

    const document = await prisma.agentDocument.findFirst({
      where: { agentId, docKey },
    });

    if (!document) {
      res.status(404).json({ ok: false, error: 'Memory document not found' });
      return;
    }

    res.json({
      ok: true,
      data: {
        id: document.id,
        docType: document.docType,
        docKey: document.docKey,
        content: document.content,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (err) { next(err); }
});

// ─── PUT /api/agents/:agentId/memory/:docKey — upsert memory doc ────

router.put('/:agentId/memory/:docKey', requireAdmin, async (req, res, next) => {
  try {
    const agentId = req.params.agentId as string;
    const docKey = req.params.docKey as string;
    const { content, docType } = req.body;

    if (!content) {
      res.status(400).json({ ok: false, error: 'content is required' });
      return;
    }

    // Verify agent exists
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      res.status(404).json({ ok: false, error: 'Agent not found' });
      return;
    }

    const resolvedDocType = docType ?? 'memory';

    const document = await prisma.agentDocument.upsert({
      where: {
        agentId_docType_docKey: {
          agentId,
          docType: resolvedDocType,
          docKey,
        },
      },
      update: { content },
      create: {
        agentId,
        docType: resolvedDocType,
        docKey,
        content,
      },
    });

    res.json({
      ok: true,
      data: {
        id: document.id,
        docType: document.docType,
        docKey: document.docKey,
        content: document.content,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (err) { next(err); }
});

// ─── DELETE /api/agents/:agentId/memory/:docKey — delete memory doc ──

router.delete('/:agentId/memory/:docKey', requireAdmin, async (req, res, next) => {
  try {
    const agentId = req.params.agentId as string;
    const docKey = req.params.docKey as string;

    const document = await prisma.agentDocument.findFirst({
      where: { agentId, docKey },
    });

    if (!document) {
      res.status(404).json({ ok: false, error: 'Memory document not found' });
      return;
    }

    // Delete associated embeddings
    await prisma.agentMemoryEmbedding.deleteMany({
      where: { docId: document.id },
    });

    // Delete the document
    await prisma.agentDocument.delete({
      where: { id: document.id },
    });

    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

export default router;
