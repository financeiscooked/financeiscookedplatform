#!/usr/bin/env node

/**
 * Segments API Test Suite
 * Tests: POST create, PUT update, DELETE, and error cases
 * Sets up a temporary episode, then cleans up after.
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

const EP_SLUG = `test-seg-ep-${Date.now()}`;
let segmentId1 = null;
let segmentId2 = null;

async function runTests() {
  console.log(`\n${COLORS.cyan}${COLORS.bright}Segments Test Suite${COLORS.reset}`);
  console.log(`${COLORS.dim}Target: ${CONFIG.BASE_URL}${COLORS.reset}\n`);

  // ── Setup: Create temporary episode ──
  {
    console.log(`${COLORS.dim}  [setup] Creating temporary episode: ${EP_SLUG}${COLORS.reset}`);
    const res = await makeRequest('POST', '/api/episodes', {
      slug: EP_SLUG,
      title: 'Segment Test Episode',
      sortOrder: 9998,
    });
    if (!res.ok) {
      console.error(`${COLORS.red}  Setup failed: ${res.error}${COLORS.reset}`);
      process.exit(1);
    }
  }

  // ── 1. Create first segment ──
  {
    const res = await makeRequest('POST', `/api/episodes/${EP_SLUG}/segments`, {
      slug: 'seg-alpha',
      name: 'Alpha Segment',
      status: 'proposed',
      sortOrder: 1,
    });
    assert(res.ok === true, 'POST create segment returns ok:true', res.error);
    if (res.data) {
      segmentId1 = res.data.id;
      assert(res.data.name === 'Alpha Segment', 'Created segment has correct name');
      assert(typeof res.data.id !== 'undefined', 'Created segment has an id');
    }
  }

  // ── 2. Create second segment ──
  {
    const res = await makeRequest('POST', `/api/episodes/${EP_SLUG}/segments`, {
      slug: 'seg-beta',
      name: 'Beta Segment',
      sortOrder: 2,
    });
    assert(res.ok === true, 'POST create second segment returns ok:true', res.error);
    if (res.data) {
      segmentId2 = res.data.id;
      assert(res.data.name === 'Beta Segment', 'Second segment has correct name');
    }
  }

  // ── 3. Verify segments appear in episode ──
  {
    const res = await makeRequest('GET', `/api/episodes/${EP_SLUG}`);
    assert(res.ok === true, 'GET episode after segment creation returns ok:true');
    if (res.data && Array.isArray(res.data.segments)) {
      assert(res.data.segments.length >= 2, 'Episode has at least 2 segments');
    }
  }

  // ── 4. Update segment ──
  if (segmentId1) {
    const res = await makeRequest('PUT', `/api/segments/${segmentId1}`, {
      name: 'Alpha Segment Updated',
      status: 'final',
    });
    assert(res.ok === true, 'PUT /api/segments/:id updates segment', res.error);
    if (res.data) {
      assert(res.data.name === 'Alpha Segment Updated', 'Updated segment name is correct');
    }
  }

  // ── 5. Verify update persisted ──
  {
    const res = await makeRequest('GET', `/api/episodes/${EP_SLUG}`);
    if (res.data && Array.isArray(res.data.segments)) {
      const seg = res.data.segments.find(s => s.id === segmentId1);
      if (seg) {
        assert(seg.name === 'Alpha Segment Updated', 'Segment update persisted in episode fetch');
      }
    }
  }

  // ── 6. Delete second segment ──
  if (segmentId2) {
    const res = await makeRequest('DELETE', `/api/segments/${segmentId2}`);
    assert(res.ok === true, 'DELETE /api/segments/:id deletes segment', res.error);
  }

  // ── 7. Verify deletion ──
  {
    const res = await makeRequest('GET', `/api/episodes/${EP_SLUG}`);
    if (res.data && Array.isArray(res.data.segments)) {
      const found = res.data.segments.find(s => s.id === segmentId2);
      assert(!found, 'Deleted segment no longer appears in episode');
    }
  }

  // ── 8. Error: missing slug field ──
  {
    const res = await makeRequest('POST', `/api/episodes/${EP_SLUG}/segments`, {
      name: 'No Slug Segment',
    });
    assert(res.ok === false, 'POST segment with missing slug returns ok:false');
  }

  // ── 9. Error: update non-existent segment ──
  {
    const res = await makeRequest('PUT', '/api/segments/99999999', {
      name: 'Ghost',
    });
    assert(res.ok === false, 'PUT non-existent segment returns ok:false');
  }

  // ── 10. Error: delete non-existent segment ──
  {
    const res = await makeRequest('DELETE', '/api/segments/99999999');
    assert(res.ok === false, 'DELETE non-existent segment returns ok:false');
  }

  // ── 11. Error: create segment on non-existent episode ──
  {
    const res = await makeRequest('POST', '/api/episodes/nonexistent-ep-xyz/segments', {
      slug: 'orphan-seg',
      name: 'Orphan',
    });
    assert(res.ok === false, 'POST segment on non-existent episode returns ok:false');
  }

  // ── Cleanup ──
  {
    console.log(`${COLORS.dim}  [cleanup] Deleting temporary episode: ${EP_SLUG}${COLORS.reset}`);
    await makeRequest('DELETE', `/api/episodes/${EP_SLUG}`);
  }

  // ── Summary ──
  console.log(`\n${COLORS.bright}  Segments Results: ${COLORS.green}${passed} passed${COLORS.reset}, ${COLORS.red}${failed} failed${COLORS.reset} of ${passed + failed}\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  // Attempt cleanup even on error
  makeRequest('DELETE', `/api/episodes/${EP_SLUG}`).finally(() => {
    console.error(`${COLORS.red}Unexpected error: ${err.message}${COLORS.reset}`);
    process.exit(1);
  });
});
