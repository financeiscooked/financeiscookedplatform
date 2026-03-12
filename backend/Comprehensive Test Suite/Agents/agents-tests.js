#!/usr/bin/env node

/**
 * Agents API Test Suite
 * Tests: GET list (public), POST create (admin), GET by id (public),
 *        PATCH update (admin), DELETE soft-delete (admin), and auth/error cases.
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

let createdAgentId = null;

async function runTests() {
  console.log(`\n${COLORS.cyan}${COLORS.bright}Agents Test Suite${COLORS.reset}`);
  console.log(`${COLORS.dim}Target: ${CONFIG.BASE_URL}${COLORS.reset}\n`);

  // ── 1. List agents (public, no admin key) ──
  {
    const res = await makeRequest('GET', '/api/agents');
    assert(res.ok === true, 'GET /api/agents returns ok:true');
    assert(Array.isArray(res.data), 'GET /api/agents returns data array');
  }

  // ── 2. Auth: POST agent without admin key returns 401 ──
  {
    const res = await makeRequest('POST', '/api/agents', {
      name: 'Should Fail Agent',
      description: 'No auth',
      instructions: 'None',
    });
    assert(res.status === 401, 'POST /api/agents without admin key returns 401');
  }

  // ── 3. Create agent (admin) ──
  {
    const res = await makeRequest('POST', '/api/agents', {
      name: `Test Agent ${Date.now()}`,
      description: 'A test agent created by the test suite',
      instructions: 'You are a helpful test agent.',
    }, { admin: true });
    assert(res.ok === true, 'POST /api/agents creates agent', res.error);
    if (res.data) {
      createdAgentId = res.data.id;
      assert(typeof res.data.id === 'string', 'Created agent has an id');
      assert(typeof res.data.name === 'string', 'Created agent has a name');
      assert(typeof res.data.slug === 'string', 'Created agent has a slug');
    }
  }

  // ── 4. Error: create agent with missing fields ──
  {
    const res = await makeRequest('POST', '/api/agents', {
      name: 'Incomplete',
    }, { admin: true });
    assert(res.ok === false, 'POST agent with missing fields returns ok:false');
  }

  // ── 5. Get agent by id (public) ──
  if (createdAgentId) {
    const res = await makeRequest('GET', `/api/agents/${createdAgentId}`);
    assert(res.ok === true, 'GET /api/agents/:id returns ok:true', res.error);
    if (res.data) {
      assert(res.data.id === createdAgentId, 'Fetched agent has correct id');
      assert(typeof res.data.instructions === 'string', 'Agent detail includes instructions');
    }
  }

  // ── 6. Error: get non-existent agent ──
  {
    const res = await makeRequest('GET', '/api/agents/nonexistent-agent-id-999');
    assert(res.ok === false, 'GET non-existent agent returns ok:false');
    assert(res.status === 404, 'Non-existent agent returns 404');
  }

  // ── 7. Auth: PATCH agent without admin key returns 401 ──
  if (createdAgentId) {
    const res = await makeRequest('PATCH', `/api/agents/${createdAgentId}`, {
      description: 'Should fail',
    });
    assert(res.status === 401, 'PATCH /api/agents/:id without admin key returns 401');
  }

  // ── 8. Update agent (admin) ──
  if (createdAgentId) {
    const res = await makeRequest('PATCH', `/api/agents/${createdAgentId}`, {
      description: 'Updated description from test suite',
      instructions: 'You are an updated test agent.',
    }, { admin: true });
    assert(res.ok === true, 'PATCH /api/agents/:id updates agent', res.error);
    if (res.data) {
      assert(res.data.description === 'Updated description from test suite', 'Updated description is correct');
    }
  }

  // ── 9. Verify update persisted ──
  if (createdAgentId) {
    const res = await makeRequest('GET', `/api/agents/${createdAgentId}`);
    if (res.data) {
      assert(res.data.description === 'Updated description from test suite', 'Agent update persisted');
    }
  }

  // ── 10. Auth: DELETE agent without admin key returns 401 ──
  if (createdAgentId) {
    const res = await makeRequest('DELETE', `/api/agents/${createdAgentId}`);
    assert(res.status === 401, 'DELETE /api/agents/:id without admin key returns 401');
  }

  // ── 11. Delete agent (soft delete, admin) ──
  if (createdAgentId) {
    const res = await makeRequest('DELETE', `/api/agents/${createdAgentId}`, null, { admin: true });
    assert(res.ok === true, 'DELETE /api/agents/:id soft-deletes agent', res.error);
  }

  // ── 12. Verify soft-deletion (agent no longer appears in list) ──
  if (createdAgentId) {
    const res = await makeRequest('GET', `/api/agents/${createdAgentId}`);
    assert(res.ok === false, 'GET soft-deleted agent returns ok:false (not found)');
  }

  // ── 13. Verify soft-deleted agent not in list ──
  if (createdAgentId) {
    const res = await makeRequest('GET', '/api/agents');
    if (res.ok && Array.isArray(res.data)) {
      const found = res.data.find(a => a.id === createdAgentId);
      assert(!found, 'Soft-deleted agent does not appear in agent list');
    }
  }

  // ── Summary ──
  console.log(`\n${COLORS.bright}  Agents Results: ${COLORS.green}${passed} passed${COLORS.reset}, ${COLORS.red}${failed} failed${COLORS.reset} of ${passed + failed}\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  // Attempt cleanup
  if (createdAgentId) {
    makeRequest('DELETE', `/api/agents/${createdAgentId}`, null, { admin: true }).finally(() => {
      console.error(`${COLORS.red}Unexpected error: ${err.message}${COLORS.reset}`);
      process.exit(1);
    });
  } else {
    console.error(`${COLORS.red}Unexpected error: ${err.message}${COLORS.reset}`);
    process.exit(1);
  }
});
