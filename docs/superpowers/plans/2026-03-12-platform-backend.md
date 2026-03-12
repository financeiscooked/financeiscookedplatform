# financeiscooked Platform Backend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Express + TypeScript backend with PostgreSQL (Prisma), REST API, seed migration, and Swagger docs.

**Architecture:** Express.js server with Prisma ORM connecting to PostgreSQL. Routes organized by resource (episodes, segments, slides, votes, admin). Seed script migrates existing JSON episode data.

**Tech Stack:** Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL, Swagger UI

---

## Chunk 1: Project Scaffold + Prisma Schema

### Task 1: Initialize backend project

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`

- [ ] **Step 1: Create backend directory and initialize**

```bash
cd /Users/oreph/Desktop/APPs/financeiscookedplatform
mkdir -p backend/src/routes backend/src/middleware backend/src/seed backend/prisma
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "financeiscooked-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^6.5.0",
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/swagger-ui-express": "^4.1.7",
    "prisma": "^6.5.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create .env.example**

```
DATABASE_URL=postgresql://user:password@localhost:5432/financeiscooked
PORT=3001
```

- [ ] **Step 5: Install dependencies**

```bash
cd /Users/oreph/Desktop/APPs/financeiscookedplatform/backend && npm install
```

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/tsconfig.json backend/.env.example backend/package-lock.json
git commit -m "feat: initialize backend project with dependencies"
```

### Task 2: Prisma schema

**Files:**
- Create: `backend/prisma/schema.prisma`

- [ ] **Step 1: Write Prisma schema with all models**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  anonymous
  basic
  advanced
  admin
}

enum ContentStatus {
  proposed
  final
}

enum SlideType {
  text
  link
  image
  gallery
}

enum VoteDirection {
  up
  down
}

model User {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email       String?  @unique @db.VarChar(255)
  displayName String?  @map("display_name") @db.VarChar(100)
  avatarUrl   String?  @map("avatar_url")
  role        UserRole @default(anonymous)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz()

  sessions Session[]
  votes    Vote[]

  @@map("users")
}

model Session {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  token     String   @unique @db.VarChar(255)
  expiresAt DateTime @map("expires_at") @db.Timestamptz()
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Episode {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug      String   @unique @db.VarChar(50)
  title     String   @db.VarChar(255)
  date      String?  @db.VarChar(50)
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz()

  segments Segment[]

  @@map("episodes")
}

model Segment {
  id        String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  episodeId String        @map("episode_id") @db.Uuid
  slug      String        @db.VarChar(100)
  name      String        @db.VarChar(255)
  status    ContentStatus @default(proposed)
  sortOrder Int           @default(0) @map("sort_order")
  createdAt DateTime      @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime      @default(now()) @updatedAt @map("updated_at") @db.Timestamptz()

  episode Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  slides  Slide[]

  @@unique([episodeId, slug])
  @@map("segments")
}

model Slide {
  id        String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  segmentId String        @map("segment_id") @db.Uuid
  type      SlideType
  title     String        @db.VarChar(500)
  url       String?
  notes     String?
  details   String?
  status    ContentStatus @default(proposed)
  bullets   Json          @default("[]")
  sortOrder Int           @default(0) @map("sort_order")
  createdAt DateTime      @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime      @default(now()) @updatedAt @map("updated_at") @db.Timestamptz()

  segment Segment      @relation(fields: [segmentId], references: [id], onDelete: Cascade)
  images  SlideImage[]
  votes   Vote[]

  @@map("slides")
}

model SlideImage {
  id        String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slideId   String  @map("slide_id") @db.Uuid
  src       String
  alt       String? @db.VarChar(255)
  sortOrder Int     @default(0) @map("sort_order")

  slide Slide @relation(fields: [slideId], references: [id], onDelete: Cascade)

  @@map("slide_images")
}

model Vote {
  id        String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slideId   String        @map("slide_id") @db.Uuid
  userId    String?       @map("user_id") @db.Uuid
  direction VoteDirection
  createdAt DateTime      @default(now()) @map("created_at") @db.Timestamptz()

  slide Slide @relation(fields: [slideId], references: [id], onDelete: Cascade)
  user  User? @relation(fields: [userId], references: [id])

  @@index([slideId])
  @@map("votes")
}
```

