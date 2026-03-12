import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/admin-auth.js';

const router = Router();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET /api/agents — list all active agents (public)
router.get('/', async (req, res, next) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { kbDocuments: true } },
      },
    });

    const data = agents.map(a => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      description: a.description,
      defaultModel: a.defaultModel,
      features: a.features,
      branding: a.branding,
      kbDocumentCount: a._count.kbDocuments,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

// GET /api/agents/:id — get agent by id (public)
router.get('/:id', async (req, res, next) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id as string },
      include: {
        _count: { select: { kbDocuments: true, conversations: true } },
      },
    });

    if (!agent || !agent.isActive) {
      res.status(404).json({ ok: false, error: 'Agent not found' });
      return;
    }

    res.json({
      ok: true,
      data: {
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        description: agent.description,
        instructions: agent.instructions,
        defaultModel: agent.defaultModel,
        features: agent.features,
        branding: agent.branding,
        kbDocumentCount: agent._count.kbDocuments,
        conversationCount: agent._count.conversations,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      },
    });
  } catch (err) { next(err); }
});

// POST /api/agents — create agent (admin only)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, description, instructions, defaultModel, features } = req.body;

    if (!name || !description || !instructions) {
      res.status(400).json({ ok: false, error: 'name, description, and instructions are required' });
      return;
    }

    const slug = slugify(name);

    const agent = await prisma.agent.create({
      data: {
        name,
        slug,
        description,
        instructions,
        defaultModel: defaultModel ?? null,
        features: features ?? {},
      },
    });

    res.status(201).json({ ok: true, data: agent });
  } catch (err) { next(err); }
});

// PATCH /api/agents/:id — update agent (admin only)
router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, description, instructions, defaultModel, features, branding } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = slugify(name);
    }
    if (description !== undefined) updateData.description = description;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (defaultModel !== undefined) updateData.defaultModel = defaultModel;
    if (features !== undefined) updateData.features = features;
    if (branding !== undefined) updateData.branding = branding;

    const agent = await prisma.agent.update({
      where: { id: req.params.id as string },
      data: updateData,
    });

    res.json({ ok: true, data: agent });
  } catch (err) { next(err); }
});

// DELETE /api/agents/:id — soft delete agent (admin only)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.agent.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });

    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

export default router;
