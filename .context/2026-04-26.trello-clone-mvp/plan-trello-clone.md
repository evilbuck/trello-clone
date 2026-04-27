---
status: completed
date: 2026-04-26
subject: 2026-04-26.trello-clone-mvp
topics: [kanban, nextjs, drizzle, sse, dnd, jwt, docker, kamal]
type: plan
priority: high
research: []
spec: []
memory: [trello-clone-implementation-2026-04-26.md, card-drag-fix-2026-04-26.md, trello-clone-deploy-2026-04-27.md, google-analytics-2026-04-27.md]
completed: 2026-04-27
---

# Plan: Trello Clone MVP

## Goal

Build a kanban board application with drag-and-drop cards and lists, persistent state across clients, and real-time sync via SSE.

## Tech Stack Decisions

| Category | Choice |
|----------|--------|
| Framework | Next.js (full-stack with API Routes) |
| Database | SQLite + Drizzle ORM |
| Drag & Drop | @hello-pangea/dnd |
| State Management | TanStack Query (React Query) |
| Styling | Tailwind CSS (plain, no shadcn) |
| Authentication | JWT in HTTP-only cookies |
| Password Hashing | bcrypt |
| Validation | Zod |
| Real-time | Server-Sent Events (SSE) per-board |
| Logging | Pino |
| Deployment | Docker + Kamal 2.0 |
| Server | Hostinger VPS |

## Project Structure (Feature-based)

```
trello-clone/
├── features/
│   ├── auth/
│   │   ├── routes/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   └── logout/route.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── schemas/
│   │   │   └── auth.schemas.ts
│   │   └── middleware.ts
│   ├── boards/
│   │   ├── routes/
│   │   │   ├── route.ts              # GET all, POST create
│   │   │   ├── [boardId]/route.ts     # GET, DELETE (soft)
│   │   │   └── [boardId]/sse/route.ts  # SSE endpoint
│   │   ├── services/
│   │   │   └── board.service.ts
│   │   └── schemas/
│   │       └── board.schemas.ts
│   ├── lists/
│   │   ├── routes/
│   │   │   ├── [boardId]/route.ts     # GET all lists for board
│   │   │   └── [listId]/route.ts      # POST create list, PATCH update, DELETE
│   │   ├── services/
│   │   │   └── list.service.ts
│   │   └── schemas/
│   │       └── list.schemas.ts
│   └── cards/
│       ├── routes/
│       │   ├── [listId]/route.ts      # GET all cards for list, POST create
│       │   └── [cardId]/route.ts      # PATCH update, DELETE
│       ├── services/
│       │   └── card.service.ts
│       └── schemas/
│           └── card.schemas.ts
├── lib/
│   ├── db/
│   │   ├── index.ts                   # Drizzle client
│   │   ├── schema.ts                  # All Drizzle schemas
│   │   └── migrations/
│   ├── sse/
│   │   ├── index.ts                   # SSE manager
│   │   └── events.ts                  # Event types
│   ├── errors/
│   │   ├── index.ts                   # Error classes
│   │   └── handler.ts                 # API error wrapper
│   ├── auth/
│   │   ├── jwt.ts                     # JWT sign/verify
│   │   └── middleware.ts              # Auth middleware for routes
│   ├── logger.ts                      # Pino logger
│   └── utils.ts
├── components/
│   ├── board/
│   │   ├── Board.tsx
│   │   ├── Column.tsx
│   │   └── Card.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── ui/
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx
│   │   └── Modal.tsx
│   └── providers/
│       └── QueryProvider.tsx
├── hooks/
│   ├── useBoard.ts
│   ├── useLists.ts
│   ├── useCards.ts
│   └── useSSE.ts
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                 # Authenticated layout
│   │   ├── boards/page.tsx           # Board list
│   │   └── boards/[boardId]/page.tsx # Board view
│   ├── api/
│   │   └── (routes already in features)
│   ├── layout.tsx
│   └── page.tsx                      # Redirect to /boards or /login
├── Dockerfile
├── config/
│   └── deploy.yml                    # Kamal config
├── drizzle.config.ts
├── tests/
│   └── integration/
│       ├── auth.test.ts
│       ├── boards.test.ts
│       ├── lists.test.ts
│       └── cards.test.ts
└── package.json
```

## Database Schema (Drizzle)

```typescript
// Users
users: {
  id: text().primaryKey().uuid(),
  email: text().unique().notNull(),
  passwordHash: text().notNull(),
  createdAt: integer({ mode: 'timestamp' }).notNull(),
}

// Boards
boards: {
  id: text().primaryKey().uuid(),
  userId: text().references(users.id).notNull(),
  title: text().notNull(),
  deletedAt: integer({ mode: 'timestamp' }).nullable(),  // Soft delete
  createdAt: integer({ mode: 'timestamp' }).notNull(),
  updatedAt: integer({ mode: 'timestamp' }).notNull(),
}

// Lists
lists: {
  id: text().primaryKey().uuid(),
  boardId: text().references(boards.id).notNull(),
  title: text().notNull(),
  description: text().nullable(),
  position: real().notNull(),  // Floating-point ordering
  createdAt: integer({ mode: 'timestamp' }).notNull(),
  updatedAt: integer({ mode: 'timestamp' }).notNull(),
}

// Cards
cards: {
  id: text().primaryKey().uuid(),
  listId: text().references(lists.id).notNull(),
  title: text().notNull(),
  position: real().notNull(),  // Floating-point ordering
  createdAt: integer({ mode: 'timestamp' }).notNull(),
  updatedAt: integer({ mode: 'timestamp' }).notNull(),
}
```

