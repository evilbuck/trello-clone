---
status: completed
date: 2026-04-26
subject: 2026-04-26.card-edit-dialog
topics: [trello-clone, kanban, card-edit, modal, react]
research: []
spec:
memory: [trello-clone-implementation-2026-04-26.md]
---

# Plan: Card Edit Dialog

## Goal

Enable users to click on any card and open an edit dialog (modal) to modify the card title, matching Trello's card detail view behavior.

## Context used / assumptions

- **User context**: "lets make the cards editable now. We should be able to click them, they open up just like they do on trello in a dialog."
- **Session context**: Trello clone MVP is functional with drag-and-drop, list creation, card creation/deletion
- **Artifacts used**: None (no existing research/plans for this feature)
- **Assumptions**:
  - Initial implementation focuses on title editing only
  - Reusing existing `Modal` component for consistency
  - Using existing `useUpdateCard` hook from `hooks/useBoard.ts`

## Scope

### In scope
- Click handler on card component to open modal
- Card detail modal with editable title
- Save changes on blur or explicit save action
- Close modal on escape, overlay click, or X button
- Optimistic UI update via React Query

### Out of scope
- Description field (future enhancement)
- Labels/colors (future enhancement)
- Card archiving (future enhancement)
- Card comments (future enhancement)
- Due dates (future enhancement)
- Move card to different list from modal (future enhancement)

## Affected files

### New files
- `components/board/CardModal.tsx` — Card detail/edit modal component

### Modified files
- `components/board/Card.tsx` — Add onClick handler and open state management
- `components/board/Column.tsx` — Pass boardId to Card for update mutations

## Implementation steps

### 1. Create CardModal component

Create `components/board/CardModal.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Card as CardType } from '@/hooks/useBoard';
import { useUpdateCard } from '@/hooks/useBoard';

interface CardModalProps {
  card: CardType | null;
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

export function CardModal({ card, isOpen, onClose, boardId }: CardModalProps) {
  const [title, setTitle] = useState('');
  const updateCard = useUpdateCard();

  // Sync local state with card when modal opens
  useEffect(() => {
    if (card) {
      setTitle(card.title);
    }
  }, [card]);

  const handleSave = async () => {
    if (!card || !title.trim()) return;
    
    try {
      await updateCard.mutateAsync({
        cardId: card.id,
        boardId,
        title: title.trim(),
      });
      onClose();
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Card">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Title
          </label>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            rows={3}
            autoFocus
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateCard.isPending || !title.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {updateCard.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

### 2. Update Card component

Modify `components/board/Card.tsx` to:
- Accept `boardId` and `onEdit` callback from parent (Column)
- Add onClick to open modal
- Show visual indicator of clickability

```tsx
// Add to CardProps interface:
interface CardProps {
  card: CardType;
  index: number;
  onDelete: (cardId: string) => void;
  onEdit: (card: CardType) => void;  // NEW
}

// Add onEdit to destructured props:
export function Card({ card, index, onDelete, onEdit }: CardProps) {

// Add onClick to the draggable div:
<div
  ref={provided.innerRef}
  {...provided.draggableProps}
  {...provided.dragHandleProps}
  onClick={() => onEdit(card)}  // NEW - open modal
  className={`group relative cursor-pointer rounded-md bg-white p-3 shadow-sm ...`}
>
```

### 3. Update Column component

Modify `components/board/Column.tsx` to:
- Add state for selected card and modal visibility
- Pass `onEdit` handler to Card component
- Render CardModal with selected card

```tsx
// Add state:
const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
const [isCardModalOpen, setIsCardModalOpen] = useState(false);

// Add edit handler:
const handleEditCard = (card: CardType) => {
  setSelectedCard(card);
  setIsCardModalOpen(true);
};

// Pass to Card:
<Card
  key={card.id}
  card={card}
  index={cardIndex}
  onDelete={handleDeleteCard}
  onEdit={handleEditCard}  // NEW
/>

// Add CardModal at end of component:
<CardModal
  card={selectedCard}
  isOpen={isCardModalOpen}
  onClose={() => {
    setIsCardModalOpen(false);
    setSelectedCard(null);
  }}
  boardId={list.boardId}
/>
```

## Verification

- [ ] Clicking a card opens the modal
- [ ] Modal shows current card title
- [ ] Editing title and clicking Save updates the card
- [ ] Modal closes after save
- [ ] Pressing Escape closes modal
- [ ] Clicking overlay closes modal
- [ ] Board data refreshes via SSE after save
- [ ] Error handling works (console shows error, modal stays open)

## Risks

- **Minimal**: Using existing Modal + useUpdateCard pattern, low-risk changes
- **Note**: Need to stop propagation on delete button to prevent modal from opening on delete click (already implemented with `e.stopPropagation()`)

## Implementation order

1. Create `CardModal.tsx`
2. Update `Card.tsx` with onClick and onEdit props
3. Update `Column.tsx` with modal state and render
4. Test in browser
