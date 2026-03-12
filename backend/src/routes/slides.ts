import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/admin-auth.js';

const router = Router();

// POST /api/segments/:id/slides
router.post('/segments/:id/slides', requireAdmin, async (req, res, next) => {
  try {
    const { type, title, url, notes, details, status, bullets, sortOrder } = req.body;
    const slide = await prisma.slide.create({
      data: {
        segmentId: req.params.id as string as string,
        type,
        title,
        url,
        notes,
        details,
        status: status ?? 'proposed',
        bullets: bullets ?? [],
        sortOrder: sortOrder ?? 0,
      },
    });
    res.status(201).json({ ok: true, data: { id: slide.id, title: slide.title } });
  } catch (err) { next(err); }
});

// PUT /api/slides/:id
router.put('/slides/:id', requireAdmin, async (req, res, next) => {
  try {
    const { type, title, url, notes, details, status, bullets, sortOrder } = req.body;
    const slide = await prisma.slide.update({
      where: { id: req.params.id as string },
      data: {
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title }),
        ...(url !== undefined && { url }),
        ...(notes !== undefined && { notes }),
        ...(details !== undefined && { details }),
        ...(status !== undefined && { status }),
        ...(bullets !== undefined && { bullets }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });
    res.json({ ok: true, data: { id: slide.id, title: slide.title } });
  } catch (err) { next(err); }
});

// DELETE /api/slides/:id
router.delete('/slides/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.slide.delete({ where: { id: req.params.id as string as string } });
    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

// POST /api/slides/:id/move - move slide to different segment
router.post('/slides/:id/move', requireAdmin, async (req, res, next) => {
  try {
    const { targetSegmentId, targetEpisodeSlug, targetSegmentSlug } = req.body;

    let segmentId = targetSegmentId;

    // If episode slug + segment slug provided, resolve to segment ID
    if (!segmentId && targetEpisodeSlug && targetSegmentSlug) {
      const episode = await prisma.episode.findUnique({ where: { slug: targetEpisodeSlug } });
      if (!episode) {
        res.status(404).json({ ok: false, error: 'Target episode not found' });
        return;
      }

      let segment = await prisma.segment.findUnique({
        where: { episodeId_slug: { episodeId: episode.id, slug: targetSegmentSlug } }
      });

      // Auto-create segment if it doesn't exist
      if (!segment) {
        segment = await prisma.segment.create({
          data: { episodeId: episode.id, slug: targetSegmentSlug, name: targetSegmentSlug }
        });
      }
      segmentId = segment.id;
    }

    const slide = await prisma.slide.update({
      where: { id: req.params.id as string },
      data: { segmentId },
    });
    res.json({ ok: true, data: { id: slide.id, title: slide.title } });
  } catch (err) { next(err); }
});

// POST /api/slides/:id/finalize
router.post('/slides/:id/finalize', requireAdmin, async (req, res, next) => {
  try {
    const slide = await prisma.slide.update({
      where: { id: req.params.id as string },
      data: { status: 'final' },
      include: { segment: true },
    });

    // Also finalize parent segment
    await prisma.segment.update({
      where: { id: slide.segmentId },
      data: { status: 'final' },
    });

    res.json({ ok: true, data: { id: slide.id, title: slide.title, status: 'final' } });
  } catch (err) { next(err); }
});

export default router;
