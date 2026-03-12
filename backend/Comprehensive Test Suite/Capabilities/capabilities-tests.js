#!/usr/bin/env node

/**
 * Capabilities API Test Suite
 * Tests: GET list, POST create, PATCH update, DELETE soft-delete,
 *        POST test connection, and agent capability link/unlink.
 * All endpoints require admin auth.
 * Sets up a temporary agent for agent-capability linking tests.
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

let createdCapId = null;
let testAgentId = null;

async function runTests() {
  console.log(`\n${COLORS.cyan}${COLORS.bright}Capabilities Test Suite${COLORS.reset}`);
  console.log(`${COLORS.dim}Target: ${CONFIG.BASE_URL}${COLORS.reset}\n`);

  // ── Setup: Create temporary agent for linking tests ──
  {
    console.log(`${COLORS.dim}  [setup] Creating temporary agent for capability linking${COLORS.reset}`);
    const res = await makeRequest('POST', '/api/agents', {
      name: `Cap Test Agent ${Date.now()}`,
      description: 'Temporary agent for capabilities tests',
      instructions: 'Test agent.',
    }, { admin: true });
    if (res.ok && res.data) {
      testAgentId = res.data.id;
    } else {
      console.error(`${COLORS.red}  Setup failed (agent): ${res.error}${COLORS.reset}`);
      process.exit(1);
    }
  }

  // ── 1. Auth: GET capabilities without admin key returns 401 ──
  {
    const res = await makeRequest('GET', '/api/capabilities');
    assert(res.status === 401, 'GET /api/capabilities without admin key returns 401');
  }

  // ── 2. List capabilities (admin) ──
  {
    const res = await makeRequest('GET', '/api/capabilities', null, { admin: true });
    assert(res.ok === true, 'GET /api/capabilities returns ok:true');
    assert(Array.isArray(res.data), 'GET /api/capabilities returns data array');
  }

  // ── 3. Auth: POST capability without admin key returns 401 ──
  {
    const res = await makeRequest('POST', '/api/capabilities', {
      name: 'Should Fail',
    });
    assert(res.status === 401, 'POST /api/capabilities without admin key returns 401');
  }

  // ── 4. Create capability (admin) ──
  {
    const res = await makeRequest('POST', '/api/capabilities', {
      name: `Test MCP Server ${Date.now()}`,
      description: 'A test MCP server capability',
      type: 'external',
      serverUrl: 'https://example.com/mcp',
    }, { admin: true });
    assert(res.ok === true, 'POST /api/capabilities creates capability', res.error);
    if (res.data) {
      createdCapId = res.data.id;
      assert(typeof res.data.id === 'string', 'Created capability has an id');
      assert(typeof res.data.name === 'string', 'Created capability has a name');
      assert(typeof res.data.slug === 'string', 'Created capability has a slug');
    }
  }

  // ── 5. Error: create capability with missing name ──
  {
    const res = await makeRequest('POST', '/api/capabilities', {
      description: 'No name',
    }, { admin: true });
    assert(res.ok === false, 'POST capability with missing name returns ok:false');
  }

  // ── 6. Auth: PATCH capability without admin key returns 401 ──
  if (createdCapId) {
    const res = await makeRequest('PATCH', `/api/capabilities/${createdCapId}`, {
      description: 'Should fail',
    });
    assert(res.status === 401, 'PATCH /api/capabilities/:id without admin key returns 401');
  }

  // ── 7. Update capability (admin) ──
  if (createdCapId) {
    const res = await makeRequest('PATCH', `/api/capabilities/${createdCapId}`, {
      description: 'Updated test capability',
      serverUrl: 'https://example.com/mcp-v2',
    }, { admin: true });
    assert(res.ok === true, 'PATCH /api/capabilities/:id updates capability', res.error);
    if (res.data) {
      assert(res.data.description === 'Updated test capability', 'Updated description is correct');
    }
  }

  // ── 8. Test connection (admin) ──
  if (createdCapId) {
    const res = await makeRequest('POST', `/api/capabilities/${createdCapId}/test`, null, { admin: true });
    assert(res.ok === true, 'POST /api/capabilities/:id/test returns ok:true', res.error);
    if (res.data) {
      assert(typeof res.data.reachable === 'boolean', 'Test response includes reachable boolean');
    }
  }

  // ── 9. Auth: POST test without admin key returns 401 ──
  if (createdCapId) {
    const res = await makeRequest('POST', `/api/capabilities/${createdCapId}/test`);
    assert(res.status === 401, 'POST /api/capabilities/:id/test without admin key returns 401');
  }

  // ── Agent Capability Linking ──

  // ── 10. Auth: PUT agent capability without admin key returns 401 ──
  if (testAgentId && createdCapId) {
    const res = await makeRequest('PUT', `/api/agents/${testAgentId}/capabilities/${createdCapId}`, {});
    assert(res.status === 401, 'PUT agent capability without admin key returns 401');
  }

  // ── 11. Enable capability for agent (admin) ──
  if (testAgentId && createdCapId) {
    const res = await makeRequest('PUT', `/api/agents/${testAgentId}/capabilities/${createdCapId}`, {
      config: { enabled: true },
    }, { admin: true });
    assert(res.ok === true, 'PUT /api/agents/:agentId/capabilities/:capId enables capability', res.error);
  }

  // ── 12. List agent capabilities (admin) ──
  if (testAgentId) {
    const res = await makeRequest('GET', `/api/agents/${testAgentId}/capabilities`, null, { admin: true });
    assert(res.ok === true, 'GET /api/agents/:agentId/capabilities returns ok:true', res.error);
    assert(Array.isArray(res.data), 'Agent capabilities returns data array');
    if (Array.isArray(res.data)) {
      const found = res.data.find(c => c.capabilityId === createdCapId);
      assert(!!found, 'Linked capability appears in agent capabilities list');
    }
  }

  // ── 13. Auth: GET agent capabilities without admin key returns 401 ──
  if (testAgentId) {
    const res = await makeRequest('GET', `/api/agents/${testAgentId}/capabilities`);
    assert(res.status === 401, 'GET agent capabilities without admin key returns 401');
  }

  // ── 14. Auth: DELETE agent capability without admin key returns 401 ──
  if (testAgentId && createdCapId) {
    const res = await makeRequest('DELETE', `/api/agents/${testAgentId}/capabilities/${createdCapId}`);
    assert(res.status === 401, 'DELETE agent capability without admin key returns 401');
  }

  // ── 15. Remove capability from agent (admin) ──
  if (testAgentId && createdCapId) {
    const res = await makeRequest('DELETE', `/api/agents/${testAgentId}/capabilities/${createdCapId}`, null, { admin: true });
    assert(res.ok === true, 'DELETE /api/agents/:agentId/capabilities/:capId removes link', res.error);
  }

  // ── 16. Verify capability removed from agent ──
  if (testAgentId) {
    const res = await makeRequest('GET', `/api/agents/${testAgentId}/capabilities`, null, { admin: true });
    if (res.ok && Array.isArray(res.data)) {
      const found = res.data.find(c => c.capabilityId === createdCapId);
      assert(!found, 'Removed capability no longer appears in agent capabilities');
    }
  }

  // ── 17. Auth: DELETE capability without admin key returns 401 ──
  if (createdCapId) {
    const res = await makeRequest('DELETE', `/api/capabilities/${createdCapId}`);
    assert(res.status === 401, 'DELETE /api/capabilities/:id without admin key returns 401');
  }

  // ── 18. Delete capability (soft delete, admin) ──
  if (createdCapId) {
    const res = await makeRequest('DELETE', `/api/capabilities/${createdCapId}`, null, { admin: true });
    assert(res.ok === true, 'DELETE /api/capabilities/:id soft-deletes capability', res.error);
  }

  // ── 19. Verify soft-deletion (capability no longer in list) ──
  {
    const res = await makeRequest('GET', '/api/capabilities', null, { admin: true });
    if (res.ok && Array.isArray(res.data)) {
      const found = res.data.find(c => c.id === createdCapId);
      assert(!found, 'Soft-deleted capability does not appear in list');
    }
  }

  // ── Cleanup ──
  {
    console.log(`${COLORS.dim}  [cleanup] Deleting temporary agent${COLORS.reset}`);
    if (testAgentId) {
      await makeRequest('DELETE', `/api/agents/${testAgentId}`, null, { admin: true });
    }
  }

  // ── Summary ──
  console.log(`\n${COLORS.bright}  Capabilities Results: ${COLORS.green}${passed} passed${COLORS.reset}, ${COLORS.red}${failed} failed${COLORS.reset} of ${passed + failed}\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  // Attempt cleanup
  const cleanups = [];
  if (createdCapId) cleanups.push(makeRequest('DELETE', `/api/capabilities/${createdCapId}`, null, { admin: true }));
  if (testAgentId) cleanups.push(makeRequest('DELETE', `/api/agents/${testAgentId}`, null, { admin: true }));
  Promise.allSettled(cleanups).finally(() => {
    console.error(`${COLORS.red}Unexpected error: ${err.message}${COLORS.reset}`);
    process.exit(1);
  });
});
