import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/admin-auth.js';

const router = Router();

// GET /api/agents/:agentId/capabilities — list enabled capabilities for agent
router.get('/:agentId/capabilities', requireAdmin, async (req, res, next) => {
  try {
    const agentId = req.params.agentId as string;

    const agentCaps = await prisma.agentCapability.findMany({
      where: { agentId },
      include: {
        capability: true,
      },
    });

    const data = agentCaps.map((ac) => ({
      id: ac.id,
      capabilityId: ac.capabilityId,
      name: ac.capability.name,
      slug: ac.capability.slug,
      type: ac.capability.type,
      description: ac.capability.description,
      config: ac.config,
      createdAt: ac.createdAt,
    }));

    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

// PUT /api/agents/:agentId/capabilities/:capId — enable capability for agent
router.put('/:agentId/capabilities/:capId', requireAdmin, async (req, res, next) => {
  try {
    const agentId = req.params.agentId as string;
    const capId = req.params.capId as string;
    const { config } = req.body || {};

    const agentCap = await prisma.agentCapability.upsert({
      where: {
        agentId_capabilityId: { agentId, capabilityId: capId },
      },
      create: {
        agentId,
        capabilityId: capId,
        config: config ?? {},
      },
      update: {
        config: config ?? {},
      },
      include: { capability: true },
    });

    res.json({ ok: true, data: agentCap });
  } catch (err) { next(err); }
});

// DELETE /api/agents/:agentId/capabilities/:capId — disable capability for agent
router.delete('/:agentId/capabilities/:capId', requireAdmin, async (req, res, next) => {
  try {
    const agentId = req.params.agentId as string;
    const capId = req.params.capId as string;

    await prisma.agentCapability.delete({
      where: {
        agentId_capabilityId: { agentId, capabilityId: capId },
      },
    });

    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

export default router;
