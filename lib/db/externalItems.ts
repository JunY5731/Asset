import { supabase } from '@/lib/supabase/server';
import { z } from 'zod';

export const ExternalItemSchema = z.object({
  id: z.string().uuid(),
  provider: z.string(),
  external_id: z.string(),
  title: z.string().nullable(),
  raw_snapshot: z.unknown().nullable(),
  last_synced_at: z.string().datetime(),
});

export type ExternalItem = z.infer<typeof ExternalItemSchema>;

export async function getExternalItems(provider?: string) {
  let query = supabase.from('external_items').select('*').order('last_synced_at', { ascending: false });

  if (provider) {
    query = query.eq('provider', provider);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch external items: ${error.message}`);
  }

  return z.array(ExternalItemSchema).parse(data);
}

export async function upsertExternalItem(input: {
  provider: string;
  external_id: string;
  title?: string | null;
  raw_snapshot?: unknown;
}) {
  const { data, error } = await supabase
    .from('external_items')
    .upsert(
      {
        ...input,
        last_synced_at: new Date().toISOString(),
      },
      {
        onConflict: 'external_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert external item: ${error.message}`);
  }

  return ExternalItemSchema.parse(data);
}
