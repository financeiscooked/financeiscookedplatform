import { Router } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { seedFromJson } from '../seed/seed-from-json.js';
import prisma from '../lib/prisma.js';

const router = Router();

// POST /api/admin/seed
router.post('/seed', async (req, res, next) => {
  try {
    // Look for seed-data relative to project root
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const seedDir = join(__dirname, '../../../seed-data');
    const result = await seedFromJson(seedDir);
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/admin/stats - basic stats
router.get('/stats', async (req, res, next) => {
  try {
    const [episodes, segments, slides, votes] = await Promise.all([
      prisma.episode.count(),
      prisma.segment.count(),
      prisma.slide.count(),
      prisma.vote.count(),
    ]);
    res.json({ ok: true, data: { episodes, segments, slides, votes } });
  } catch (err) { next(err); }
});

export default router;
