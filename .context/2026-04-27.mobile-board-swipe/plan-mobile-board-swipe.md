---
status: completed
date: 2026-04-27
subject: 2026-04-27.mobile-board-swipe
topics: [mobile, swipe, scroll-snap, board, responsive, dnd]
research: []
spec:
memory: [mobile-board-swipe-2026-04-27.md]
---

# Plan: Mobile Board Swipe View

## Goal
Replace the current mobile board view (tiny horizontal scroll of all lists) with a swipeable, snap-to-list carousel. On mobile viewports, users see one list at a time centered in the viewport, with adjacent lists peeking in from the sides. Swiping left/right navigates between lists, and the scroll snaps to the nearest list only after the user releases their finger.

## Context used / assumptions
- **User-provided context**: One list at a time, swipe left/right, snap/lock on release, adjacent lists partially visible (half-in/half-out).
- **Session context**: The Trello clone MVP is complete. Board uses `@hello-pangea/dnd` for desktop drag-and-drop. Lists are fixed at `w-[280px]`.
- **Artifacts used**: None.
- **Assumptions / open questions**:
  - Drag-and-drop will be **disabled on mobile** — swipe gestures and dnd touch handlers conflict. Card reordering and list reordering are desktop-only features.
  - All CRUD operations (add/delete card, edit card title, add/delete list) remain available on mobile.
  - Mobile breakpoint: `768px` (`md:` in Tailwind). This is arbitrary but standard; user can adjust.
  - The "Add a list" button will appear as the final snap target in the carousel.
  - No pagination dots or list title indicator for now — can be added later if desired.

## Scope
- Create a `useIsMobile` hook for viewport-based mobile detection.
- Create a `MobileBoard` component that renders lists in a CSS scroll-snap horizontal carousel.
- Create a `MobileList` component (or inline equivalent) for the non-DnD list UI on mobile.
- Update `Board.tsx` to conditionally render `MobileBoard` on mobile and the existing DnD view on desktop.
- Style mobile lists to take ~`85vw` width, centered, with adjacent lists peeking in.
- Ensure vertical scrolling within a list (cards area) still works independently.

## Out of scope
- Pagination dots / page indicator for current list.
- Long-press drag-and-drop on mobile.
- Animations or transitions beyond native CSS scroll snap.
- Changing desktop layout or DnD behavior.
- Pull-to-refresh or other mobile-native gestures.

## Affected files
| File | Action | Description |
|------|--------|-------------|
| `hooks/useIsMobile.ts` | Create | Hook returning `isMobile` boolean based on `window.matchMedia('(max-width: 768px)')` |
| `components/board/MobileBoard.tsx` | Create | Horizontal scroll-snap container; maps `board.lists` to `MobileList`; includes "Add a list" as final snap target |
| `components/board/MobileList.tsx` | Create | Non-DnD list UI: title, vertically scrollable cards, add-card form, card modal. Shares visual style with `Column.tsx` |
| `components/board/Board.tsx` | Modify | Use `useIsMobile`; render `MobileBoard` when mobile, existing `DragDropContext` view when desktop |

## Implementation steps
1. **Create `hooks/useIsMobile.ts`**
   - Use `useState` + `useEffect` to listen to `(max-width: 768px)` media query.
   - Return `{ isMobile: boolean }`.
   - Handle SSR (default to `false` until effect runs).

2. **Create `components/board/MobileList.tsx`**
   - Accept `list: List`, `onDeleteList: (id) => void`.
   - Copy card rendering, add-card form, and card modal logic from `Column.tsx` but strip all `@hello-pangea/dnd` imports/wrappers.
   - Keep the same Tailwind classes for visual parity (rounded bg, borders, etc.).
   - Cards remain clickable to open `CardModal` for editing.
   - Ensure the cards area has `overflow-y-auto` for independent vertical scroll.

3. **Create `components/board/MobileBoard.tsx`**
   - Accept `boardId: string` and reuse existing data hooks (`useBoard`, `useCreateList`, etc.) — or receive board data and handlers as props from `Board.tsx`.
   - Render a `<div>` with classes:
     - `flex overflow-x-auto snap-x snap-mandatory`
     - `scrollbar-hide` (optional, or just native scrollbar)
   - For each list, render a wrapper `<div>` with:
     - `flex-shrink-0 w-[85vw] snap-center px-2`
     - The `px-2` creates visible gaps so adjacent lists peek in.
   - Render `MobileList` inside each wrapper.
   - Render the "Add a list" UI as the final snap target (`w-[85vw] snap-center`).
   - Keep board title header from `Board.tsx` (or let `Board.tsx` render the header above both views).

4. **Modify `components/board/Board.tsx`**
   - Import `useIsMobile` and conditionally render.
   - Extract the board title header so it renders above both mobile and desktop views.
   - When `isMobile` is true, render `<MobileBoard ... />` instead of `<DragDropContext>`.
   - When `isMobile` is false, keep existing desktop DnD view unchanged.
   - Pass necessary handlers/data to `MobileBoard` (or let `MobileBoard` call hooks directly).

5. **Verification**
   - Open board on a mobile viewport (Chrome DevTools responsive mode, iPhone SE / 375px width).
   - Swipe left/right: each swipe should scroll and snap to center the next/previous list.
   - Verify adjacent lists are partially visible on the left/right edges.
   - Verify snap only occurs after releasing the touch/scroll.
   - Verify vertical scrolling of cards within a list still works.
   - Verify "Add a card", card click-to-edit, card delete, list delete, and "Add a list" all work on mobile.
   - Verify desktop DnD still works at ≥769px width.

## Risks
- **DnD library interference**: `@hello-pangea/dnd` may attach touch listeners even when not rendered. Since we render entirely different markup on mobile, this should be fine.
- **Nested scroll conflicts**: Horizontal snap scroll on the board + vertical scroll in list cards. These are on different axes so browsers handle them well, but worth verifying.
- **SSR/hydration mismatch**: `useIsMobile` defaults to `false` on server; ensure no layout shift or hydration errors. Using a state-based hook (not immediate `window` access) avoids this.
- **Tailwind scroll-snap support**: Tailwind v4 includes `snap-x`, `snap-mandatory`, `snap-center`, etc. If any class is missing, fall back to inline `style`.

## Recommended next step
`b-build` — the scope is well-bounded (~4 files, clear behavior), and the risk is low.
