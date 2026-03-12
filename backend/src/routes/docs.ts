import { Router } from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsHtml = readFileSync(join(__dirname, '../api-docs/api-docs.html'), 'utf-8');

// GET /api/docs - serve interactive API documentation
router.get('/docs', (_req, res) => {
  res.type('html').send(docsHtml);
});

export default router;
