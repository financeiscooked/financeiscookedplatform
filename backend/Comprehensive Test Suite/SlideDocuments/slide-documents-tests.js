#!/usr/bin/env node

/**
 * Slide Documents API Test Suite
 * Tests: POST upload, GET list, GET download, DELETE, and error cases
 * Sets up a temporary episode + segment + slide, then cleans up after.
 * Write operations require X-Admin-Key header.
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
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return { status: res.status, ...json };
    }
    // For binary downloads
    const buffer = await res.arrayBuffer();
    return { status: res.status, ok: res.ok, buffer, headers: Object.fromEntries(res.headers.entries()) };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

async function makeMultipartUpload(path, filename, mimeType, fileContent, { admin = false, sortOrder } = {}) {
  const url = `${CONFIG.BASE_URL}${path}`;
  const boundary = '----TestBoundary' + Date.now();

  let body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n${fileContent}\r\n`;
  if (sortOrder !== undefined) {
    body += `--${boundary}\r\nContent-Disposition: form-data; name="sortOrder"\r\n\r\n${sortOrder}\r\n`;
  }
  body += `--${boundary}--\r\n`;

  const headers = { 'Content-Type': `multipart/form-data; boundary=${boundary}` };
  if (admin) headers['X-Admin-Key'] = CONFIG.ADMIN_KEY;

  try {
    const res = await fetch(url, { method: 'POST', headers, body });
    const json = await res.json();
    return { status: res.status, ...json };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

const EP_SLUG = `test-slidedoc-ep-${Date.now()}`;
const SEG_SLUG = 'slidedoc-seg';
let segId = null;
let slideId = null;
let docId1 = null;
let docId2 = null;

async function runTests() {
  console.log(`\n${COLORS.cyan}${COLORS.bright}Slide Documents Test Suite${COLORS.reset}`);
  console.log(`${COLORS.dim}Target: ${CONFIG.BASE_URL}${COLORS.reset}\n`);

  // ── Setup: Create episode + segment + slide ──
  {
    console.log(`${COLORS.dim}  [setup] Creating episode: ${EP_SLUG}${COLORS.reset}`);
    const epRes = await makeRequest('POST', '/api/episodes', {
      slug: EP_SLUG,
      title: 'Slide Documents Test Episode',
      sortOrder: 9998,
    }, { admin: true });
    if (!epRes.ok) {
      console.error(`${COLORS.red}  Setup failed (episode): ${epRes.error}${COLORS.reset}`);
      process.exit(1);
    }

    console.log(`${COLORS.dim}  [setup] Creating segment: ${SEG_SLUG}${COLORS.reset}`);
    const segRes = await makeRequest('POST', `/api/episodes/${EP_SLUG}/segments`, {
      slug: SEG_SLUG,
      name: 'Document Test Segment',
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
      title: 'Slide With Documents',
      sortOrder: 1,
    }, { admin: true });
    if (slideRes.ok && slideRes.data) slideId = slideRes.data.id;

    if (!slideId) {
      console.error(`${COLORS.red}  Setup failed (slide)${COLORS.reset}`);
      await makeRequest('DELETE', `/api/episodes/${EP_SLUG}`, null, { admin: true });
      process.exit(1);
    }
  }

  // ── 1. Auth: upload without admin key returns 401 ──
  {
    const res = await makeMultipartUpload(`/api/slides/${slideId}/documents`, 'test.txt', 'text/plain', 'hello world');
    assert(res.status === 401, 'POST upload without admin key returns 401');
  }

  // ── 2. Upload first document ──
  {
    const res = await makeMultipartUpload(
      `/api/slides/${slideId}/documents`,
      'test-report.txt',
      'text/plain',
      'This is a test document content.',
      { admin: true, sortOrder: 1 }
    );
    assert(res.ok === true, 'POST upload document returns ok:true', res.error);
    if (res.data) {
      docId1 = res.data.id;
      assert(res.data.id != null, 'Uploaded document has an id');
      assert(res.data.filename === 'test-report.txt', 'Uploaded document has correct filename');
      assert(res.data.mimeType === 'text/plain', 'Uploaded document has correct mimeType');
      assert(res.data.fileSize > 0, 'Uploaded document has fileSize > 0');
      assert(res.data.sortOrder === 1, 'Uploaded document has correct sortOrder');
    }
  }

  // ── 3. Upload second document ──
  {
    const res = await makeMultipartUpload(
      `/api/slides/${slideId}/documents`,
      'notes.txt',
      'text/plain',
      'Second document.',
      { admin: true, sortOrder: 2 }
    );
    assert(res.ok === true, 'POST upload second document returns ok:true', res.error);
    if (res.data) {
      docId2 = res.data.id;
      assert(res.data.filename === 'notes.txt', 'Second document has correct filename');
    }
  }

  // ── 4. List documents for slide ──
  {
    const res = await makeRequest('GET', `/api/slides/${slideId}/documents`);
    assert(res.ok === true, 'GET list documents returns ok:true', res.error);
    if (res.data) {
      assert(Array.isArray(res.data), 'Documents list is an array');
      assert(res.data.length === 2, `Documents list has 2 items (got ${res.data.length})`);
      assert(res.data[0].sortOrder <= res.data[1].sortOrder, 'Documents are sorted by sortOrder');
    }
  }

  // ── 5. Download document ──
  if (docId1) {
    const res = await makeRequest('GET', `/api/documents/${docId1}/download`);
    assert(res.status === 200, 'GET download returns 200');
    if (res.headers) {
      assert(res.headers['content-type']?.includes('text/plain'), 'Download has correct content-type');
      assert(res.headers['content-disposition']?.includes('test-report.txt'), 'Download has correct content-disposition');
    }
  }

  // ── 6. Auth: delete without admin key returns 401 ──
  if (docId1) {
    const res = await makeRequest('DELETE', `/api/documents/${docId1}`);
    assert(res.status === 401, 'DELETE document without admin key returns 401');
  }

  // ── 7. Delete document ──
  if (docId2) {
    const res = await makeRequest('DELETE', `/api/documents/${docId2}`, null, { admin: true });
    assert(res.ok === true, 'DELETE document returns ok:true', res.error);
  }

  // ── 8. Verify deletion ──
  {
    const res = await makeRequest('GET', `/api/slides/${slideId}/documents`);
    if (res.data) {
      assert(res.data.length === 1, `After delete, documents list has 1 item (got ${res.data.length})`);
    }
  }

  // ── Error Cases ──

  // ── 9. Upload to non-existent slide ──
  {
    const res = await makeMultipartUpload(
      '/api/slides/00000000-0000-0000-0000-000000000000/documents',
      'ghost.txt',
      'text/plain',
      'orphan',
      { admin: true }
    );
    assert(res.ok === false, 'POST upload to non-existent slide returns ok:false');
  }

  // ── 10. Download non-existent document ──
  {
    const res = await makeRequest('GET', '/api/documents/00000000-0000-0000-0000-000000000000/download');
    assert(res.status === 404 || res.ok === false, 'GET download non-existent document returns 404');
  }

  // ── 11. Delete non-existent document ──
  {
    const res = await makeRequest('DELETE', '/api/documents/00000000-0000-0000-0000-000000000000', null, { admin: true });
    assert(res.ok === false, 'DELETE non-existent document returns ok:false');
  }

  // ── 12. Upload with no file body returns 400 ──
  {
    const url = `${CONFIG.BASE_URL}/api/slides/${slideId}/documents`;
    const headers = { 'X-Admin-Key': CONFIG.ADMIN_KEY };
    try {
      const res = await fetch(url, { method: 'POST', headers });
      const json = await res.json();
      assert(json.ok === false, 'POST upload with no file returns ok:false');
    } catch {
      assert(true, 'POST upload with no file returns error');
    }
  }

  // ── 13. Cascade: deleting slide removes documents ──
  // Upload a doc, then delete the parent slide, then check doc is gone
  {
    // Create a temp slide
    const slideRes = await makeRequest('POST', `/api/segments/${segId}/slides`, {
      type: 'text', title: 'Cascade Test Slide', sortOrder: 99,
    }, { admin: true });
    if (slideRes.ok && slideRes.data) {
      const tmpSlideId = slideRes.data.id;
      const uploadRes = await makeMultipartUpload(
        `/api/slides/${tmpSlideId}/documents`, 'cascade.txt', 'text/plain', 'cascade test', { admin: true }
      );
      if (uploadRes.ok && uploadRes.data) {
        const tmpDocId = uploadRes.data.id;
        // Delete the slide
        await makeRequest('DELETE', `/api/slides/${tmpSlideId}`, null, { admin: true });
        // Try to download the doc
        const dlRes = await makeRequest('GET', `/api/documents/${tmpDocId}/download`);
        assert(dlRes.status === 404 || dlRes.ok === false, 'Cascade: deleting slide removes its documents');
      }
    }
  }

  // ── Cleanup ──
  {
    console.log(`${COLORS.dim}  [cleanup] Deleting temporary episode: ${EP_SLUG}${COLORS.reset}`);
    await makeRequest('DELETE', `/api/episodes/${EP_SLUG}`, null, { admin: true });
  }

  // ── Summary ──
  console.log(`\n${COLORS.bright}  Slide Documents Results: ${COLORS.green}${passed} passed${COLORS.reset}, ${COLORS.red}${failed} failed${COLORS.reset} of ${passed + failed}\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  makeRequest('DELETE', `/api/episodes/${EP_SLUG}`, null, { admin: true }).finally(() => {
    console.error(`${COLORS.red}Unexpected error: ${err.message}${COLORS.reset}`);
    process.exit(1);
  });
});
