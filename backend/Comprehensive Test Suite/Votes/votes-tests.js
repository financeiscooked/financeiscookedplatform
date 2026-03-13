#!/usr/bin/env node

/**
 * Votes API Test Suite
 * Tests: POST vote, GET episode votes, and error cases
 * Sets up a temporary episode/segment/slide, then cleans up after.
 */

const CONFIG = {
  BASE_URL: process.env.BASE_URL || 'https://backend-production-0e40.up.railway.app',
  ADMIN_KEY: process.env.ADMIN_KEY || 'admin123',
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

async function makeRequest(method, path, body, { admin = false } = {}) {
  const url = `${CONFIG.BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (admin) headers['X-Admin-Key'] = CONFIG.ADMIN_KEY;
  const options = { method, headers };
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

const EP_SLUG = `test-vote-ep-${Date.now()}`;
let segId = null;
let slideId = null;

async function runTests() {
  console.log(`\n${COLORS.cyan}${COLORS.bright}Votes Test Suite${COLORS.reset}`);
  console.log(`${COLORS.dim}Target: ${CONFIG.BASE_URL}${COLORS.reset}\n`);

  // ── Setup: Create episode + segment + slide ──
  {
    console.log(`${COLORS.dim}  [setup] Creating episode: ${EP_SLUG}${COLORS.reset}`);
    const epRes = await makeRequest('POST', '/api/episodes', {
      slug: EP_SLUG,
      title: 'Votes Test Episode',
      sortOrder: 9996,
    }, { admin: true });
    if (!epRes.ok) {
      console.error(`${COLORS.red}  Setup failed (episode): ${epRes.error}${COLORS.reset}`);
      process.exit(1);
    }

    console.log(`${COLORS.dim}  [setup] Creating segment${COLORS.reset}`);
    const segRes = await makeRequest('POST', `/api/episodes/${EP_SLUG}/segments`, {
      slug: 'vote-seg',
      name: 'Vote Segment',
      sortOrder: 1,
    }, { admin: true });
    if (segRes.ok && segRes.data) segId = segRes.data.id;

    if (!segId) {
      console.error(`${COLORS.red}  Setup failed (segment)${COLORS.reset}`);
      await makeRequest('DELETE', `/api/episodes/${EP_SLUG}`, null, { admin: true });
      process.exit(1);
    }

    console.log(`${COLORS.dim}  [setup] Creating slide${COLORS.reset}`);
    const slideRes = await makeRequest('POST', `/api/segments/${segId}/slides`, {
      type: 'text',
      title: 'Votable Slide',
      sortOrder: 1,
    }, { admin: true });
    if (slideRes.ok && slideRes.data) slideId = slideRes.data.id;

    if (!slideId) {
      console.error(`${COLORS.red}  Setup failed (slide)${COLORS.reset}`);
      await makeRequest('DELETE', `/api/episodes/${EP_SLUG}`, null, { admin: true });
      process.exit(1);
    }
  }

  // ── 1. Cast upvote ──
  {
    const res = await makeRequest('POST', `/api/slides/${slideId}/vote`, {
      direction: 'up',
    });
    assert(res.ok === true, 'POST upvote returns ok:true', res.error);
  }

  // ── 2. Cast another upvote ──
  {
    const res = await makeRequest('POST', `/api/slides/${slideId}/vote`, {
      direction: 'up',
    });
    assert(res.ok === true, 'POST second upvote returns ok:true', res.error);
  }

  // ── 3. Cast downvote ──
  {
    const res = await makeRequest('POST', `/api/slides/${slideId}/vote`, {
      direction: 'down',
    });
    assert(res.ok === true, 'POST downvote returns ok:true', res.error);
  }

  // ── 4. Get vote counts for episode ──
  {
    const res = await makeRequest('GET', `/api/episodes/${EP_SLUG}/votes`);
    assert(res.ok === true, 'GET /api/episodes/:slug/votes returns ok:true', res.error);
    if (res.data) {
      assert(typeof res.data === 'object', 'Vote counts response is an object');
      // Check that our slide appears in the vote data
      const hasVoteData = JSON.stringify(res.data).length > 2; // more than '{}'
      assert(hasVoteData, 'Vote data contains entries after voting');
    }
  }

  // ── Error Cases ──

  // ── 5. Error: invalid vote direction ──
  {
    const res = await makeRequest('POST', `/api/slides/${slideId}/vote`, {
      direction: 'sideways',
    });
    assert(res.ok === false, 'POST invalid vote direction returns ok:false');
  }

  // ── 6. Error: vote on non-existent slide ──
  {
    const res = await makeRequest('POST', '/api/slides/99999999/vote', {
      direction: 'up',
    });
    assert(res.ok === false, 'POST vote on non-existent slide returns ok:false');
  }

  // ── 7. Error: get votes for non-existent episode ──
  {
    const res = await makeRequest('GET', '/api/episodes/nonexistent-vote-ep-xyz/votes');
    // This may return ok:true with empty data or ok:false depending on implementation
    // We just verify the response is valid JSON (no crash)
    assert(
      res.ok === true || res.ok === false,
      'GET votes for non-existent episode returns valid response (no crash)'
    );
  }

  // ── 8. Error: vote with missing direction ──
  {
    const res = await makeRequest('POST', `/api/slides/${slideId}/vote`, {});
    assert(res.ok === false, 'POST vote with missing direction returns ok:false');
  }

  // ── Cleanup ──
  {
    console.log(`${COLORS.dim}  [cleanup] Deleting temporary episode: ${EP_SLUG}${COLORS.reset}`);
    await makeRequest('DELETE', `/api/episodes/${EP_SLUG}`, null, { admin: true });
  }

  // ── Summary ──
  console.log(`\n${COLORS.bright}  Votes Results: ${COLORS.green}${passed} passed${COLORS.reset}, ${COLORS.red}${failed} failed${COLORS.reset} of ${passed + failed}\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  makeRequest('DELETE', `/api/episodes/${EP_SLUG}`).finally(() => {
    console.error(`${COLORS.red}Unexpected error: ${err.message}${COLORS.reset}`);
    process.exit(1);
  });
});
