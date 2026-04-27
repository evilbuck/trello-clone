---
date: 2026-04-27
domains: [frontend, analytics, tooling]
topics: [google-analytics, gtag, events, nextjs, tracking]
subject: 2026-04-27.google-analytics
artifacts: []
related: [trello-clone-implementation-2026-04-26.md, trello-clone-deploy-2026-04-27.md]
priority: medium
status: active
---

# Session: 2026-04-27 - Google Analytics Integration

## Context
- Previous work: MVP complete, deployed, card edit dialog and drag fixes done
- Goal: Add Google Analytics tracking (GA4 tag G-0GMPP2YP2E) and custom event tracking for key user actions

## Decisions Made
- Used `next/script` with `strategy="afterInteractive"` for the GA tag in root layout — avoids blocking initial render
- Created centralized `lib/analytics.ts` utility with typed event helpers instead of calling `window.gtag` directly everywhere
- Tracked events fire **after** successful mutations, not before — only real completions are counted
- Used GA4 recommended event names where applicable (`sign_up`, `login`) and custom names for domain events (`create_board`, `create_list`, `create_card`)
- Events include entity IDs as parameters for later analysis in GA

## Implementation Notes

### New file
- `lib/analytics.ts` — Centralized GA event tracking:
  - `trackEvent()` — generic sender with SSR guard
  - `trackSignUp(method)` / `trackLogin(method)` — auth events
  - `trackCreateBoard(boardId, title)` / `trackCreateList(listId, title, boardId)` / `trackCreateCard(cardId, title, listId, boardId)` — domain events
  - Includes `declare global` for `window.gtag` and `window.dataLayer` TypeScript types

### Modified files
- `app/layout.tsx` — Added GA script tags via `<Script>` components
- `components/auth/LoginForm.tsx` — `trackLogin('email')` after successful login
- `components/auth/RegisterForm.tsx` — `trackSignUp('email')` after successful registration
- `app/(app)/boards/page.tsx` — `trackCreateBoard(result.board.id, title)` after board creation
- `components/board/Board.tsx` — `trackCreateList(result.list.id, title, boardId)` after list creation
- `components/board/Column.tsx` — `trackCreateCard(result.card.id, title, listId, boardId)` after card creation

### Key gotchas
- API routes return `{ board }`, `{ list }`, `{ card }` — confirmed the mutation results have the right shape
- `typeof window` guard in `trackEvent()` prevents SSR crashes since gtag only exists in browser
- TypeScript compiles clean (`npx tsc --noEmit` — zero errors)

## Next Steps
- [ ] Verify events fire in production using GA4 Real-Time debug view
- [ ] Consider adding `trackDeleteBoard`, `trackDeleteCard` if needed
- [ ] Set up GA4 custom dimensions for board_title etc. if dashboard reporting is needed
