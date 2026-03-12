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

        await prisma.slide.create({
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
