import { registerToolHandler } from './toolExecutor.js';
import type { Tool } from './llm/types.js';
import prisma from '../lib/prisma.js';

// ---------------------------------------------------------------------------
// Platform Tools — full access to financeiscooked show content
// Read tools are available to all users. Write tools are admin-only.
// vote_cast is the one public write action.
// ---------------------------------------------------------------------------

export const PLATFORM_TOOLS: Tool[] = [
  // ── Read Tools (public) ──────────────────────────────────────────

  {
    name: 'platform__episodes_list',
    description: 'List all episodes of the financeiscooked show with segment and slide counts. Use this when the user asks about episodes, show content, or what topics have been covered.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'platform__episode_get',
    description: 'Get full details of a specific episode including all its segments and slides. Use this when the user asks about a specific episode.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The episode slug (URL-friendly identifier)' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'platform__votes_get',
    description: 'Get vote counts for all slides in a specific episode. Use this when the user asks about audience reactions or popular content.',
    inputSchema: {
      type: 'object',
      properties: {
        episodeSlug: { type: 'string', description: 'The episode slug' },
      },
      required: ['episodeSlug'],
    },
  },
  {
    name: 'platform__stats',
    description: 'Get platform statistics including counts of episodes, segments, slides, and votes.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ── Vote (public write) ──────────────────────────────────────────

  {
    name: 'platform__vote_cast',
    description: 'Cast an upvote or downvote on a slide. Use this when the user wants to vote on content.',
    inputSchema: {
      type: 'object',
      properties: {
        slideId: { type: 'string', description: 'The slide ID to vote on' },
        direction: { type: 'string', enum: ['up', 'down'], description: 'Vote direction: up or down' },
      },
      required: ['slideId', 'direction'],
    },
  },

  // ── Episode Write Tools (admin) ──────────────────────────────────

  {
    name: 'platform__episode_create',
    description: '[Admin] Create a new episode. Requires admin privileges.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'URL-friendly slug for the episode' },
        title: { type: 'string', description: 'Episode title' },
        date: { type: 'string', description: 'Air date (ISO format, optional)' },
        sortOrder: { type: 'number', description: 'Display order (optional)' },
      },
      required: ['slug', 'title'],
    },
  },
  {
    name: 'platform__episode_update',
    description: '[Admin] Update an existing episode. Requires admin privileges.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Episode slug to update' },
        title: { type: 'string', description: 'New title (optional)' },
        date: { type: 'string', description: 'New air date ISO (optional)' },
        sortOrder: { type: 'number', description: 'New display order (optional)' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'platform__episode_delete',
    description: '[Admin] Delete an episode and all its content. Requires admin privileges.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Episode slug to delete' },
      },
      required: ['slug'],
    },
  },

  // ── Segment Write Tools (admin) ──────────────────────────────────

  {
    name: 'platform__segment_create',
    description: '[Admin] Create a new segment within an episode. Requires admin privileges.',
    inputSchema: {
      type: 'object',
      properties: {
        episodeSlug: { type: 'string', description: 'Parent episode slug' },
        slug: { type: 'string', description: 'Segment slug' },
        name: { type: 'string', description: 'Segment name' },
        status: { type: 'string', enum: ['proposed', 'final'], description: 'Content status (optional)' },
        sortOrder: { type: 'number', description: 'Display order (optional)' },
      },
      required: ['episodeSlug', 'slug', 'name'],
    },
  },
  {
    name: 'platform__segment_update',
    description: '[Admin] Update an existing segment. Requires admin privileges.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Segment ID' },
        name: { type: 'string', description: 'New name (optional)' },
        status: { type: 'string', enum: ['proposed', 'final'], description: 'Content status (optional)' },
        sortOrder: { type: 'number', description: 'New display order (optional)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'platform__segment_delete',
    description: '[Admin] Delete a segment and its slides. Requires admin privileges.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Segment ID to delete' },
      },
      required: ['id'],
    },
  },

  // ── Slide Write Tools (admin) ────────────────────────────────────

  {
    name: 'platform__slide_create',
    description: '[Admin] Create a new slide within a segment. Requires admin privileges.',
    inputSchema: {
      type: 'object',
      properties: {
        segmentId: { type: 'string', description: 'Parent segment ID' },
        type: { type: 'string', enum: ['text', 'link', 'image', 'gallery'], description: 'Slide type' },
        title: { type: 'string', description: 'Slide title' },
        url: { type: 'string', description: 'Link or image URL (optional)' },
        notes: { type: 'string', description: 'Presenter notes (optional)' },
        details: { type: 'string', description: 'Additional details (optional)' },
        status: { type: 'string', enum: ['proposed', 'final'], description: 'Content status (optional)' },
        bullets: { type: 'array', items: { type: 'string' }, description: 'Bullet points (optional)' },
        sortOrder: { type: 'number', description: 'Display order (optional)' },
      },
      required: ['segmentId', 'type', 'title'],
    },
  },
  {
    name: 'platform__slide_update',
    description: '[Admin] Update an existing slide. Requires admin privileges.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Slide ID' },
        type: { type: 'string', enum: ['text', 'link', 'image', 'gallery'], description: 'Slide type (optional)' },
        title: { type: 'string', description: 'New title (optional)' },
        url: { type: 'string', description: 'Link or image URL (optional)' },
        notes: { type: 'string', description: 'Presenter notes (optional)' },
        details: { type: 'string', description: 'Additional details (optional)' },
        status: { type: 'string', enum: ['proposed', 'final'], description: 'Content status (optional)' },
        bullets: { type: 'array', items: { type: 'string' }, description: 'Bullet points (optional)' },
        sortOrder: { type: 'number', description: 'Display order (optional)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'platform__slide_delete',
    description: '[Admin] Delete a slide. Requires admin privileges.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Slide ID to delete' },
      },
      required: ['id'],
    },
  },
  {
    name: 'platform__slide_move',
    description: '[Admin] Move a slide to another segment. Requires admin privileges.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Slide ID to move' },
        targetSegmentId: { type: 'string', description: 'Target segment ID (optional if using slugs)' },
        targetEpisodeSlug: { type: 'string', description: 'Target episode slug (optional)' },
        targetSegmentSlug: { type: 'string', description: 'Target segment slug (optional)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'platform__slide_finalize',
    description: '[Admin] Mark a slide and its parent segment as finalized. Requires admin privileges.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Slide ID to finalize' },
      },
      required: ['id'],
    },
  },
];

