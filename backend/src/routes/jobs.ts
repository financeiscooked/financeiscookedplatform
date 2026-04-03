import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/admin-auth.js';

const router = Router();

// ─── GET /api/jobs — list all active jobs ─────────────────────────────
router.get('/jobs', async (req, res, next) => {
  try {
    const { tag, type, featured } = req.query;

    const where: any = { isActive: true };
    if (type) where.jobType = type as string;
    if (featured === 'true') where.featured = true;

    const jobs = await prisma.job.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { postedAt: 'desc' }],
    });

    // Filter by tag in JS (JSON array field)
    const filtered = tag
      ? jobs.filter((j) => {
          const tags = Array.isArray(j.tags) ? j.tags : [];
          return tags.some((t: string) => t.toLowerCase() === (tag as string).toLowerCase());
        })
      : jobs;

    res.json({ ok: true, data: filtered });
  } catch (err) { next(err); }
});

// ─── GET /api/jobs/:id — get one job ─────────────────────────────────
router.get('/jobs/:id', async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params['id'] as string } });
    if (!job) { res.status(404).json({ ok: false, error: 'Job not found' }); return; }
    res.json({ ok: true, data: job });
  } catch (err) { next(err); }
});

// ─── POST /api/jobs — create a job (admin) ───────────────────────────
router.post('/jobs', requireAdmin, async (req, res, next) => {
  try {
    const { title, company, location, jobType, tags, salary, url, description, featured, postedAt } = req.body;
    if (!title || !company || !url) {
      res.status(400).json({ ok: false, error: 'title, company, and url are required' });
      return;
    }
    const job = await prisma.job.create({
      data: {
        title,
        company,
        location: location || null,
        jobType: jobType || 'full-time',
        tags: tags || [],
        salary: salary || null,
        url,
        description: description || null,
        featured: featured || false,
        postedAt: postedAt ? new Date(postedAt) : new Date(),
      },
    });
    res.status(201).json({ ok: true, data: job });
  } catch (err) { next(err); }
});

// ─── PUT /api/jobs/:id — update a job (admin) ────────────────────────
router.put('/jobs/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = req.params['id'] as string;
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ ok: false, error: 'Job not found' }); return; }

    const { title, company, location, jobType, tags, salary, url, description, featured, isActive, postedAt } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (company !== undefined) data.company = company;
    if (location !== undefined) data.location = location;
    if (jobType !== undefined) data.jobType = jobType;
    if (tags !== undefined) data.tags = tags;
    if (salary !== undefined) data.salary = salary;
    if (url !== undefined) data.url = url;
    if (description !== undefined) data.description = description;
    if (featured !== undefined) data.featured = featured;
    if (isActive !== undefined) data.isActive = isActive;
    if (postedAt !== undefined) data.postedAt = new Date(postedAt);

    const job = await prisma.job.update({ where: { id }, data });
    res.json({ ok: true, data: job });
  } catch (err) { next(err); }
});

// ─── DELETE /api/jobs/:id — delete a job (admin) ─────────────────────
router.delete('/jobs/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = req.params['id'] as string;
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ ok: false, error: 'Job not found' }); return; }
    await prisma.job.delete({ where: { id } });
    res.json({ ok: true, data: { deleted: id } });
  } catch (err) { next(err); }
});

export default router;
