# Comprehensive API Test Suite

## financeiscooked Platform Backend

Standalone test suite for the Express REST API at `https://backend-production-0e40.up.railway.app`.

## Prerequisites

- Node.js 18+ (uses native `fetch`)

## Running Tests

Run all test suites:

```bash
node run-all-tests.js
```

Run a single suite:

```bash
node Episodes/episodes-tests.js
node Segments/segments-tests.js
node Slides/slides-tests.js
node Votes/votes-tests.js
node Admin/admin-tests.js
```

## Configuration

Set `BASE_URL` environment variable to test against a different server:

```bash
BASE_URL=http://localhost:3001 node run-all-tests.js
```

## Test Structure

| Suite | Endpoints Tested | Description |
|-------|-----------------|-------------|
| Episodes | 5 endpoints | Full CRUD lifecycle, error handling |
| Segments | 3 endpoints | CRUD within episodes, cascading behavior |
| Slides | 5 endpoints | CRUD, move, finalize operations |
| Votes | 2 endpoints | Vote casting and retrieval |
| Admin | 2 endpoints | Health check and stats (seed skipped) |

## Notes

- No authentication required (public API)
- Tests create their own data and clean up after themselves
- The Admin seed endpoint is intentionally NOT tested (destructive)
- All responses follow `{ok, data}` or `{ok, error}` format
