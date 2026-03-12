# financeiscooked Platform — Sub-project 1: Backend + Database + API

## Overview

Replace the static JSON file-based architecture of the financeiscooked soundboard with a proper backend server, PostgreSQL database, and REST API. This is the foundation for the unified platform that will combine the marketing website, episode board, soundboard, and meme board into a single Railway-deployed application.

## Architecture

- **Runtime:** Node.js + Express.js + TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **API Documentation:** Swagger UI via `/opswaggerbuilder` skill
- **Deployment:** Railway (ore@agenticledger.ai)
- **Project location:** `/Users/oreph/Desktop/APPs/financeiscookedplatform`

## Database Schema

### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| email | varchar(255) | unique, nullable |
| display_name | varchar(100) | nullable |
| avatar_url | text | nullable |
| role | enum(anonymous, basic, advanced, admin) | default 'anonymous' |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### `sessions`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users.id, ON DELETE CASCADE |
| token | varchar(255) | unique, not null |
| expires_at | timestamptz | not null |
| created_at | timestamptz | default now() |

### `episodes`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| slug | varchar(50) | unique, not null (e.g. ep1, ep2, backlog) |
| title | varchar(255) | not null |
| date | varchar(50) | nullable |
| sort_order | integer | default 0 |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### `segments`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| episode_id | uuid | FK → episodes.id, ON DELETE CASCADE |
| slug | varchar(100) | not null (e.g. in-the-news, open-intro) |
| name | varchar(255) | not null |
| status | enum(proposed, final) | default 'proposed' |
| sort_order | integer | default 0 |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Unique constraint: (episode_id, slug)

### `slides`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| segment_id | uuid | FK → segments.id, ON DELETE CASCADE |
| type | enum(text, link, image, gallery) | not null |
| title | varchar(500) | not null |
| url | text | nullable |
| notes | text | nullable |
| details | text | nullable |
| status | enum(proposed, final) | default 'proposed' |
| bullets | jsonb | default '[]' |
| sort_order | integer | default 0 |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### `slide_images`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| slide_id | uuid | FK → slides.id, ON DELETE CASCADE |
| src | text | not null |
| alt | varchar(255) | nullable |
| sort_order | integer | default 0 |

### `votes`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| slide_id | uuid | FK → slides.id, ON DELETE CASCADE |
| user_id | uuid | FK → users.id, nullable |
| direction | enum(up, down) | not null |
| created_at | timestamptz | default now() |

Index: (slide_id) for fast count queries.

## API Endpoints

### Episodes
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/episodes | List all episodes (with segment/slide counts) |
| GET | /api/episodes/:slug | Get full episode with segments and slides |
| POST | /api/episodes | Create episode |
| PUT | /api/episodes/:slug | Update episode metadata |
| DELETE | /api/episodes/:slug | Delete episode and all children |

### Segments
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/episodes/:slug/segments | Create segment in episode |
| PUT | /api/segments/:id | Update segment (name, status, order) |
| DELETE | /api/segments/:id | Delete segment and all slides |

### Slides
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/segments/:id/slides | Create slide in segment |
| PUT | /api/slides/:id | Update slide |
| DELETE | /api/slides/:id | Delete slide |
| POST | /api/slides/:id/move | Move slide to different segment/episode |
| POST | /api/slides/:id/finalize | Set slide + parent segment status to final |

### Votes
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/slides/:id/vote | Cast vote { direction: "up" | "down" } |
| GET | /api/episodes/:slug/votes | Get all vote counts for an episode |

### Admin / Utility
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/admin/seed | Seed DB from JSON files in /seed-data |
| GET | /api/health | Health check |

### Response format
All responses follow: `{ ok: true, data: ... }` or `{ ok: false, error: "message" }`

GET /api/episodes/:slug returns nested structure matching current JSON format so the frontend can consume it without changes:
```json
{
  "ok": true,
  "data": {
    "id": "ep2",
    "title": "Episode 2",
    "date": "",
    "segments": [
      {
        "id": "open-intro",
        "name": "Open / Intro",
        "status": "final",
        "slides": [...]
      }
    ]
  }
}
```

## Data Migration

A seed script reads the existing JSON files from the soundboard's `public/episodes/` directory (copied to `/seed-data` in the new project) and inserts them into the database. This runs once to bootstrap the DB with all existing episode data.

## Project Structure

```
financeiscookedplatform/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server entry
│   │   ├── routes/
│   │   │   ├── episodes.ts
│   │   │   ├── segments.ts
│   │   │   ├── slides.ts
│   │   │   ├── votes.ts
│   │   │   └── admin.ts
│   │   ├── middleware/
│   │   │   └── error-handler.ts
│   │   └── seed/
│   │       └── seed-from-json.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
├── frontend/                      # (sub-project 2)
├── docs/
│   └── superpowers/
├── seed-data/                     # Copied JSON files for initial seed
└── README.md
```

## Deployment (Railway)

- PostgreSQL provisioned as Railway service
- Backend deployed as Node.js service
- DATABASE_URL provided by Railway
- Port from PORT env var (Railway sets this)

## Current Behavior Preserved

- All existing episode data migrated via seed
- API response format matches current JSON structure so frontend works with minimal changes
- Votes work the same (anonymous, unlimited)
- No auth required for any endpoint (anonymous role default)
- Admin actions (accept/delete/move) remain client-side gated for now

## Future-Ready

- `users` and `sessions` tables ready for auth
- `role` enum supports anonymous → basic → advanced → admin progression
- `votes.user_id` nullable FK ready for per-user vote tracking
- API structure supports adding auth middleware per-route when needed
