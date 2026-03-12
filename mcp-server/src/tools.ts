import { z } from 'zod';
import { FinanceIsCookedClient } from './api-client.js';

interface ToolDef {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  handler: (client: FinanceIsCookedClient, args: any) => Promise<any>;
}

export const tools: ToolDef[] = [
  // ── Episodes ──────────────────────────────────────────────

  {
    name: 'episodes_list',
    description: 'List all episodes with segment/slide counts',
    inputSchema: z.object({}),
    handler: async (client) => client.listEpisodes(),
  },
  {
    name: 'episode_get',
    description: 'Get full episode with segments and slides',
    inputSchema: z.object({
      slug: z.string().describe('episode slug'),
    }),
    handler: async (client, args: { slug: string }) => client.getEpisode(args.slug),
  },
  {
    name: 'episode_create',
    description: 'Create a new episode',
    inputSchema: z.object({
      slug: z.string().describe('URL-friendly slug'),
      title: z.string().describe('episode title'),
      date: z.string().optional().describe('air date (ISO)'),
      sortOrder: z.number().optional().describe('display order'),
    }),
    handler: async (client, args: { slug: string; title: string; date?: string; sortOrder?: number }) =>
      client.createEpisode(args),
  },
  {
    name: 'episode_update',
    description: 'Update an existing episode',
    inputSchema: z.object({
      slug: z.string().describe('episode slug'),
      title: z.string().optional().describe('new title'),
      date: z.string().optional().describe('new air date (ISO)'),
      sortOrder: z.number().optional().describe('new display order'),
    }),
    handler: async (client, args: { slug: string; title?: string; date?: string; sortOrder?: number }) => {
      const { slug, ...data } = args;
      return client.updateEpisode(slug, data);
    },
  },
  {
    name: 'episode_delete',
    description: 'Delete an episode and all its content',
    inputSchema: z.object({
      slug: z.string().describe('episode slug'),
    }),
    handler: async (client, args: { slug: string }) => client.deleteEpisode(args.slug),
  },

  // ── Segments ──────────────────────────────────────────────

  {
    name: 'segment_create',
    description: 'Create a segment within an episode',
    inputSchema: z.object({
      episodeSlug: z.string().describe('parent episode slug'),
      slug: z.string().describe('segment slug'),
      name: z.string().describe('segment name'),
      status: z.enum(['proposed', 'final']).optional().describe('content status'),
      sortOrder: z.number().optional().describe('display order'),
    }),
    handler: async (client, args: { episodeSlug: string; slug: string; name: string; status?: string; sortOrder?: number }) => {
      const { episodeSlug, ...data } = args;
      return client.createSegment(episodeSlug, data);
    },
  },
  {
    name: 'segment_update',
    description: 'Update a segment',
    inputSchema: z.object({
      id: z.string().describe('segment ID'),
      name: z.string().optional().describe('new name'),
      status: z.enum(['proposed', 'final']).optional().describe('content status'),
      sortOrder: z.number().optional().describe('new display order'),
    }),
    handler: async (client, args: { id: string; name?: string; status?: string; sortOrder?: number }) => {
      const { id, ...data } = args;
      return client.updateSegment(id, data);
    },
  },
  {
    name: 'segment_delete',
    description: 'Delete a segment and its slides',
    inputSchema: z.object({
      id: z.string().describe('segment ID'),
    }),
    handler: async (client, args: { id: string }) => client.deleteSegment(args.id),
  },

  // ── Slides ────────────────────────────────────────────────

  {
    name: 'slide_create',
    description: 'Create a slide within a segment',
    inputSchema: z.object({
      segmentId: z.string().describe('parent segment ID'),
      type: z.enum(['text', 'link', 'image', 'gallery']).describe('slide type'),
      title: z.string().describe('slide title'),
      url: z.string().optional().describe('link or image URL'),
      notes: z.string().optional().describe('presenter notes'),
      details: z.string().optional().describe('additional details'),
      status: z.enum(['proposed', 'final']).optional().describe('content status'),
      bullets: z.array(z.string()).optional().describe('bullet points'),
      sortOrder: z.number().optional().describe('display order'),
    }),
    handler: async (client, args: { segmentId: string; type: string; title: string; url?: string; notes?: string; details?: string; status?: string; bullets?: string[]; sortOrder?: number }) => {
      const { segmentId, ...data } = args;
      return client.createSlide(segmentId, data);
    },
  },
  {
    name: 'slide_update',
    description: 'Update an existing slide',
    inputSchema: z.object({
      id: z.string().describe('slide ID'),
      type: z.enum(['text', 'link', 'image', 'gallery']).optional().describe('slide type'),
      title: z.string().optional().describe('new title'),
      url: z.string().optional().describe('link or image URL'),
      notes: z.string().optional().describe('presenter notes'),
      details: z.string().optional().describe('additional details'),
      status: z.enum(['proposed', 'final']).optional().describe('content status'),
      bullets: z.array(z.string()).optional().describe('bullet points'),
      sortOrder: z.number().optional().describe('display order'),
    }),
    handler: async (client, args: { id: string; type?: string; title?: string; url?: string; notes?: string; details?: string; status?: string; bullets?: string[]; sortOrder?: number }) => {
      const { id, ...data } = args;
      return client.updateSlide(id, data);
    },
  },
  {
    name: 'slide_delete',
    description: 'Delete a slide',
    inputSchema: z.object({
      id: z.string().describe('slide ID'),
    }),
    handler: async (client, args: { id: string }) => client.deleteSlide(args.id),
  },
  {
    name: 'slide_move',
    description: 'Move a slide to another segment',
    inputSchema: z.object({
      id: z.string().describe('slide ID'),
      targetSegmentId: z.string().optional().describe('target segment ID'),
      targetEpisodeSlug: z.string().optional().describe('target episode slug'),
      targetSegmentSlug: z.string().optional().describe('target segment slug'),
    }),
    handler: async (client, args: { id: string; targetSegmentId?: string; targetEpisodeSlug?: string; targetSegmentSlug?: string }) => {
      const { id, ...data } = args;
      return client.moveSlide(id, data);
    },
  },
  {
    name: 'slide_finalize',
    description: 'Finalize a slide and its parent segment',
    inputSchema: z.object({
      id: z.string().describe('slide ID'),
    }),
    handler: async (client, args: { id: string }) => client.finalizeSlide(args.id),
  },

  // ── Votes ─────────────────────────────────────────────────

  {
    name: 'vote_cast',
    description: 'Cast an up or down vote on a slide',
    inputSchema: z.object({
      slideId: z.string().describe('slide ID'),
      direction: z.enum(['up', 'down']).describe('vote direction'),
    }),
    handler: async (client, args: { slideId: string; direction: string }) =>
      client.castVote(args.slideId, args.direction),
  },
  {
    name: 'votes_get',
    description: 'Get vote counts for all slides in episode',
    inputSchema: z.object({
      episodeSlug: z.string().describe('episode slug'),
    }),
    handler: async (client, args: { episodeSlug: string }) =>
      client.getEpisodeVotes(args.episodeSlug),
  },

  // ── Admin ─────────────────────────────────────────────────

  {
    name: 'admin_seed',
    description: 'Seed database from JSON files',
    inputSchema: z.object({}),
    handler: async (client) => client.seedDatabase(),
  },
  {
    name: 'admin_stats',
    description: 'Get database statistics',
    inputSchema: z.object({}),
    handler: async (client) => client.getStats(),
  },
  {
    name: 'health_check',
    description: 'Check API health status',
    inputSchema: z.object({}),
    handler: async (client) => client.healthCheck(),
  },
];