- [ ] **Step 2: Generate Prisma client**

```bash
cd /Users/oreph/Desktop/APPs/financeiscookedplatform/backend && npx prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat: add Prisma schema with all models"
```

---

## Chunk 2: Express Server + Routes

### Task 3: Express server entry point + error handler

**Files:**
- Create: `backend/src/index.ts`
- Create: `backend/src/middleware/error-handler.ts`
- Create: `backend/src/lib/prisma.ts`

- [ ] **Step 1: Create Prisma client singleton**

`backend/src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export default prisma;
```

- [ ] **Step 2: Create error handler middleware**

`backend/src/middleware/error-handler.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
}
```

- [ ] **Step 3: Create Express server**

`backend/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error-handler.js';
import episodesRouter from './routes/episodes.js';
import segmentsRouter from './routes/segments.js';
import slidesRouter from './routes/slides.js';
import votesRouter from './routes/votes.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
});

// Routes
app.use('/api', episodesRouter);
app.use('/api', segmentsRouter);
app.use('/api', slidesRouter);
app.use('/api', votesRouter);
app.use('/api/admin', adminRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`financeiscooked backend running on port ${PORT}`);
});

export default app;
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/index.ts backend/src/middleware/error-handler.ts backend/src/lib/prisma.ts
git commit -m "feat: add Express server entry point with error handling"
```

### Task 4: Episodes routes

**Files:**
- Create: `backend/src/routes/episodes.ts`

- [ ] **Step 1: Implement episodes CRUD**

```typescript
import { Router } from 'express';
import prisma from '../lib/prisma.js';

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
      where: { slug: req.params.slug },
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
router.post('/episodes', async (req, res, next) => {
  try {
    const { slug, title, date, sortOrder } = req.body;
    const episode = await prisma.episode.create({
      data: { slug, title, date, sortOrder: sortOrder ?? 0 },
    });
    res.status(201).json({ ok: true, data: { id: episode.slug, title: episode.title } });
  } catch (err) { next(err); }
});

// PUT /api/episodes/:slug - update
router.put('/episodes/:slug', async (req, res, next) => {
  try {
    const { title, date, sortOrder } = req.body;
    const episode = await prisma.episode.update({
      where: { slug: req.params.slug },
      data: { ...(title !== undefined && { title }), ...(date !== undefined && { date }), ...(sortOrder !== undefined && { sortOrder }) },
    });
    res.json({ ok: true, data: { id: episode.slug, title: episode.title } });
  } catch (err) { next(err); }
});

// DELETE /api/episodes/:slug
router.delete('/episodes/:slug', async (req, res, next) => {
  try {
    await prisma.episode.delete({ where: { slug: req.params.slug } });
    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/routes/episodes.ts
git commit -m "feat: add episodes CRUD routes"
```

### Task 5: Segments routes

**Files:**
- Create: `backend/src/routes/segments.ts`

- [ ] **Step 1: Implement segments CRUD**

```typescript
import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// POST /api/episodes/:slug/segments
router.post('/episodes/:slug/segments', async (req, res, next) => {
  try {
    const episode = await prisma.episode.findUnique({ where: { slug: req.params.slug } });
    if (!episode) { res.status(404).json({ ok: false, error: 'Episode not found' }); return; }

    const { slug, name, status, sortOrder } = req.body;
    const segment = await prisma.segment.create({
      data: { episodeId: episode.id, slug, name, status: status ?? 'proposed', sortOrder: sortOrder ?? 0 },
    });
    res.status(201).json({ ok: true, data: { id: segment.id, slug: segment.slug, name: segment.name } });
  } catch (err) { next(err); }
});

// PUT /api/segments/:id
router.put('/segments/:id', async (req, res, next) => {
  try {
    const { name, status, sortOrder } = req.body;
    const segment = await prisma.segment.update({
      where: { id: req.params.id },
      data: { ...(name !== undefined && { name }), ...(status !== undefined && { status }), ...(sortOrder !== undefined && { sortOrder }) },
    });
    res.json({ ok: true, data: { id: segment.id, slug: segment.slug, name: segment.name, status: segment.status } });
  } catch (err) { next(err); }
});

// DELETE /api/segments/:id
router.delete('/segments/:id', async (req, res, next) => {
  try {
    await prisma.segment.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/routes/segments.ts
git commit -m "feat: add segments CRUD routes"
```

