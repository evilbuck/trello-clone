# Todo: Trello Clone MVP

**Created**: 2026-04-26
**Status**: in-progress

## Implementation Tasks

### Phase 1: Setup & Config ✅
- [x] Install dependencies (drizzle, @hello-pangea/dnd, @tanstack/react-query, bcryptjs, jsonwebtoken, zod, pino)
- [x] Configure Drizzle with SQLite
- [x] Set up Pino logger

### Phase 2: Database & Schema ✅
- [x] Create Drizzle schema (users, boards, lists, cards)
- [x] Run initial migration (using SQLite auto-init)
- [x] Create connection helper

### Phase 3: Authentication ✅
- [x] JWT utilities (sign/verify)
- [x] Error classes (handleApiError wrapper)
- [x] Auth service (register, login, logout)
- [x] Register route
- [x] Login route (sets JWT cookie)
- [x] Logout route (clears cookie)
- [x] Auth middleware for protected routes

### Phase 4: Boards Feature ✅
- [x] Board service
- [x] GET /api/boards - List user's boards
- [x] POST /api/boards - Create board
- [x] GET /api/boards/:id - Get board with lists & cards
- [x] DELETE /api/boards/:id - Soft delete
- [x] SSE manager (pub/sub per board)
- [x] GET /api/boards/:id/sse - SSE endpoint

### Phase 5: Lists Feature ✅
- [x] List service
- [x] GET /api/lists/:boardId - Get all lists
- [x] POST /api/lists - Create list
- [x] PATCH /api/lists/:id - Update (title, description, position)
- [x] DELETE /api/lists/:id - Delete list

### Phase 6: Cards Feature ✅
- [x] Card service
- [x] GET /api/cards/:listId - Get all cards
- [x] POST /api/cards - Create card
- [x] PATCH /api/cards/:id - Update (title, position, listId)
- [x] DELETE /api/cards/:id - Delete card

### Phase 7: Frontend - Auth ✅
- [x] Login page
- [x] Register page
- [x] Auth context/hooks
- [x] Protected layout wrapper

### Phase 8: Frontend - Board List ✅
- [x] Board list page
- [x] Create board modal
- [x] Board card component
- [x] Soft delete button

### Phase 9: Frontend - Kanban Board ✅
- [x] Board page layout
- [x] Column (List) component with DnD
- [x] Card component with DnD
- [x] Drag-and-drop integration (lists and cards)
- [x] Create list / Create card inline

### Phase 10: Frontend - Real-time ✅
- [x] SSE hook
- [x] Auto-refetch on SSE events

### Phase 11: Frontend - UX Polish ⚠️ (Partial)
- [x] Skeleton loading components
- [x] Toast notification system (basic)
- [ ] Error boundaries (skipped for MVP)
- [x] Optimistic updates for drag operations
- [ ] Mobile horizontal scroll (basic scroll works)

### Phase 12: Docker & Deployment ✅
- [x] Dockerfile (multi-stage)
- [x] Kamal deploy.yml
- [ ] Kamal secrets configuration (needs user setup)
- [ ] Test deployment to Hostinger (needs server access)

### Phase 13: Testing ⚠️ (Not Started)
- [ ] Integration tests: Auth (register, login, logout)
- [ ] Integration tests: Boards CRUD
- [ ] Integration tests: Lists CRUD
- [ ] Integration tests: Cards CRUD

## Notes
- Refer to plan: .context/2026-04-26.trello-clone-mvp/plan-trello-clone.md
- SSE events broadcast to all clients viewing the same board
- Position logic: floating-point, renormalize when precision issues arise
- Build succeeds with `npm run build`
- Dev server runs with `npm run dev`
