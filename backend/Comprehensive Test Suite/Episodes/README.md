# Episodes Tests

Tests the full CRUD lifecycle for episodes plus error handling.

## Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/episodes | List all episodes |
| POST | /api/episodes | Create a new episode |
| GET | /api/episodes/:slug | Get episode by slug |
| PUT | /api/episodes/:slug | Update episode |
| DELETE | /api/episodes/:slug | Delete episode |

## Test Cases

### Success Path
1. List episodes - verify array response
2. Create episode - verify returned fields
3. Get episode by slug - verify nested structure
4. Update episode - verify changes persist
5. Delete episode - verify removal

### Error Cases
6. Create duplicate slug - expect error
7. Get non-existent slug - expect error
8. Update non-existent slug - expect error
9. Delete non-existent slug - expect error
10. Create with missing fields - expect error

## Run

```bash
node episodes-tests.js
```
