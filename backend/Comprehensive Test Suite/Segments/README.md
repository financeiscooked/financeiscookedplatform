# Segments Tests

Tests segment CRUD within an episode context, including error handling.

## Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/episodes/:slug/segments | Create segment in episode |
| PUT | /api/segments/:id | Update segment |
| DELETE | /api/segments/:id | Delete segment |

## Test Flow

1. Creates a temporary episode as a container
2. Runs all segment tests within that episode
3. Cleans up by deleting the episode (cascading)

## Run

```bash
node segments-tests.js
```
