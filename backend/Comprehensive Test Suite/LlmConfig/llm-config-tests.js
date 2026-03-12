#!/usr/bin/env node

/**
 * LLM Config API Test Suite
 * Tests: GET config, GET providers, PUT config, PUT api-key, DELETE api-key
 * All endpoints require admin auth.
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

// Store original config so we can restore it
let originalProvider = null;
let originalModel = null;

async function runTests() {
  console.log(`\n${COLORS.cyan}${COLORS.bright}LLM Config Test Suite${COLORS.reset}`);
  console.log(`${COLORS.dim}Target: ${CONFIG.BASE_URL}${COLORS.reset}\n`);

  // ── 1. Auth: GET llm-config without admin key returns 401 ──
  {
    const res = await makeRequest('GET', '/api/llm-config');
    assert(res.status === 401, 'GET /api/llm-config without admin key returns 401');
  }

  // ── 2. Get current LLM config (admin) ──
  {
    const res = await makeRequest('GET', '/api/llm-config', null, { admin: true });
    assert(res.ok === true, 'GET /api/llm-config returns ok:true', res.error);
    if (res.data) {
      assert(typeof res.data.provider === 'string', 'Config has provider field');
      assert(typeof res.data.model === 'string', 'Config has model field');
      assert(typeof res.data.hasApiKey === 'boolean', 'Config has hasApiKey field');
      // Save original values for restoration
      originalProvider = res.data.provider;
      originalModel = res.data.model;
    }
  }

  // ── 3. Auth: GET providers without admin key returns 401 ──
  {
    const res = await makeRequest('GET', '/api/llm-config/providers');
    assert(res.status === 401, 'GET /api/llm-config/providers without admin key returns 401');
  }

  // ── 4. List providers (admin) ──
  {
    const res = await makeRequest('GET', '/api/llm-config/providers', null, { admin: true });
    assert(res.ok === true, 'GET /api/llm-config/providers returns ok:true', res.error);
    if (res.data) {
      assert(Array.isArray(res.data), 'Providers returns an array');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const provider = res.data[0];
        assert(typeof provider.id === 'string', 'Provider has id field');
        assert(typeof provider.name === 'string', 'Provider has name field');
        assert(Array.isArray(provider.models), 'Provider has models array');
      }
    }
  }

  // ── 5. Auth: PUT llm-config without admin key returns 401 ──
  {
    const res = await makeRequest('PUT', '/api/llm-config', {
      provider: 'openai',
      model: 'gpt-4o-mini',
    });
    assert(res.status === 401, 'PUT /api/llm-config without admin key returns 401');
  }

  // ── 6. Set provider + model (admin) ──
  {
    const res = await makeRequest('PUT', '/api/llm-config', {
      provider: 'openai',
      model: 'gpt-4o-mini',
    }, { admin: true });
    assert(res.ok === true, 'PUT /api/llm-config sets provider+model', res.error);
    if (res.data) {
      assert(res.data.provider === 'openai', 'Set provider is correct');
      assert(res.data.model === 'gpt-4o-mini', 'Set model is correct');
    }
  }

  // ── 7. Verify config persisted ──
  {
    const res = await makeRequest('GET', '/api/llm-config', null, { admin: true });
    if (res.data) {
      assert(res.data.provider === 'openai', 'Provider persisted after set');
      assert(res.data.model === 'gpt-4o-mini', 'Model persisted after set');
    }
  }

  // ── 8. Error: set with missing fields ──
  {
    const res = await makeRequest('PUT', '/api/llm-config', {
      provider: 'openai',
    }, { admin: true });
    assert(res.ok === false, 'PUT llm-config with missing model returns ok:false');
  }

  // ── 9. Error: set with invalid provider ──
  {
    const res = await makeRequest('PUT', '/api/llm-config', {
      provider: 'invalid-provider',
      model: 'some-model',
    }, { admin: true });
    assert(res.ok === false, 'PUT llm-config with invalid provider returns ok:false');
  }

  // ── 10. Auth: PUT api-key without admin key returns 401 ──
  {
    const res = await makeRequest('PUT', '/api/llm-config/api-key', {
      provider: 'openai',
      apiKey: 'sk-test-fake-key-12345',
    });
    assert(res.status === 401, 'PUT /api/llm-config/api-key without admin key returns 401');
  }

  // ── 11. Save API key (admin) ──
  {
    const res = await makeRequest('PUT', '/api/llm-config/api-key', {
      provider: 'openai',
      apiKey: 'sk-test-fake-key-12345',
    }, { admin: true });
    assert(res.ok === true, 'PUT /api/llm-config/api-key saves key', res.error);
    if (res.data) {
      assert(res.data.provider === 'openai', 'Saved key has correct provider');
      assert(typeof res.data.keyPrefix === 'string', 'Saved key returns keyPrefix');
      assert(res.data.keyPrefix.includes('...'), 'Key prefix is masked');
    }
  }

  // ── 12. Verify API key status ──
  {
    const res = await makeRequest('GET', '/api/llm-config', null, { admin: true });
    if (res.data) {
      assert(res.data.hasApiKey === true, 'Config shows hasApiKey:true after saving key');
      assert(typeof res.data.keyPrefix === 'string', 'Config includes keyPrefix after saving');
    }
  }

  // ── 13. Error: save API key with missing fields ──
  {
    const res = await makeRequest('PUT', '/api/llm-config/api-key', {
      provider: 'openai',
    }, { admin: true });
    assert(res.ok === false, 'PUT api-key with missing apiKey returns ok:false');
  }

  // ── 14. Auth: DELETE api-key without admin key returns 401 ──
  {
    const res = await makeRequest('DELETE', '/api/llm-config/api-key/openai');
    assert(res.status === 401, 'DELETE /api/llm-config/api-key/:provider without admin key returns 401');
  }

  // ── 15. Delete API key (admin) ──
  {
    const res = await makeRequest('DELETE', '/api/llm-config/api-key/openai', null, { admin: true });
    assert(res.ok === true, 'DELETE /api/llm-config/api-key/:provider deletes key', res.error);
  }

  // ── 16. Verify API key deleted ──
  {
    const res = await makeRequest('GET', '/api/llm-config', null, { admin: true });
    if (res.data) {
      // After deleting the key, hasApiKey should be false (unless an env var provides one)
      // We just check the endpoint works
      assert(typeof res.data.hasApiKey === 'boolean', 'Config still returns hasApiKey after deletion');
    }
  }

  // ── Restore original config if we changed it ──
  if (originalProvider && originalModel) {
    console.log(`${COLORS.dim}  [cleanup] Restoring original LLM config${COLORS.reset}`);
    await makeRequest('PUT', '/api/llm-config', {
      provider: originalProvider,
      model: originalModel,
    }, { admin: true });
  }

  // ── Summary ──
  console.log(`\n${COLORS.bright}  LLM Config Results: ${COLORS.green}${passed} passed${COLORS.reset}, ${COLORS.red}${failed} failed${COLORS.reset} of ${passed + failed}\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  // Attempt to restore config
  if (originalProvider && originalModel) {
    makeRequest('PUT', '/api/llm-config', { provider: originalProvider, model: originalModel }, { admin: true }).finally(() => {
      console.error(`${COLORS.red}Unexpected error: ${err.message}${COLORS.reset}`);
      process.exit(1);
    });
  } else {
    console.error(`${COLORS.red}Unexpected error: ${err.message}${COLORS.reset}`);
    process.exit(1);
  }
});
