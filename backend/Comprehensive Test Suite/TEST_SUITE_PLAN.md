# Test Suite Plan

## Overview

This document describes every test case across the five test suites. Each test validates a specific behavior of the financeiscooked platform backend API.

---

## 1. Episodes (`Episodes/episodes-tests.js`)

### Success Cases
1. **GET /api/episodes** - List all episodes, verify array response structure
2. **POST /api/episodes** - Create episode with slug, title; verify returned fields
3. **GET /api/episodes/:slug** - Retrieve created episode by slug, verify nested structure
4. **PUT /api/episodes/:slug** - Update title and date, verify changes persisted
5. **DELETE /api/episodes/:slug** - Delete episode, verify 404 on subsequent fetch

### Error Cases
6. **POST /api/episodes** - Duplicate slug returns error
7. **GET /api/episodes/:slug** - Non-existent slug returns 404/error
8. **PUT /api/episodes/:slug** - Non-existent slug returns error
9. **DELETE /api/episodes/:slug** - Non-existent slug returns error
10. **POST /api/episodes** - Missing required fields returns error

---

## 2. Segments (`Segments/segments-tests.js`)

### Setup
- Create a temporary episode for segment testing

### Success Cases
1. **POST /api/episodes/:slug/segments** - Create segment within episode
2. **POST /api/episodes/:slug/segments** - Create second segment, verify ordering
3. **PUT /api/segments/:id** - Update segment name and status
4. **DELETE /api/segments/:id** - Delete segment

### Error Cases
5. **POST /api/episodes/:slug/segments** - Missing slug field returns error
6. **PUT /api/segments/:id** - Non-existent segment ID returns error
7. **DELETE /api/segments/:id** - Non-existent segment ID returns error
8. **POST /api/episodes/:slug/segments** - Non-existent episode slug returns error

### Cleanup
- Delete temporary episode (cascading deletes segments)

---

## 3. Slides (`Slides/slides-tests.js`)

### Setup
- Create temporary episode, two segments

### Success Cases
1. **POST /api/segments/:id/slides** - Create text slide
2. **POST /api/segments/:id/slides** - Create link slide with URL
3. **GET /api/episodes/:slug** - Verify slides appear in episode response
4. **PUT /api/slides/:id** - Update slide title and notes
5. **POST /api/slides/:id/move** - Move slide between segments
6. **POST /api/slides/:id/finalize** - Finalize slide, check status change
7. **DELETE /api/slides/:id** - Delete slide

### Error Cases
8. **POST /api/segments/:id/slides** - Missing type field returns error
9. **PUT /api/slides/:id** - Non-existent slide ID returns error
10. **DELETE /api/slides/:id** - Non-existent slide ID returns error

### Cleanup
- Delete temporary episode (cascading)

---

## 4. Votes (`Votes/votes-tests.js`)

### Setup
- Create temporary episode, segment, and slide

### Success Cases
1. **POST /api/slides/:id/vote** - Cast upvote
2. **POST /api/slides/:id/vote** - Cast downvote
3. **GET /api/episodes/:slug/votes** - Retrieve vote counts

### Error Cases
4. **POST /api/slides/:id/vote** - Invalid direction returns error
5. **POST /api/slides/:id/vote** - Non-existent slide returns error
6. **GET /api/episodes/:slug/votes** - Non-existent episode returns error or empty

### Cleanup
- Delete temporary episode (cascading)

---

## 5. Admin (`Admin/admin-tests.js`)

### Success Cases
1. **GET /api/health** - Returns ok response
2. **GET /api/admin/stats** - Returns database statistics

### Intentionally Skipped
- **POST /api/admin/seed** - Destructive operation, not safe for automated testing

---

## Response Format

All endpoints return:
- Success: `{ ok: true, data: ... }`
- Error: `{ ok: false, error: "message" }`

## Enums

- **SlideType**: `text`, `link`, `image`, `gallery`
- **ContentStatus**: `proposed`, `final`
- **VoteDirection**: `up`, `down`
