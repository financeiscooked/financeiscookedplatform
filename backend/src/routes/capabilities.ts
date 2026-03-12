import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/admin-auth.js';

const router = Router();

// GET /api/capabilities — list all capabilities with agent link counts
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const capabilities = await prisma.capability.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { agentCapabilities: true } },
        agentCapabilities: {
          include: { agent: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    const data = capabilities.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      type: c.type,
      serverUrl: c.serverUrl,
      config: c.config,
      isActive: c.isActive,
      agentCount: c._count.agentCapabilities,
      agents: c.agentCapabilities.map((ac) => ({
        id: ac.agent.id,
        name: ac.agent.name,
        slug: ac.agent.slug,
      })),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

// POST /api/capabilities — register new MCP server
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, description, type, serverUrl, config } = req.body;

    if (!name) {
      res.status(400).json({ ok: false, error: 'name is required' });
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const capability = await prisma.capability.create({
      data: {
        name,
        slug,
        description: description ?? null,
        type: type ?? 'external',
        serverUrl: serverUrl ?? null,
        config: config ?? {},
      },
    });

    res.status(201).json({ ok: true, data: capability });
  } catch (err) { next(err); }
});

// PATCH /api/capabilities/:id — update capability
router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, description, serverUrl, config, isActive } = req.body;
    const id = req.params.id as string;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (description !== undefined) updateData.description = description;
    if (serverUrl !== undefined) updateData.serverUrl = serverUrl;
    if (config !== undefined) updateData.config = config;
    if (isActive !== undefined) updateData.isActive = isActive;

    const capability = await prisma.capability.update({
      where: { id },
      data: updateData,
    });

    res.json({ ok: true, data: capability });
  } catch (err) { next(err); }
});

// DELETE /api/capabilities/:id — soft delete
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    await prisma.capability.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

// POST /api/capabilities/:id/test — test connection to external MCP server
router.post('/:id/test', requireAdmin, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const capability = await prisma.capability.findUnique({ where: { id } });

    if (!capability) {
      res.status(404).json({ ok: false, error: 'Capability not found' });
      return;
    }

    if (capability.type !== 'external' || !capability.serverUrl) {
      res.status(400).json({ ok: false, error: 'Only external capabilities with a server URL can be tested' });
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(capability.serverUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      res.json({ ok: true, data: { reachable: true, status: response.status } });
    } catch {
      res.json({ ok: true, data: { reachable: false, error: 'Connection failed' } });
    }
  } catch (err) { next(err); }
});

export default router;
