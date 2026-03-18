import { Router } from 'express';
import multer from 'multer';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/admin-auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

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

// ── Slide Images ─────────────────────────────────────────────────

// POST /api/slides/:id/images - upload image file
router.post('/slides/:id/images', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    const slide = await prisma.slide.findUnique({ where: { id: req.params.id as string } });
    if (!slide) { res.status(404).json({ ok: false, error: 'Slide not found' }); return; }

    const file = req.file;
    if (!file) { res.status(400).json({ ok: false, error: 'No file uploaded' }); return; }

    const img = await prisma.slideImage.create({
      data: {
        slideId: req.params.id as string,
        src: '', // placeholder, updated below
        alt: req.body.alt || file.originalname,
        filename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        data: new Uint8Array(file.buffer),
        sortOrder: req.body.sortOrder ? parseInt(req.body.sortOrder) : 0,
      },
      select: { id: true, slideId: true, filename: true, mimeType: true, fileSize: true, alt: true, sortOrder: true },
    });

    // Set src to the serve endpoint
    const src = `/api/slide-images/${img.id}/file`;
    await prisma.slideImage.update({ where: { id: img.id }, data: { src } });

    res.status(201).json({ ok: true, data: { ...img, src } });
  } catch (err) { next(err); }
});

// GET /api/slides/:id/images - list images for a slide
router.get('/slides/:id/images', async (req, res, next) => {
  try {
    const imgs = await prisma.slideImage.findMany({
      where: { slideId: req.params.id as string },
      select: { id: true, slideId: true, src: true, alt: true, filename: true, mimeType: true, fileSize: true, sortOrder: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ ok: true, data: imgs });
  } catch (err) { next(err); }
});

// GET /api/slide-images/:id/file - serve image binary
router.get('/slide-images/:id/file', async (req, res, next) => {
  try {
    const img = await prisma.slideImage.findUnique({ where: { id: req.params.id as string } });
    if (!img || !img.data) { res.status(404).json({ ok: false, error: 'Image not found' }); return; }

    res.setHeader('Content-Type', img.mimeType || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(img.data);
  } catch (err) { next(err); }
});

// DELETE /api/slide-images/:id - delete an image
router.delete('/slide-images/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.slideImage.delete({ where: { id: req.params.id as string } });
    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

// ── Slide Documents ──────────────────────────────────────────────

// POST /api/slides/:id/documents - upload document
router.post('/slides/:id/documents', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    const slide = await prisma.slide.findUnique({ where: { id: req.params.id as string } });
    if (!slide) { res.status(404).json({ ok: false, error: 'Slide not found' }); return; }

    const file = req.file;
    if (!file) { res.status(400).json({ ok: false, error: 'No file uploaded' }); return; }

    const doc = await prisma.slideDocument.create({
      data: {
        slideId: req.params.id as string,
        filename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        data: new Uint8Array(file.buffer),
        sortOrder: req.body.sortOrder ? parseInt(req.body.sortOrder) : 0,
      },
      select: { id: true, slideId: true, filename: true, mimeType: true, fileSize: true, sortOrder: true, createdAt: true },
    });
    res.status(201).json({ ok: true, data: doc });
  } catch (err) { next(err); }
});

// GET /api/slides/:id/documents - list documents for a slide
router.get('/slides/:id/documents', async (req, res, next) => {
  try {
    const docs = await prisma.slideDocument.findMany({
      where: { slideId: req.params.id as string },
      select: { id: true, slideId: true, filename: true, mimeType: true, fileSize: true, sortOrder: true, createdAt: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ ok: true, data: docs });
  } catch (err) { next(err); }
});

// GET /api/documents/:id/download - download a document
router.get('/documents/:id/download', async (req, res, next) => {
  try {
    const doc = await prisma.slideDocument.findUnique({ where: { id: req.params.id as string } });
    if (!doc) { res.status(404).json({ ok: false, error: 'Document not found' }); return; }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
    res.setHeader('Content-Length', doc.fileSize.toString());
    res.send(doc.data);
  } catch (err) { next(err); }
});

// DELETE /api/documents/:id - delete a document
router.delete('/documents/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.slideDocument.delete({ where: { id: req.params.id as string } });
    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

export default router;
