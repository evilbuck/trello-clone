import { z } from 'zod';

export const createListSchema = z.object({
  boardId: z.string().uuid('Invalid board ID'),
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  position: z.number().optional(),
});

export const updateListSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  position: z.number().optional(),
});

export const reorderListSchema = z.object({
  position: z.number(),
});

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type ReorderListInput = z.infer<typeof reorderListSchema>;