### Task 6: Slides routes

**Files:**
- Create: `backend/src/routes/slides.ts`

- [ ] **Step 1: Implement slides CRUD + move + finalize**

```typescript
import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// POST /api/segments/:id/slides
router.post('/segments/:id/slides', async (req, res, next) => {
  try {
    const { type, title, url, notes, details, status, bullets, sortOrder } = req.body;
    const slide = await prisma.slide.create({
      data: {
        segmentId: req.params.id,
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
router.put('/slides/:id', async (req, res, next) => {
  try {
    const { type, title, url, notes, details, status, bullets, sortOrder } = req.body;
    const slide = await prisma.slide.update({
      where: { id: req.params.id },
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
router.delete('/slides/:id', async (req, res, next) => {
  try {
    await prisma.slide.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: null });
  } catch (err) { next(err); }
});

// POST /api/slides/:id/move - move slide to different segment
router.post('/slides/:id/move', async (req, res, next) => {
  try {
    const { targetSegmentId, targetEpisodeSlug, targetSegmentSlug } = req.body;

    let segmentId = targetSegmentId;

    // If episode slug + segment slug provided, resolve to segment ID
    if (!segmentId && targetEpisodeSlug && targetSegmentSlug) {
      const episode = await prisma.episode.findUnique({ where: { slug: targetEpisodeSlug } });
      if (!episode) { res.status(404).json({ ok: false, error: 'Target episode not found' }); return; }

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
      where: { id: req.params.id },
      data: { segmentId },
    });
    res.json({ ok: true, data: { id: slide.id, title: slide.title } });
  } catch (err) { next(err); }
});

// POST /api/slides/:id/finalize
router.post('/slides/:id/finalize', async (req, res, next) => {
  try {
    const slide = await prisma.slide.update({
      where: { id: req.params.id },
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/routes/slides.ts
git commit -m "feat: add slides CRUD + move + finalize routes"
```

### Task 7: Votes routes

**Files:**
- Create: `backend/src/routes/votes.ts`

- [ ] **Step 1: Implement voting**

```typescript
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

    if (!episode) { res.status(404).json({ ok: false, error: 'Episode not found' }); return; }

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
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/routes/votes.ts
git commit -m "feat: add voting routes"
```

### Task 8: Admin routes + seed script

**Files:**
- Create: `backend/src/routes/admin.ts`
- Create: `backend/src/seed/seed-from-json.ts`

- [ ] **Step 1: Create seed function**

`backend/src/seed/seed-from-json.ts`:
```typescript
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import prisma from '../lib/prisma.js';

interface JsonSlide {
  type: string;
  title: string;
  url?: string;
  notes?: string;
  details?: string;
  status?: string;
  bullets?: string[];
  images?: { src: string; alt?: string }[];
}

interface JsonSegment {
  id: string;
  name: string;
  status?: string;
  slides: JsonSlide[];
}

interface JsonEpisode {
  id: string;
  title: string;
  date?: string;
  segments: JsonSegment[];
}

export async function seedFromJson(seedDir: string): Promise<{ episodes: number; segments: number; slides: number }> {
  const files = readdirSync(seedDir).filter(f => f.endsWith('.json') && f !== 'index.json');
  let totalEpisodes = 0, totalSegments = 0, totalSlides = 0;

  for (const file of files) {
    const raw = readFileSync(join(seedDir, file), 'utf-8');
    const ep: JsonEpisode = JSON.parse(raw);

    // Extract sort order from slug (ep1 → 1, ep2 → 2, backlog → 999)
    const num = parseInt(ep.id.replace('ep', ''), 10);
    const sortOrder = isNaN(num) ? 999 : num;

    const episode = await prisma.episode.upsert({
      where: { slug: ep.id },
      update: { title: ep.title, date: ep.date ?? null },
      create: { slug: ep.id, title: ep.title, date: ep.date ?? null, sortOrder },
    });
    totalEpisodes++;

    for (let si = 0; si < ep.segments.length; si++) {
      const seg = ep.segments[si];

      const segment = await prisma.segment.upsert({
        where: { episodeId_slug: { episodeId: episode.id, slug: seg.id } },
        update: { name: seg.name, status: (seg.status as any) ?? 'proposed', sortOrder: si },
        create: {
          episodeId: episode.id,
          slug: seg.id,
          name: seg.name,
          status: (seg.status as any) ?? 'proposed',
          sortOrder: si,
        },
      });
      totalSegments++;

      for (let sli = 0; sli < seg.slides.length; sli++) {
        const slide = seg.slides[sli];

        const created = await prisma.slide.create({
          data: {
            segmentId: segment.id,
            type: slide.type as any,
            title: slide.title,
            url: slide.url ?? null,
            notes: slide.notes ?? null,
            details: slide.details ?? null,
            status: (slide.status as any) ?? 'proposed',
            bullets: slide.bullets ?? [],
            sortOrder: sli,
            ...(slide.images?.length ? {
              images: {
                create: slide.images.map((img, idx) => ({
                  src: img.src,
                  alt: img.alt ?? null,
                  sortOrder: idx,
                })),
              },
            } : {}),
          },
        });
        totalSlides++;
      }
    }
  }

  return { episodes: totalEpisodes, segments: totalSegments, slides: totalSlides };
}
```

