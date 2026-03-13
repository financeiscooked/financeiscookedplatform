import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/admin-auth.js';

const router = Router();

// GET /api/episodes - list all with counts
router.get('/episodes', async (req, res, next) => {
  try {
    const episodes = await prisma.episode.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { segments: true } },
        segments: {
          include: { _count: { select: { slides: true } } }
        }
      }
    });

    const data = episodes.map(ep => ({
      id: ep.slug,
      title: ep.title,
      date: ep.date,
      sortOrder: ep.sortOrder,
      segmentCount: ep._count.segments,
      slideCount: ep.segments.reduce((sum, seg) => sum + seg._count.slides, 0),
    }));

    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

// GET /api/episodes/:slug - full nested episode
router.get('/episodes/:slug', async (req, res, next) => {
  try {
    const episode = await prisma.episode.findUnique({
      where: { slug: req.params.slug as string },
      include: {
        segments: {
          orderBy: { sortOrder: 'asc' },
          include: {
            slides: {
              orderBy: { sortOrder: 'asc' },
              include: { images: { orderBy: { sortOrder: 'asc' } } }
            }
          }
        }
      }
    });

    if (!episode) {
      res.status(404).json({ ok: false, error: 'Episode not found' });
      return;
    }

    // Transform to match frontend JSON format
    const data = {
      id: episode.slug,
      title: episode.title,
      date: episode.date,
      segments: episode.segments.map(seg => ({
        id: seg.slug,
        uuid: seg.id,
        name: seg.name,
        status: seg.status,
        slides: seg.slides.map(slide => ({
          id: slide.id,
          type: slide.type,
          title: slide.title,
          url: slide.url,
          notes: slide.notes,
          details: slide.details,
          status: slide.status,
          bullets: slide.bullets,
          images: slide.images.map(img => ({
            src: img.src,
            alt: img.alt,
          })),
        })),
      })),
    };

    res.json({ ok: true, data });
  } catch (err) { next(err); }
});

// POST /api/episodes - create
router.post('/episodes', requireAdmin, async (req, res, next) => {
  try {
    const { slug, title, date, sortOrder } = req.body;
    const episode = await prisma.episode.create({
      data: { slug, title, date, sortOrder: sortOrder ?? 0 },
    });
    res.status(201).json({ ok: true, data: { id: episode.slug, title: episode.title } });
  } catch (err) { next(err); }
});

// PUT /api/episodes/:slug - update
router.put('/episodes/:slug', requireAdmin, async (req, res, next) => {
  try {
    const { title, date, sortOrder } = req.body;
    const episode = await prisma.episode.update({
      where: { slug: req.params.slug as string },
      data: {
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });
    res.json({ ok: true, data: { id: episode.slug, title: episode.title } });
  } catch (err) { next(err); }
});

// DELETE /api/episodes/:slug
router.delete('/episodes/:slug', requireAdmin, async (req, res, next) => {
  try {
    await prisma.episode.delete({ where: { slug: req.params.slug as string } });
    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

export default router;
