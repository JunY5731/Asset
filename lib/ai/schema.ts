import { z } from 'zod';

export const PreviewTaskSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  description: z.string().optional(),
});

export const AiSuggestionSchema = z.object({
  title: z.string(),
  reason: z.string(),
});

export const ParseResponseSchema = z.object({
  previewTasks: z.array(PreviewTaskSchema),
  suggestions: z.array(AiSuggestionSchema).optional(),
});

export type PreviewTask = z.infer<typeof PreviewTaskSchema>;
export type AiSuggestion = z.infer<typeof AiSuggestionSchema>;
export type ParseResponse = z.infer<typeof ParseResponseSchema>;