## API Design

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login, sets JWT cookie |
| `/api/auth/logout` | POST | Clears JWT cookie |

### Boards

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/boards` | GET | List user's boards |
| `/api/boards` | POST | Create new board |
| `/api/boards/:id` | GET | Get board with lists & cards |
| `/api/boards/:id` | DELETE | Soft delete board |
| `/api/boards/:id/sse` | GET | SSE stream for real-time updates |

### Lists

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/lists/:boardId` | GET | Get all lists for board |
| `/api/lists` | POST | Create list |
| `/api/lists/:id` | PATCH | Update list (title, description, position) |
| `/api/lists/:id` | DELETE | Delete list |

### Cards

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cards/:listId` | GET | Get all cards for list |
| `/api/cards` | POST | Create card |
| `/api/cards/:id` | PATCH | Update card (title, position, listId for moves) |
| `/api/cards/:id` | DELETE | Delete card |

## Error Response Format

```typescript
{
  error: {
    code: 'CARD_NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | ...,
    message: 'Human-readable message',
    details?: Record<string, any>  // Optional extra info
  }
}
```

## Cookie Settings

```
Name: auth_token
HttpOnly: true
Secure: true (prod) / false (dev)
SameSite: 'Lax'
Path: '/'
MaxAge: 60 * 60 * 24 * 7  // 7 days
```

## SSE Event Types

```typescript
type SSEEvent =
  | { type: 'BOARD_UPDATED'; boardId: string }
  | { type: 'LIST_CREATED'; boardId: string; list: List }
  | { type: 'LIST_UPDATED'; boardId: string; list: List }
  | { type: 'LIST_DELETED'; boardId: string; listId: string }
  | { type: 'CARD_CREATED'; boardId: string; card: Card }
  | { type: 'CARD_UPDATED'; boardId: string; card: Card }
  | { type: 'CARD_DELETED'; boardId: string; cardId: string }
```

## Implementation Order

1. **Setup & Config**
   - Install dependencies (drizzle, @hello-pangea/dnd, @tanstack/react-query, bcryptjs, jsonwebtoken, zod, pino)
   - Configure Drizzle with SQLite
   - Set up Pino logger

2. **Database & Schema**
   - Create Drizzle schema
   - Run initial migration
   - Create connection helper

3. **Authentication**
   - JWT utilities
   - Error classes
   - Auth service
   - Register/Login/Logout routes
   - Cookie handling middleware

4. **Boards Feature**
   - Board service
   - Board routes (CRUD + SSE)
   - SSE manager for pub/sub

5. **Lists Feature**
   - List service
   - List routes
   - Position ordering logic

6. **Cards Feature**
   - Card service
   - Card routes
   - Position ordering logic

7. **Frontend - Auth**
   - Login/Register pages
   - Auth context/hooks

8. **Frontend - Board List**
   - Board list page
   - Create board modal
   - Board card component

9. **Frontend - Kanban Board**
   - Board page layout
   - Column (List) component
   - Card component
   - Drag-and-drop integration

10. **Frontend - Real-time**
    - SSE hook
    - Auto-refresh on events

11. **Frontend - UX Polish**
    - Skeleton loading
    - Toast notifications
    - Error boundaries
    - Optimistic updates

12. **Docker & Deployment**
    - Dockerfile
    - Kamal deploy.yml
    - Secrets configuration

13. **Testing**
    - Integration tests for auth
    - Integration tests for CRUD operations

## Affected Files

Core new files:
- `features/auth/*` - Authentication module
- `features/boards/*` - Board management
- `features/lists/*` - List management
- `features/cards/*` - Card management
- `lib/db/*` - Database connection and schema
- `lib/sse/*` - SSE pub/sub system
- `lib/errors/*` - Error handling
- `lib/auth/*` - JWT utilities
- `lib/logger.ts` - Pino setup
- `components/*` - React components
- `hooks/*` - Custom hooks
- `app/(auth)/*` - Auth pages
- `app/(app)/*` - App pages
- `Dockerfile` - Container definition
- `config/deploy.yml` - Kamal deployment
- `tests/integration/*` - Integration tests

## Verification Checklist

- [ ] User can register and login
- [ ] JWT cookie is set on login, cleared on logout
- [ ] Protected routes return 401 without valid cookie
- [ ] User can create multiple boards
- [ ] User can soft-delete boards
- [ ] Deleted boards don't appear in list
- [ ] Board shows lists in position order
- [ ] Lists can be dragged to reorder
- [ ] Cards can be dragged within a list
- [ ] Cards can be dragged between lists
- [ ] SSE broadcasts updates to board subscribers
- [ ] Page loads show skeleton, then content
- [ ] Drag operations show optimistic feedback
- [ ] Errors show toast notifications
- [ ] Docker image builds successfully
- [ ] Kamal deploys to Hostinger
- [ ] Integration tests pass
