# Votes Tests

Tests vote casting and retrieval.

## Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/slides/:id/vote | Cast a vote (up or down) |
| GET | /api/episodes/:slug/votes | Get vote counts for episode |

## Test Flow

1. Creates a temporary episode, segment, and slide
2. Tests upvote, downvote, and vote retrieval
3. Cleans up by deleting the episode (cascading)

## Run

```bash
node votes-tests.js
```
