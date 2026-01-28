import { supabase } from '@/lib/supabase/server';
import { z } from 'zod';

export const AiRunSchema = z.object({
  id: z.string().uuid(),
  input: z.string(),
  output: z.unknown(),
  applied: z.boolean(),
  created_at: z.string().datetime(),
});

export type AiRun = z.infer<typeof AiRunSchema>;

export async function createAiRun(input: {
  input: string;
  output: unknown;
  applied?: boolean;
}): Promise<AiRun> {
  const { data, error } = await supabase
    .from('ai_runs')
    .insert({
      input: input.input,
      output: input.output,
      applied: input.applied ?? false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create AI run: ${error.message}`);
  }

  return AiRunSchema.parse(data);
}

export async function markAiRunAsApplied(id: string): Promise<AiRun> {
  const { data, error } = await supabase
    .from('ai_runs')
    .update({ applied: true })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark AI run as applied: ${error.message}`);
  }

  return AiRunSchema.parse(data);
}
