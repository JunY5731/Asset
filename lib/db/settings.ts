import { supabase } from '@/lib/supabase/server';
import { z } from 'zod';

export const PlannerTokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_at: z.number().optional(),
  scope: z.string().optional(),
});

export type PlannerToken = z.infer<typeof PlannerTokenSchema>;

export const SettingsSchema = z.object({
  id: z.number(),
  planner_connected: z.boolean(),
  planner_last_sync: z.string().datetime().nullable(),
  planner_token: PlannerTokenSchema.nullable(),
  updated_at: z.string().datetime(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    throw new Error(`Failed to fetch settings: ${error.message}`);
  }

  return SettingsSchema.parse(data);
}

export async function updateSettings(input: {
  planner_connected?: boolean;
  planner_last_sync?: string | null;
  planner_token?: PlannerToken | null;
}) {
  const { data, error } = await supabase
    .from('settings')
    .update(input)
    .eq('id', 1)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`);
  }

  return SettingsSchema.parse(data);
}