// ---------------------------------------------------------------------------
// Register platform__ prefix handler
// ---------------------------------------------------------------------------
registerToolHandler('platform__', async (toolName, input, _context) => {
  switch (toolName) {

    // ── Read Tools ───────────────────────────────────────────────

    case 'platform__episodes_list': {
      const episodes = await prisma.episode.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { segments: true } },
          segments: {
            include: {
              _count: { select: { slides: true } },
            },
          },
        },
      });

      const data = episodes.map(ep => ({
        slug: ep.slug,
        title: ep.title,
        date: ep.date,
        sortOrder: ep.sortOrder,
        segmentCount: ep._count.segments,
        slideCount: ep.segments.reduce((sum, s) => sum + s._count.slides, 0),
      }));

      return JSON.stringify({ episodes: data, count: data.length });
    }

    case 'platform__episode_get': {
      if (!input.slug) return JSON.stringify({ error: 'slug is required' });

      const episode = await prisma.episode.findUnique({
        where: { slug: input.slug },
        include: {
          segments: {
            orderBy: { sortOrder: 'asc' },
            include: {
              slides: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      if (!episode) return JSON.stringify({ error: `Episode "${input.slug}" not found` });

      return JSON.stringify({
        slug: episode.slug,
        title: episode.title,
        date: episode.date,
        segments: episode.segments.map(seg => ({
          id: seg.id,
          slug: seg.slug,
          name: seg.name,
          status: seg.status,
          slides: seg.slides.map(slide => ({
            id: slide.id,
            type: slide.type,
            title: slide.title,
            url: slide.url,
            notes: slide.notes,
            details: slide.details,
            bullets: slide.bullets,
            status: slide.status,
          })),
        })),
      });
    }

    case 'platform__votes_get': {
      if (!input.episodeSlug) return JSON.stringify({ error: 'episodeSlug is required' });

      const episode = await prisma.episode.findUnique({
        where: { slug: input.episodeSlug },
        include: {
          segments: {
            include: {
              slides: {
                include: { votes: true },
              },
            },
          },
        },
      });

      if (!episode) return JSON.stringify({ error: `Episode "${input.episodeSlug}" not found` });

      const voteData: Record<string, { up: number; down: number; title: string }> = {};
      for (const seg of episode.segments) {
        for (const slide of seg.slides) {
          const up = slide.votes.filter(v => v.direction === 'up').length;
          const down = slide.votes.filter(v => v.direction === 'down').length;
          voteData[slide.id] = { up, down, title: slide.title };
        }
      }

      return JSON.stringify({ episodeSlug: input.episodeSlug, votes: voteData });
    }

    case 'platform__stats': {
      const [episodes, segments, slides, votes] = await Promise.all([
        prisma.episode.count(),
        prisma.segment.count(),
        prisma.slide.count(),
        prisma.vote.count(),
      ]);
      return JSON.stringify({ episodes, segments, slides, votes });
    }

    // ── Vote (public write) ──────────────────────────────────────

    case 'platform__vote_cast': {
      if (!input.slideId || !input.direction) {
        return JSON.stringify({ error: 'slideId and direction are required' });
      }
      if (!['up', 'down'].includes(input.direction)) {
        return JSON.stringify({ error: 'direction must be "up" or "down"' });
      }

      const slide = await prisma.slide.findUnique({ where: { id: input.slideId } });
      if (!slide) return JSON.stringify({ error: `Slide ${input.slideId} not found` });

      await prisma.vote.create({
        data: {
          slideId: input.slideId,
          direction: input.direction,
        },
      });

      return JSON.stringify({ success: true, slideId: input.slideId, direction: input.direction });
    }

    // ── Episode Write (admin) ────────────────────────────────────

    case 'platform__episode_create': {
      if (!input.slug || !input.title) return JSON.stringify({ error: 'slug and title are required' });

      try {
        const episode = await prisma.episode.create({
          data: {
            slug: input.slug,
            title: input.title,
            date: input.date || null,
            sortOrder: input.sortOrder ?? 0,
          },
        });
        return JSON.stringify({ success: true, slug: episode.slug, title: episode.title });
      } catch (err: any) {
        return JSON.stringify({ error: err.message || 'Failed to create episode' });
      }
    }

    case 'platform__episode_update': {
      if (!input.slug) return JSON.stringify({ error: 'slug is required' });

      const existing = await prisma.episode.findUnique({ where: { slug: input.slug } });
      if (!existing) return JSON.stringify({ error: `Episode "${input.slug}" not found` });

      const data: any = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.date !== undefined) data.date = input.date || null;
      if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

      const updated = await prisma.episode.update({ where: { slug: input.slug }, data });
      return JSON.stringify({ success: true, slug: updated.slug, title: updated.title });
    }

    case 'platform__episode_delete': {
      if (!input.slug) return JSON.stringify({ error: 'slug is required' });

      const existing = await prisma.episode.findUnique({ where: { slug: input.slug } });
      if (!existing) return JSON.stringify({ error: `Episode "${input.slug}" not found` });

      await prisma.episode.delete({ where: { slug: input.slug } });
      return JSON.stringify({ success: true, deleted: input.slug });
    }

    // ── Segment Write (admin) ────────────────────────────────────

    case 'platform__segment_create': {
      if (!input.episodeSlug || !input.slug || !input.name) {
        return JSON.stringify({ error: 'episodeSlug, slug, and name are required' });
      }

      const ep = await prisma.episode.findUnique({ where: { slug: input.episodeSlug } });
      if (!ep) return JSON.stringify({ error: `Episode "${input.episodeSlug}" not found` });

      const segment = await prisma.segment.create({
        data: {
          episodeId: ep.id,
          slug: input.slug,
          name: input.name,
          status: input.status || 'proposed',
          sortOrder: input.sortOrder ?? 0,
        },
      });

      return JSON.stringify({ success: true, id: segment.id, name: segment.name });
    }

    case 'platform__segment_update': {
      if (!input.id) return JSON.stringify({ error: 'id is required' });

      const seg = await prisma.segment.findUnique({ where: { id: input.id } });
      if (!seg) return JSON.stringify({ error: `Segment ${input.id} not found` });

      const data: any = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.status !== undefined) data.status = input.status;
      if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

      const updated = await prisma.segment.update({ where: { id: input.id }, data });
      return JSON.stringify({ success: true, id: updated.id, name: updated.name });
    }

    case 'platform__segment_delete': {
      if (!input.id) return JSON.stringify({ error: 'id is required' });

      const seg = await prisma.segment.findUnique({ where: { id: input.id } });
      if (!seg) return JSON.stringify({ error: `Segment ${input.id} not found` });

      await prisma.segment.delete({ where: { id: input.id } });
      return JSON.stringify({ success: true, deleted: input.id });
    }

    // ── Slide Write (admin) ──────────────────────────────────────

    case 'platform__slide_create': {
      if (!input.segmentId || !input.type || !input.title) {
        return JSON.stringify({ error: 'segmentId, type, and title are required' });
      }

      const seg = await prisma.segment.findUnique({ where: { id: input.segmentId } });
      if (!seg) return JSON.stringify({ error: `Segment ${input.segmentId} not found` });

      const slide = await prisma.slide.create({
        data: {
          segmentId: input.segmentId,
          type: input.type,
          title: input.title,
          url: input.url || null,
          notes: input.notes || null,
          details: input.details || null,
          status: input.status || 'proposed',
          bullets: input.bullets || [],
          sortOrder: input.sortOrder ?? 0,
        },
      });

      return JSON.stringify({ success: true, id: slide.id, title: slide.title });
    }

    case 'platform__slide_update': {
      if (!input.id) return JSON.stringify({ error: 'id is required' });

      const slide = await prisma.slide.findUnique({ where: { id: input.id } });
      if (!slide) return JSON.stringify({ error: `Slide ${input.id} not found` });

      const data: any = {};
      if (input.type !== undefined) data.type = input.type;
      if (input.title !== undefined) data.title = input.title;
      if (input.url !== undefined) data.url = input.url;
      if (input.notes !== undefined) data.notes = input.notes;
      if (input.details !== undefined) data.details = input.details;
      if (input.status !== undefined) data.status = input.status;
      if (input.bullets !== undefined) data.bullets = input.bullets;
      if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

      const updated = await prisma.slide.update({ where: { id: input.id }, data });
      return JSON.stringify({ success: true, id: updated.id, title: updated.title });
    }

    case 'platform__slide_delete': {
      if (!input.id) return JSON.stringify({ error: 'id is required' });

      const slide = await prisma.slide.findUnique({ where: { id: input.id } });
      if (!slide) return JSON.stringify({ error: `Slide ${input.id} not found` });

      await prisma.slide.delete({ where: { id: input.id } });
      return JSON.stringify({ success: true, deleted: input.id });
    }

    case 'platform__slide_move': {
      if (!input.id) return JSON.stringify({ error: 'id is required' });

      const slide = await prisma.slide.findUnique({ where: { id: input.id } });
      if (!slide) return JSON.stringify({ error: `Slide ${input.id} not found` });

      let targetSegId: string | null = null;

      if (input.targetSegmentId) {
        targetSegId = input.targetSegmentId;
      } else if (input.targetEpisodeSlug && input.targetSegmentSlug) {
        const ep = await prisma.episode.findUnique({
          where: { slug: input.targetEpisodeSlug },
          include: { segments: true },
        });
        if (!ep) return JSON.stringify({ error: `Episode "${input.targetEpisodeSlug}" not found` });
        const seg = ep.segments.find(s => s.slug === input.targetSegmentSlug);
        if (!seg) return JSON.stringify({ error: `Segment "${input.targetSegmentSlug}" not found in episode` });
        targetSegId = seg.id;
      }

      if (!targetSegId) return JSON.stringify({ error: 'No target segment specified' });

      const updated = await prisma.slide.update({
        where: { id: input.id },
        data: { segmentId: targetSegId },
      });

      return JSON.stringify({ success: true, id: updated.id, newSegmentId: targetSegId });
    }

    case 'platform__slide_finalize': {
      if (!input.id) return JSON.stringify({ error: 'id is required' });

      const slide = await prisma.slide.findUnique({ where: { id: input.id } });
      if (!slide) return JSON.stringify({ error: `Slide ${input.id} not found` });

      await prisma.slide.update({
        where: { id: input.id },
        data: { status: 'final' },
      });

      // Also finalize the parent segment
      await prisma.segment.update({
        where: { id: slide.segmentId },
        data: { status: 'final' },
      });

      return JSON.stringify({ success: true, id: input.id, status: 'final' });
    }

    default:
      return JSON.stringify({ error: `Unknown platform tool: ${toolName}` });
  }
});
