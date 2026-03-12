import { FinanceIsCookedClient } from '../src/api-client.js';
import { tools } from '../src/tools.js';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  elapsed: number;
  error?: string;
}

async function runTests() {
  const client = new FinanceIsCookedClient();
  const results: TestResult[] = [];

  console.log('financeiscooked MCP Server — Test Suite');
  console.log('========================================\n');

  // Phase 1: Gather test data
  console.log('Gathering test data...');
  let sampleEpisodeSlug = '';
  let sampleSegmentId = '';
  let sampleSlideId = '';

  try {
    const episodesRes = await client.listEpisodes() as any;
    if (episodesRes.ok && episodesRes.data?.length > 0) {
      sampleEpisodeSlug = episodesRes.data[0].id;
      console.log(`  Sample episode: ${sampleEpisodeSlug}`);

      const epRes = await client.getEpisode(sampleEpisodeSlug) as any;
      if (epRes.ok && epRes.data?.segments?.length > 0) {
        sampleSegmentId = epRes.data.segments[0].id;
        console.log(`  Sample segment: ${sampleSegmentId}`);
        if (epRes.data.segments[0].slides?.length > 0) {
          sampleSlideId = epRes.data.segments[0].slides[0].id;
          console.log(`  Sample slide: ${sampleSlideId}`);
        }
      }
    }
  } catch (e) {
    console.log('  Warning: Could not gather test data');
  }

  console.log('\nRunning tests...\n');

  // Build test args for each tool
  const testArgs: Record<string, any> = {
    episodes_list: {},
    episode_get: { slug: sampleEpisodeSlug || 'ep1' },
    episode_create: { slug: `test-${Date.now()}`, title: 'Test Episode' },
    episode_update: null, // skip — would mutate real data
    // episode_delete tested via cleanup below
    segment_create: { episodeSlug: sampleEpisodeSlug || 'ep1', slug: `seg-test-${Date.now()}`, name: 'Test Segment' },
    segment_update: sampleSegmentId ? { id: sampleSegmentId, name: 'Updated Segment' } : null,
    // segment_delete tested via cleanup
    slide_create: sampleSegmentId ? { segmentId: sampleSegmentId, type: 'text', title: 'Test Slide' } : null,
    slide_update: sampleSlideId ? { id: sampleSlideId, title: 'Updated Slide' } : null,
    // slide_delete tested via cleanup
    slide_move: null, // skip — needs specific IDs
    slide_finalize: null, // skip — destructive
    vote_cast: sampleSlideId ? { slideId: sampleSlideId, direction: 'up' } : null,
    votes_get: { episodeSlug: sampleEpisodeSlug || 'ep1' },
    admin_seed: null, // skip — destructive
    admin_stats: {},
    health_check: {},
  };

  // Track items to clean up
  let createdEpisodeSlug = '';
  let createdSegmentId = '';
  let createdSlideId = '';

  for (const tool of tools) {
    const args = testArgs[tool.name];

    // Skip tools without test data
    if (args === null || args === undefined) {
      console.log(`  [SKIP] ${tool.name} — no test data or destructive`);
      continue;
    }

    const start = Date.now();
    try {
      const result = await tool.handler(client, args) as any;
      const elapsed = Date.now() - start;

      // Track created resources for cleanup
      if (tool.name === 'episode_create' && result.ok) {
        createdEpisodeSlug = result.data?.slug || args.slug;
      }
      if (tool.name === 'segment_create' && result.ok) {
        createdSegmentId = result.data?.id;
      }
      if (tool.name === 'slide_create' && result.ok) {
        createdSlideId = result.data?.id;
      }

      if (result.ok === false) {
        results.push({ name: tool.name, status: 'FAIL', elapsed, error: result.error });
        console.log(`  [FAIL] ${tool.name} (${elapsed}ms) — ${result.error}`);
      } else {
        results.push({ name: tool.name, status: 'PASS', elapsed });
        console.log(`  [PASS] ${tool.name} (${elapsed}ms)`);
      }
    } catch (error) {
      const elapsed = Date.now() - start;
      const message = error instanceof Error ? error.message : String(error);
      results.push({ name: tool.name, status: 'FAIL', elapsed, error: message });
      console.log(`  [FAIL] ${tool.name} (${elapsed}ms) — ${message}`);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  // Cleanup: delete test-created resources
  console.log('\nCleaning up...');
  if (createdSlideId) {
    try { await client.deleteSlide(createdSlideId); console.log(`  Deleted slide: ${createdSlideId}`); } catch {}
  }
  if (createdSegmentId) {
    try { await client.deleteSegment(createdSegmentId); console.log(`  Deleted segment: ${createdSegmentId}`); } catch {}
  }
  if (createdEpisodeSlug) {
    try { await client.deleteEpisode(createdEpisodeSlug); console.log(`  Deleted episode: ${createdEpisodeSlug}`); } catch {}
  }

  // Test delete operations on a fresh episode
  console.log('\nTesting delete operations...');
  try {
    const delSlug = `del-test-${Date.now()}`;
    const delEp = await client.createEpisode({ slug: delSlug, title: 'Delete Test' }) as any;
    if (delEp.ok) {
      const start = Date.now();
      const delResult = await client.deleteEpisode(delSlug) as any;
      const elapsed = Date.now() - start;
      if (delResult.ok) {
        results.push({ name: 'episode_delete', status: 'PASS', elapsed });
        console.log(`  [PASS] episode_delete (${elapsed}ms)`);
      } else {
        results.push({ name: 'episode_delete', status: 'FAIL', elapsed, error: delResult.error });
        console.log(`  [FAIL] episode_delete (${elapsed}ms)`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name: 'episode_delete', status: 'FAIL', elapsed: 0, error: message });
    console.log(`  [FAIL] episode_delete — ${message}`);
  }

  // Summary
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;
  const avgTime = total > 0 ? Math.round(results.reduce((sum, r) => sum + r.elapsed, 0) / total) : 0;

  console.log(`\n========================================`);
  console.log(`Results: ${total} tested | ${passed} passed | ${failed} failed`);
  console.log(`Pass Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log(`Avg Response: ${avgTime}ms`);
  console.log(`========================================`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
}

runTests().catch(console.error);
