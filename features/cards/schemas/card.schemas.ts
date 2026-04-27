import { z } from 'zod';

export const createCardSchema = z.object({
  listId: z.string().uuid('Invalid list ID'),
  title: z.string().min(1, 'Title is required').max(200),
  position: z.number().optional(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).optional(),
  position: z.number().optional(),
  listId: z.string().uuid('Invalid list ID').optional(), // For moving between lists
});

export const moveCardSchema = z.object({
  listId: z.string().uuid('Invalid list ID'),
  position: z.number(),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;
