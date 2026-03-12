# Slides Tests

Tests slide CRUD, move, and finalize operations.

## Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/segments/:id/slides | Create slide in segment |
| PUT | /api/slides/:id | Update slide |
| DELETE | /api/slides/:id | Delete slide |
| POST | /api/slides/:id/move | Move slide between segments |
| POST | /api/slides/:id/finalize | Finalize slide and parent segment |

## Test Flow

1. Creates a temporary episode with two segments
2. Tests slide creation, update, move, finalize, delete
3. Cleans up by deleting the episode (cascading)

## Run

```bash
node slides-tests.js
```
