---
date: 2026-04-26
domains: [fullstack, nextjs, drizzle, sse, dnd, bugfix, lint]
topics: [trello-clone, kanban, react-query, tailwind, docker, kamal, bugfix, lint]
subject: 2026-04-26.trello-clone-mvp
artifacts: [plan-trello-clone.md]
related: []
priority: high
status: active
---

# Session: 2026-04-26/27 - Trello Clone MVP Implementation

## Context
- Building a full Trello clone MVP with Next.js 16, Drizzle ORM, SQLite, and real-time SSE
- Started from scratch with empty Next.js project
- Session via `b-build` → `b-review` → `b-iterate` workflow

## What Was Built

### Backend Infrastructure
- **lib/db/schema.ts**: Drizzle schema for users, boards, lists, cards
- **lib/db/index.ts**: SQLite connection with auto-init
- **lib/auth/jwt.ts**: JWT sign/verify with cookie helpers
- **lib/auth/middleware.ts**: Auth middleware for protected routes
- **lib/errors/**: AppError classes and API error handler
- **lib/sse/**: SSE pub/sub manager for real-time updates
- **lib/logger.ts**: Pino logger setup

### Authentication (features/auth/)
- Register, login, logout routes
- bcrypt password hashing
- JWT in HTTP-only cookies

### Boards (features/boards/)
- Full CRUD with soft delete
- SSE endpoint for real-time updates (with auth check)
- Board service with lists and cards

### Lists (features/lists/)
- CRUD operations
- Position-based ordering
- SSE broadcasting

### Cards (features/cards/)
- CRUD operations
- Move between lists
- Position-based ordering

### Frontend
- **components/auth/**: LoginForm, RegisterForm
- **components/board/**: Board, Column, Card (with @hello-pangea/dnd)
- **components/ui/**: Modal, Skeleton
- **hooks/**: useBoards, useBoard, useSSE
- **app/(auth)/**: login, register pages
- **app/(app)/**: boards list, board detail pages

### Deployment
- Dockerfile (multi-stage Node.js)
- Kamal config (config/deploy.yml)

## B-Review Fixes Applied (2026-04-27)

### Iteration 1 - Critical Fixes
- ✅ List reordering now persists (added useReorderList hook)
- ✅ Dead code removed from card service
- ✅ Added missing dev dependencies

### Iteration 2 - Polish
- ✅ Added `/api/health` endpoint (required for Kamal healthcheck)
- ✅ Cleaned up 26+ lint warnings (unused imports/vars)
- ✅ Simplified reorderList API - boardId derived from listId for security

## Key Files Created/Modified (71 files)
```
lib/logger.ts, lib/auth/jwt.ts, lib/auth/middleware.ts
lib/sse/events.ts, lib/sse/index.ts
lib/db/index.ts, lib/db/schema.ts, drizzle.config.ts
lib/errors/index.ts, lib/errors/handler.ts
features/auth/routes/{register,login,logout}/route.ts
features/auth/services/auth.service.ts, features/auth/schemas/auth.schemas.ts
features/boards/routes/route.ts, features/boards/routes/[boardId]/route.ts
features/boards/routes/[boardId]/sse/route.ts
features/boards/services/board.service.ts, features/boards/schemas/board.schemas.ts
features/lists/routes/route.ts, features/lists/routes/[listId]/route.ts
features/lists/services/list.service.ts, features/lists/schemas/list.schemas.ts
features/cards/routes/route.ts, features/cards/routes/[cardId]/route.ts
features/cards/services/card.service.ts, features/cards/schemas/card.schemas.ts
components/auth/{LoginForm,RegisterForm}.tsx
components/board/{Board,Column,Card}.tsx
components/ui/{Modal,Skeleton}.tsx
components/providers/QueryProvider.tsx
hooks/useBoards.ts, hooks/useBoard.ts, hooks/useSSE.ts
app/(app)/boards/page.tsx, app/(app)/boards/[boardId]/page.tsx
app/(app)/layout.tsx, app/page.tsx, app/layout.tsx
app/(auth)/login/page.tsx, app/(auth)/register/page.tsx
app/api/health/route.ts (new)
app/api/auth/{register,login,logout}/route.ts
app/api/boards/route.ts, app/api/boards/[boardId]/route.ts
app/api/boards/[boardId]/sse/route.ts
app/api/lists/route.ts, app/api/lists/[listId]/route.ts
app/api/cards/route.ts, app/api/cards/[cardId]/route.ts
Dockerfile, config/deploy.yml, .env.example, next.config.ts
```

## Build Status
- ✅ `npm run build` passes
- ✅ `npm run dev` runs on port 3000
- ✅ Lint passes (0 warnings, 0 errors)

## Decisions Made
- Used SQLite for simplicity (can switch to PostgreSQL for production)
- Used better-sqlite3 native module (configured in next.config.ts)
- Feature-based folder structure for scalability
- SSE auth verified on every request (calls getBoardWithData)
- Simplified reorderList API - boardId derived from listId for security

## Remaining Items
1. Manual testing of auth flow
2. Manual testing of board/list/card CRUD
3. Manual testing of drag-and-drop (lists + cards)
4. Set up Kamal deployment secrets
5. Deploy to Hostinger VPS
6. Add integration tests (tests/integration/ is empty)
