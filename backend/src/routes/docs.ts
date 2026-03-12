import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __dirname = dirname(fileURLToPath(import.meta.url));
// In dev: __dirname is src/routes/, HTML at src/api-docs/
// In prod: __dirname is dist/routes/, HTML still at src/api-docs/
const devPath = join(__dirname, '../api-docs/api-docs.html');
const prodPath = join(__dirname, '../../src/api-docs/api-docs.html');
const docsPath = existsSync(devPath) ? devPath : prodPath;
const docsHtml = readFileSync(docsPath, 'utf-8');

// GET /api/docs - serve interactive API documentation
router.get('/docs', (_req, res) => {
  res.type('html').send(docsHtml);
});

export default router;