- [ ] **Step 2: Create admin routes**

`backend/src/routes/admin.ts`:
```typescript
import { Router } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { seedFromJson } from '../seed/seed-from-json.js';

const router = Router();

// POST /api/admin/seed
router.post('/seed', async (req, res, next) => {
  try {
    const seedDir = join(dirname(fileURLToPath(import.meta.url)), '../../../seed-data');
    const result = await seedFromJson(seedDir);
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
});

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/admin.ts backend/src/seed/seed-from-json.ts
git commit -m "feat: add admin seed route and JSON migration script"
```

---

## Chunk 3: Seed Data + Local Testing

### Task 9: Copy seed data

- [ ] **Step 1: Copy JSON files from soundboard**

```bash
mkdir -p /Users/oreph/Desktop/APPs/financeiscookedplatform/seed-data
cp /Users/oreph/Desktop/APPs/financeiscooked/public/episodes/*.json /Users/oreph/Desktop/APPs/financeiscookedplatform/seed-data/
```

- [ ] **Step 2: Commit seed data**

```bash
git add seed-data/
git commit -m "feat: add seed data from existing soundboard"
```

### Task 10: Local database test

- [ ] **Step 1: Create .env with local PostgreSQL URL**

Create `backend/.env` (not committed) with local DATABASE_URL.

- [ ] **Step 2: Push schema to database**

```bash
cd /Users/oreph/Desktop/APPs/financeiscookedplatform/backend && npx prisma db push
```

- [ ] **Step 3: Start server and test health endpoint**

```bash
cd /Users/oreph/Desktop/APPs/financeiscookedplatform/backend && npm run dev
# In another terminal: curl http://localhost:3001/api/health
```

- [ ] **Step 4: Test seed endpoint**

```bash
curl -X POST http://localhost:3001/api/admin/seed
```

- [ ] **Step 5: Test episode retrieval**

```bash
curl http://localhost:3001/api/episodes
curl http://localhost:3001/api/episodes/ep2
```

---

## Chunk 4: Swagger Documentation

### Task 11: Generate Swagger docs using /opswaggerbuilder

- [ ] **Step 1: Invoke /opswaggerbuilder skill to generate API documentation**

Use the `/opswaggerbuilder` skill with all endpoints from the spec.

- [ ] **Step 2: Mount Swagger UI in Express**

Add swagger route to `backend/src/index.ts`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/swagger/
git commit -m "feat: add Swagger API documentation"
```

---

## Chunk 5: Railway Deployment

### Task 12: Deploy to Railway

- [ ] **Step 1: Create Railway project + PostgreSQL service**

- [ ] **Step 2: Configure backend service with build command and start command**

Build: `cd backend && npm install && npx prisma generate && npm run build`
Start: `cd backend && npx prisma db push && node dist/index.js`

- [ ] **Step 3: Deploy and verify health endpoint**

- [ ] **Step 4: Run seed via deployed endpoint**

- [ ] **Step 5: Commit any deployment config files**
