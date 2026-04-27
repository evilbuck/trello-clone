---
date: 2026-04-26
domains: [architecture, planning]
topics: [trello-clone, kanban, nextjs, drizzle, sse, jwt, docker, kamal, hellow-pangea-dnd, tanstack-query]
subject: 2026-04-26.trello-clone-mvp
artifacts: [plan-trello-clone.md]
related: []
priority: high
status: active
---

# Session: 2026-04-26 - Trello Clone MVP Scope

## Context
- New project: Trello clone with kanban board functionality
- Goal: MVP with persistence, single user, one board (with ability to create multiple)
- Used grill-me workflow to define full scope

## Key Decisions Made

### Stack
- **Next.js** full-stack with API Routes (Option A)
- **SQLite + Drizzle ORM** (Option C - preferred over Prisma)
- **@hello-pangea/dnd** for drag-and-drop (Option B - Atlassian fork)
- **TanStack Query** for state management (Option C)
- **Tailwind CSS** plain (Option A)
- **REST API** (Option A)
- **JWT in HTTP-only cookies** (Option A)
- **bcrypt** for password hashing (Option A)
- **Zod** for validation (Option A)
- **SSE per-board** for real-time (Option A - chosen despite recommendation for simpler approach)
- **Pino** for structured logging (changed from recommendation)
- **Docker + Kamal 2.0** to Hostinger VPS

### Features
- Multiple boards per user (not single board - chose Option C)
- Soft delete for boards (Option B)
- Cards: title only (Option A)
- Lists: title + description (Option C)
- Mobile: horizontal scroll (Option A)
- Initial board: single empty list "To Do" (Option C)
- No board deletion for MVP (deferred)

### Architecture
- Feature-based folder structure (Option B)
- Hybrid request validation (Option D): handlers validate auth/params, services validate business rules
- SSE events per-board channel
- Floating-point position ordering
- Structured errors with codes
- Skeleton + optimistic updates for UX

## Implementation Plan Created
- Location: .context/2026-04-26.trello-clone-mvp/plan-trello-clone.md
- 13 implementation phases from setup to testing
- Detailed API design, schema, and file structure

## Next Steps
- [ ] Start implementing Phase 1: Setup & Config
- [ ] Follow todo.md for task tracking
