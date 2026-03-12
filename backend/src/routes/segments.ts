import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/admin-auth.js';

const router = Router();

// POST /api/episodes/:slug/segments
router.post('/episodes/:slug/segments', requireAdmin, async (req, res, next) => {
  try {
    const episode = await prisma.episode.findUnique({ where: { slug: req.params.slug as string } });
    if (!episode) {
      res.status(404).json({ ok: false, error: 'Episode not found' });
      return;
    }

    const { slug, name, status, sortOrder } = req.body;
    const segment = await prisma.segment.create({
      data: {
        episodeId: episode.id,
        slug,
        name,
        status: status ?? 'proposed',
        sortOrder: sortOrder ?? 0,
      },
    });
    res.status(201).json({ ok: true, data: { id: segment.id, slug: segment.slug, name: segment.name } });
  } catch (err) { next(err); }
});

// PUT /api/segments/:id
router.put('/segments/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, status, sortOrder } = req.body;
    const segment = await prisma.segment.update({
      where: { id: req.params.id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });
    res.json({ ok: true, data: { id: segment.id, slug: segment.slug, name: segment.name, status: segment.status } });
  } catch (err) { next(err); }
});

// DELETE /api/segments/:id
router.delete('/segments/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.segment.delete({ where: { id: req.params.id as string } });
    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

export default router;
