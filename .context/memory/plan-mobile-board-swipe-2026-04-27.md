---
date: 2026-04-27
domains: [planning, frontend, mobile, ui]
topics: [mobile-board, swipe, scroll-snap, responsive, trello-clone]
related: []
priority: high
status: active
---

# Session: Plan mobile board swipe view

## Context
User wants the mobile board view redesigned. Currently the board renders all lists horizontally at fixed 280px width, which is unusable on mobile.

## Decisions Made
- Mobile breakpoint: 768px (`max-width: 768px`)
- Disable DnD on mobile entirely — swipe gestures conflict with drag handlers
- Use CSS scroll-snap (`snap-x snap-mandatory snap-center`) for native swipe-to-snap behavior
- Each list takes `85vw` width so adjacent lists peek in from sides
- Create `MobileBoard` + `MobileList` components rather than overloading existing `Column`
- "Add a list" appears as the final snap target in the carousel

## Plan Artifact
- `.context/2026-04-27.mobile-board-swipe/plan-mobile-board-swipe.md`

## Files identified
- `hooks/useIsMobile.ts` — new hook
- `components/board/MobileBoard.tsx` — new component
- `components/board/MobileList.tsx` — new component
- `components/board/Board.tsx` — modify to branch mobile/desktop

## Next Steps
- Run `b-build` to implement the plan
