#!/usr/bin/env node

/**
 * Episodes API Test Suite
 * Tests: GET list, POST create, GET by slug, PUT update, DELETE, and error cases
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
const results = [];

function log(color, symbol, message) {
  console.log(`  ${color}${symbol}${COLORS.reset} ${message}`);
}

function assert(condition, testName, detail) {
  if (condition) {
    passed++;
    log(COLORS.green, 'PASS', testName);
    results.push({ name: testName, passed: true });
  } else {
    failed++;
    log(COLORS.red, 'FAIL', `${testName}${detail ? ' — ' + detail : ''}`);
    results.push({ name: testName, passed: false, detail });
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

const TEST_SLUG = `test-ep-${Date.now()}`;

async function runTests() {
  console.log(`\n${COLORS.cyan}${COLORS.bright}Episodes Test Suite${COLORS.reset}`);
  console.log(`${COLORS.dim}Target: ${CONFIG.BASE_URL}${COLORS.reset}\n`);

  // ── 1. List all episodes ──
  {
    const res = await makeRequest('GET', '/api/episodes');
    assert(res.ok === true, 'GET /api/episodes returns ok:true');
    assert(Array.isArray(res.data), 'GET /api/episodes returns data array');
    if (Array.isArray(res.data) && res.data.length > 0) {
      const ep = res.data[0];
      assert(ep.id !== undefined, 'Episode list items have id field');
      assert(ep.title !== undefined, 'Episode list items have title field');
    }
  }

  // ── 2. Create episode ──
  {
    const res = await makeRequest('POST', '/api/episodes', {
      slug: TEST_SLUG,
      title: 'Test Episode for Suite',
      date: '2025-01-15',
      sortOrder: 9999,
    });
    assert(res.ok === true, 'POST /api/episodes creates episode', res.error);
    if (res.data) {
      assert(res.data.title === 'Test Episode for Suite', 'Created episode has correct title');
      assert(typeof res.data.id !== 'undefined', 'Created episode has an id');
    }
  }

  // ── 3. Get episode by slug ──
  {
    const res = await makeRequest('GET', `/api/episodes/${TEST_SLUG}`);
    assert(res.ok === true, 'GET /api/episodes/:slug returns ok:true', res.error);
    if (res.data) {
      assert(res.data.title === 'Test Episode for Suite', 'Fetched episode has correct title');
      assert(Array.isArray(res.data.segments) || res.data.segments === undefined,
        'Episode has segments field (array or undefined)');
    }
  }

  // ── 4. Update episode ──
  {
    const res = await makeRequest('PUT', `/api/episodes/${TEST_SLUG}`, {
      title: 'Updated Test Episode',
      date: '2025-06-01',
    });
    assert(res.ok === true, 'PUT /api/episodes/:slug updates episode', res.error);
    if (res.data) {
      assert(res.data.title === 'Updated Test Episode', 'Updated title is correct');
    }
  }

  // ── 5. Verify update persisted ──
  {
    const res = await makeRequest('GET', `/api/episodes/${TEST_SLUG}`);
    if (res.data) {
      assert(res.data.title === 'Updated Test Episode', 'Updated title persisted on re-fetch');
    }
  }

  // ── 6. Error: duplicate slug ──
  {
    const res = await makeRequest('POST', '/api/episodes', {
      slug: TEST_SLUG,
      title: 'Duplicate',
    });
    assert(res.ok === false, 'POST duplicate slug returns ok:false');
    assert(typeof res.error === 'string' && res.error.length > 0, 'Duplicate slug returns error message');
  }

  // ── 7. Error: get non-existent slug ──
  {
    const res = await makeRequest('GET', '/api/episodes/nonexistent-slug-xyz-999');
    assert(res.ok === false, 'GET non-existent slug returns ok:false');
  }

  // ── 8. Error: update non-existent slug ──
  {
    const res = await makeRequest('PUT', '/api/episodes/nonexistent-slug-xyz-999', {
      title: 'Nope',
    });
    assert(res.ok === false, 'PUT non-existent slug returns ok:false');
  }

  // ── 9. Error: create with missing required fields ──
  {
    const res = await makeRequest('POST', '/api/episodes', {});
    assert(res.ok === false, 'POST with missing fields returns ok:false');
  }

  // ── 10. Delete episode ──
  {
    const res = await makeRequest('DELETE', `/api/episodes/${TEST_SLUG}`);
    assert(res.ok === true, 'DELETE /api/episodes/:slug deletes episode', res.error);
  }

  // ── 11. Verify deletion ──
  {
    const res = await makeRequest('GET', `/api/episodes/${TEST_SLUG}`);
    assert(res.ok === false, 'GET deleted episode returns ok:false (confirmed deletion)');
  }

  // ── 12. Error: delete non-existent slug ──
  {
    const res = await makeRequest('DELETE', '/api/episodes/nonexistent-slug-xyz-999');
    assert(res.ok === false, 'DELETE non-existent slug returns ok:false');
  }

  // ── Summary ──
  console.log(`\n${COLORS.bright}  Episodes Results: ${COLORS.green}${passed} passed${COLORS.reset}, ${COLORS.red}${failed} failed${COLORS.reset} of ${passed + failed}\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error(`${COLORS.red}Unexpected error: ${err.message}${COLORS.reset}`);
  process.exit(1);
});
