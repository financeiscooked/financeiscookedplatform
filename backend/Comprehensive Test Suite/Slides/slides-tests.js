#!/usr/bin/env node

/**
 * Slides API Test Suite
 * Tests: POST create, PUT update, DELETE, POST move, POST finalize, and error cases
 * Sets up a temporary episode with two segments, then cleans up after.
 */

const CONFIG = {
  BASE_URL: process.env.BASE_URL || 'https://backend-production-0e40.up.railway.app',
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

let passed = 0;
let failed = 0;

function log(color, symbol, message) {
  console.log(`  ${color}${symbol}${COLORS.reset} ${message}`);
}

function assert(condition, testName, detail) {
  if (condition) {
    passed++;
    log(COLORS.green, 'PASS', testName);
  } else {
    failed++;
    log(COLORS.red, 'FAIL', `${testName}${detail ? ' — ' + detail : ''}`);
  }
}

async function makeRequest(method, path, body) {
  const url = `${CONFIG.BASE_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  try {
    const res = await fetch(url, options);
    const json = await res.json();
    return { status: res.status, ...json };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

const EP_SLUG = `test-slide-ep-${Date.now()}`;
const SEG_SLUG_A = 'slide-seg-a';
const SEG_SLUG_B = 'slide-seg-b';
let segIdA = null;
let segIdB = null;
let slideId1 = null;
let slideId2 = null;

async function runTests() {
  console.log(`\n${COLORS.cyan}${COLORS.bright}Slides Test Suite${COLORS.reset}`);
  console.log(`${COLORS.dim}Target: ${CONFIG.BASE_URL}${COLORS.reset}\n`);

  // ── Setup: Create episode + two segments ──
  {
    console.log(`${COLORS.dim}  [setup] Creating episode: ${EP_SLUG}${COLORS.reset}`);
    const epRes = await makeRequest('POST', '/api/episodes', {
      slug: EP_SLUG,
      title: 'Slides Test Episode',
      sortOrder: 9997,
    });
    if (!epRes.ok) {
      console.error(`${COLORS.red}  Setup failed (episode): ${epRes.error}${COLORS.reset}`);
      process.exit(1);
    }

    console.log(`${COLORS.dim}  [setup] Creating segment A: ${SEG_SLUG_A}${COLORS.reset}`);
    const segARes = await makeRequest('POST', `/api/episodes/${EP_SLUG}/segments`, {
      slug: SEG_SLUG_A,
      name: 'Segment A',
      sortOrder: 1,
    });
    if (segARes.ok && segARes.data) segIdA = segARes.data.id;

    console.log(`${COLORS.dim}  [setup] Creating segment B: ${SEG_SLUG_B}${COLORS.reset}`);
    const segBRes = await makeRequest('POST', `/api/episodes/${EP_SLUG}/segments`, {
      slug: SEG_SLUG_B,
      name: 'Segment B',
      sortOrder: 2,
    });
    if (segBRes.ok && segBRes.data) segIdB = segBRes.data.id;

    if (!segIdA || !segIdB) {
      console.error(`${COLORS.red}  Setup failed (segments)${COLORS.reset}`);
      await makeRequest('DELETE', `/api/episodes/${EP_SLUG}`);
      process.exit(1);
    }
  }

  // ── 1. Create text slide ──
  {
    const res = await makeRequest('POST', `/api/segments/${segIdA}/slides`, {
      type: 'text',
      title: 'Test Text Slide',
      notes: 'Some notes here',
      bullets: ['Point 1', 'Point 2'],
      sortOrder: 1,
    });
    assert(res.ok === true, 'POST create text slide returns ok:true', res.error);
    if (res.data) {
      slideId1 = res.data.id;
      assert(res.data.id != null, 'Created slide has an id');
      assert(res.data.title === 'Test Text Slide', 'Created slide has correct title');
    }
  }

  // ── 2. Create link slide ──
  {
    const res = await makeRequest('POST', `/api/segments/${segIdA}/slides`, {
      type: 'link',
      title: 'Test Link Slide',
      url: 'https://example.com/article',
      notes: 'An interesting link',
      sortOrder: 2,
    });
    assert(res.ok === true, 'POST create link slide returns ok:true', res.error);
    if (res.data) {
      slideId2 = res.data.id;
      assert(res.data.id != null, 'Created link slide has an id');
      assert(res.data.title === 'Test Link Slide', 'Created link slide has correct title');
    }
  }

  // ── 3. Verify slides appear in episode ──
  {
    const res = await makeRequest('GET', `/api/episodes/${EP_SLUG}`);
    assert(res.ok === true, 'GET episode returns ok after slide creation');
    if (res.data && Array.isArray(res.data.segments)) {
      const segA = res.data.segments.find(s => s.id === segIdA);
      if (segA && Array.isArray(segA.slides)) {
        assert(segA.slides.length >= 2, 'Segment A has at least 2 slides');
      }
    }
  }

  // ── 4. Update slide ──
  if (slideId1) {
    const res = await makeRequest('PUT', `/api/slides/${slideId1}`, {
      title: 'Updated Text Slide',
      notes: 'Updated notes',
      details: 'Added details field',
    });
    assert(res.ok === true, 'PUT /api/slides/:id updates slide', res.error);
    if (res.data) {
      assert(res.data.title === 'Updated Text Slide', 'Updated slide title is correct');
    }
  }

  // ── 5. Move slide to segment B ──
  if (slideId1) {
    const res = await makeRequest('POST', `/api/slides/${slideId1}/move`, {
      targetSegmentId: segIdB,
    });
    assert(res.ok === true, 'POST /api/slides/:id/move moves slide (by targetSegmentId)', res.error);
  }

  // ── 6. Verify slide moved ──
  {
    const res = await makeRequest('GET', `/api/episodes/${EP_SLUG}`);
    if (res.data && Array.isArray(res.data.segments)) {
      const segB = res.data.segments.find(s => s.id === segIdB);
      if (segB && Array.isArray(segB.slides)) {
        const movedSlide = segB.slides.find(s => s.id === slideId1);
        assert(!!movedSlide, 'Moved slide now appears in Segment B');
      }
    }
  }

  // ── 7. Move slide using slug-based targeting ──
  if (slideId1) {
    const res = await makeRequest('POST', `/api/slides/${slideId1}/move`, {
      targetEpisodeSlug: EP_SLUG,
      targetSegmentSlug: SEG_SLUG_A,
    });
    assert(res.ok === true, 'POST move slide using slug-based targeting', res.error);
  }

  // ── 8. Finalize slide ──
  if (slideId2) {
    const res = await makeRequest('POST', `/api/slides/${slideId2}/finalize`);
    assert(res.ok === true, 'POST /api/slides/:id/finalize returns ok:true', res.error);
  }

  // ── 9. Verify finalize effect ──
  {
    const res = await makeRequest('GET', `/api/episodes/${EP_SLUG}`);
    if (res.data && Array.isArray(res.data.segments)) {
      const segA = res.data.segments.find(s => s.id === segIdA);
      if (segA && Array.isArray(segA.slides)) {
        const finalSlide = segA.slides.find(s => s.id === slideId2);
        if (finalSlide) {
          assert(finalSlide.status === 'final', 'Finalized slide has status "final"');
        }
      }
    }
  }

  // ── 10. Delete slide ──
  if (slideId1) {
    const res = await makeRequest('DELETE', `/api/slides/${slideId1}`);
    assert(res.ok === true, 'DELETE /api/slides/:id deletes slide', res.error);
  }

  // ── 11. Verify deletion ──
  {
    const res = await makeRequest('GET', `/api/episodes/${EP_SLUG}`);
    if (res.data && Array.isArray(res.data.segments)) {
      let found = false;
      for (const seg of res.data.segments) {
        if (Array.isArray(seg.slides) && seg.slides.find(s => s.id === slideId1)) {
          found = true;
        }
      }
      assert(!found, 'Deleted slide no longer appears in any segment');
    }
  }

  // ── Error Cases ──

  // ── 12. Error: create slide with missing type ──
  {
    const res = await makeRequest('POST', `/api/segments/${segIdA}/slides`, {
      title: 'No Type',
    });
    assert(res.ok === false, 'POST slide with missing type returns ok:false');
  }

  // ── 13. Error: update non-existent slide ──
  {
    const res = await makeRequest('PUT', '/api/slides/99999999', {
      title: 'Ghost',
    });
    assert(res.ok === false, 'PUT non-existent slide returns ok:false');
  }

  // ── 14. Error: delete non-existent slide ──
  {
    const res = await makeRequest('DELETE', '/api/slides/99999999');
    assert(res.ok === false, 'DELETE non-existent slide returns ok:false');
  }

  // ── 15. Error: move non-existent slide ──
  {
    const res = await makeRequest('POST', '/api/slides/99999999/move', {
      targetSegmentId: segIdA,
    });
    assert(res.ok === false, 'POST move non-existent slide returns ok:false');
  }

  // ── 16. Error: create slide on non-existent segment ──
  {
    const res = await makeRequest('POST', '/api/segments/99999999/slides', {
      type: 'text',
      title: 'Orphan',
    });
    assert(res.ok === false, 'POST slide on non-existent segment returns ok:false');
  }

  // ── Cleanup ──
  {
    console.log(`${COLORS.dim}  [cleanup] Deleting temporary episode: ${EP_SLUG}${COLORS.reset}`);
    await makeRequest('DELETE', `/api/episodes/${EP_SLUG}`);
  }

  // ── Summary ──
  console.log(`\n${COLORS.bright}  Slides Results: ${COLORS.green}${passed} passed${COLORS.reset}, ${COLORS.red}${failed} failed${COLORS.reset} of ${passed + failed}\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  makeRequest('DELETE', `/api/episodes/${EP_SLUG}`).finally(() => {
    console.error(`${COLORS.red}Unexpected error: ${err.message}${COLORS.reset}`);
    process.exit(1);
  });
});
