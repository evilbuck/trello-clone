---
date: 2026-04-26
domains: [bugfix, backend, database]
topics: [card-drag, dnd, move-card, list-id-update]
subject: 2026-04-26.trello-clone-mvp
artifacts: [card.service.ts]
related: [trello-clone-implementation-2026-04-26.md]
priority: high
status: completed
---

# Session: 2026-04-26 - Card Drag Bug Fix

## Bug Description
When dragging cards between lists in the Kanban board, the cards visually stayed in their original list position despite the API call completing successfully. The database wasn't being updated with the new `list_id`.

## Root Cause
In `features/cards/services/card.service.ts`, the `moveCard` function had a bug where:

1. When moving a card to a different list, it correctly created `movedCard` with the new `listId`
2. It added `movedCard` to `allTargetCards` array
3. **BUG**: When updating the database, it only set `position` and `updatedAt`, but NOT `listId`

```typescript
// BEFORE (buggy):
allTargetCards.map((c, index) =>
  db.update(cards).set({ position: index, updatedAt: new Date() })
    .where(eq(cards.id, c.id))
)
```

Since `listId` was never updated in the database, the card remained associated with its original list.

## Fix Applied
Updated the target list position update to also set `listId`:

```typescript
// AFTER (fixed):
allTargetCards.map((c, index) =>
  db.update(cards).set({ position: index, listId: c.listId, updatedAt: new Date() })
    .where(eq(cards.id, c.id))
)
```

## Files Modified
- `features/cards/services/card.service.ts` - Added `listId: c.listId` to the database update

## Optimistic UI Update (2026-04-27)
Added optimistic updates to `useMoveCard` hook so the UI updates immediately when dragging a card, before the server responds.

### Implementation
- `onMutate`: Cancels outgoing refetches, snapshots current state, updates cache optimistically
- `onError`: Rolls back to the snapshot if the mutation fails
- `onSettled`: Invalidates query to ensure server state is synced

### Files Modified
- `hooks/useBoard.ts` - Added optimistic update logic to `useMoveCard`

## Card Hover Styling Fix (2026-04-27)
Fixed card hover state that was invisible in light mode due to same background color as column.

### Problem
- Light mode: Card hover `bg-zinc-100` was same as column `bg-zinc-100`
- Cards became invisible when hovered

### Solution
- Added `border border-transparent` to cards (appears on hover)
- Light mode hover: `bg-zinc-50` + `border-zinc-300`
- Dark mode hover: `bg-zinc-600` + `border-zinc-600`

### Files Modified
- `components/board/Card.tsx` - Updated hover styles

## Verification
- Build passes (`npm run build`)
- Database test confirms the update now correctly changes `list_id`
