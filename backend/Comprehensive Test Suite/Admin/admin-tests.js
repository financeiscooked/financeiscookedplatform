#!/usr/bin/env node

/**
 * Admin API Test Suite
 * Tests: GET /api/health, GET /api/admin/stats
 * NOTE: POST /api/admin/seed is intentionally NOT tested (destructive operation)
 * Admin key is included for admin endpoints.
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

async function runTests() {
  console.log(`\n${COLORS.cyan}${COLORS.bright}Admin Test Suite${COLORS.reset}`);
  console.log(`${COLORS.dim}Target: ${CONFIG.BASE_URL}${COLORS.reset}\n`);

  // ── 1. Health check ──
  {
    const res = await makeRequest('GET', '/api/health');
    assert(res.ok === true, 'GET /api/health returns ok:true', res.error);
    assert(typeof res.data !== 'undefined' || res.status === 200, 'Health check returns valid response');
  }

  // ── 2. Health check response time ──
  {
    const start = Date.now();
    await makeRequest('GET', '/api/health');
    const elapsed = Date.now() - start;
    assert(elapsed < 5000, `Health check responds within 5s (took ${elapsed}ms)`);
  }

  // ── 3. Stats endpoint ──
  {
    const res = await makeRequest('GET', '/api/admin/stats', null, { admin: true });
    assert(res.ok === true, 'GET /api/admin/stats returns ok:true', res.error);
    if (res.data) {
      assert(typeof res.data === 'object', 'Stats returns an object');
      // Common stat fields - check for at least one
      const hasFields = (
        typeof res.data.episodes !== 'undefined' ||
        typeof res.data.segments !== 'undefined' ||
        typeof res.data.slides !== 'undefined' ||
        Object.keys(res.data).length > 0
      );
      assert(hasFields, 'Stats response contains data fields');
    }
  }

  // ── 4. Stats response structure ──
  {
    const res = await makeRequest('GET', '/api/admin/stats', null, { admin: true });
    if (res.ok && res.data) {
      const keys = Object.keys(res.data);
      assert(keys.length > 0, `Stats has ${keys.length} field(s): ${keys.join(', ')}`);
    }
  }

  // ── 5. Seed endpoint exists (but we don't actually call it) ──
  {
    // We do an OPTIONS or just note it's intentionally skipped
    console.log(`  ${COLORS.yellow}SKIP${COLORS.reset} POST /api/admin/seed — destructive, intentionally skipped`);
  }

  // ── Summary ──
  console.log(`\n${COLORS.bright}  Admin Results: ${COLORS.green}${passed} passed${COLORS.reset}, ${COLORS.red}${failed} failed${COLORS.reset} of ${passed + failed}\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error(`${COLORS.red}Unexpected error: ${err.message}${COLORS.reset}`);
  process.exit(1);
});
