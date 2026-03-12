# Admin Tests

Tests health check and stats endpoints. The seed endpoint is intentionally skipped (destructive).

## Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/admin/stats | Database statistics |

## Intentionally Skipped

| Method | Endpoint | Reason |
|--------|----------|--------|
| POST | /api/admin/seed | Destructive - overwrites database |

## Run

```bash
node admin-tests.js
```
