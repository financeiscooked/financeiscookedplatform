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

const VALID_SLIDE_TYPES = new Set(['text', 'link', 'image', 'gallery']);
const VALID_STATUSES = new Set(['proposed', 'final']);

function normalizeSlideType(type: string): string {
  return VALID_SLIDE_TYPES.has(type) ? type : 'text';
}

function normalizeStatus(status: string | undefined): string {
  return status && VALID_STATUSES.has(status) ? status : 'proposed';
}

export async function seedFromJson(seedDir: string): Promise<{ episodes: number; segments: number; slides: number }> {
  // Clear existing data for clean seed
  await prisma.vote.deleteMany();
  await prisma.slideImage.deleteMany();
  await prisma.slide.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.episode.deleteMany();

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
        update: { name: seg.name, status: normalizeStatus(seg.status) as any, sortOrder: si },
        create: {
          episodeId: episode.id,
          slug: seg.id,
          name: seg.name,
          status: normalizeStatus(seg.status) as any,
          sortOrder: si,
        },
      });
      totalSegments++;

      for (let sli = 0; sli < seg.slides.length; sli++) {
        const slide = seg.slides[sli];

        await prisma.slide.create({
          data: {
            segmentId: segment.id,
            type: normalizeSlideType(slide.type) as any,
            title: slide.title,
            url: slide.url ?? null,
            notes: slide.notes ?? null,
            details: slide.details ?? null,
            status: normalizeStatus(slide.status) as any,
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
