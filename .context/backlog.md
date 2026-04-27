# Backlog

## Details

### trello-clone-mvp
**Description**: Build a Trello clone MVP with drag-and-drop, persistent state, and real-time sync
**Context**:
- Tech stack: Next.js, SQLite/Drizzle, @hello-pangea/dnd, TanStack Query, JWT auth, SSE, Docker/Kamal
- See full plan: [.context/2026-04-26.trello-clone-mvp/plan-trello-clone.md](.context/2026-04-26.trello-clone-mvp/plan-trello-clone.md)
- Key decisions: Feature-based structure, floating-point ordering, structured errors, hybrid loading (skeleton + optimistic)
- **Status**: Implementation complete (2026-04-27). Bug fixes applied: list reordering persistence, dead code removal.

### trello-clone-manual-testing
**Description**: Manual testing and verification of the implemented Trello clone
**Context**:
- Test auth flow (register, login, logout)
- Test board/list/card CRUD operations
- Test drag-and-drop functionality (lists + cards)
- Test SSE real-time updates
- Docker image verification

### trello-clone-deployment
**Description**: Deploy to Hostinger VPS using Kamal
**Context**:
- Configure Kamal secrets
- Test deployment
- Verify production build works

## High Priority
- [ ] Manual testing and verification of Trello Clone MVP
- [ ] Deploy to Hostinger VPS using Kamal

## Medium Priority
- [ ] Add integration tests

## Completed
- [x] Define MVP scope and architecture (2026-04-26)
- [x] Implement Trello Clone MVP (2026-04-26)
- [x] Fix critical bugs from b-review (list reordering, card service dead code) (2026-04-27)
- [x] Clean up lint warnings (26 unused imports, added /api/health endpoint) (2026-04-27)
