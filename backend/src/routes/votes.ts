import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// POST /api/slides/:id/vote
router.post('/slides/:id/vote', async (req, res, next) => {
  try {
    const { direction } = req.body;
    if (!['up', 'down'].includes(direction)) {
      res.status(400).json({ ok: false, error: 'direction must be "up" or "down"' });
      return;
    }

    await prisma.vote.create({
      data: { slideId: req.params.id, direction },
    });

    // Return updated counts
    const [upCount, downCount] = await Promise.all([
      prisma.vote.count({ where: { slideId: req.params.id, direction: 'up' } }),
      prisma.vote.count({ where: { slideId: req.params.id, direction: 'down' } }),
    ]);

    res.json({ ok: true, data: { slideId: req.params.id, up: upCount, down: downCount, net: upCount - downCount } });
  } catch (err) { next(err); }
});

// GET /api/episodes/:slug/votes
router.get('/episodes/:slug/votes', async (req, res, next) => {
  try {
    const episode = await prisma.episode.findUnique({
      where: { slug: req.params.slug },
      include: {
        segments: {
          include: {
            slides: {
              select: {
                id: true,
                votes: { select: { direction: true } },
              }
            }
          }
        }
      }
    });

    if (!episode) {
      res.status(404).json({ ok: false, error: 'Episode not found' });
      return;
    }

    const voteCounts: Record<string, { up: number; down: number; net: number }> = {};
    for (const seg of episode.segments) {
      for (const slide of seg.slides) {
        const up = slide.votes.filter(v => v.direction === 'up').length;
        const down = slide.votes.filter(v => v.direction === 'down').length;
        voteCounts[slide.id] = { up, down, net: up - down };
      }
    }

    res.json({ ok: true, data: voteCounts });
  } catch (err) { next(err); }
});

export default router;
