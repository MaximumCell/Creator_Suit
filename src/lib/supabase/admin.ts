/**
 * Service-role Supabase client. Bypasses RLS — use only in server-side code
 * (Server Actions, Route Handlers) where you've already verified the user is
 * authorized (e.g. by checking their role).
 *
 * Never expose this client to the browser.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

let cached: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
        'Add them to .env.local before using the admin client.',
    );
  }

  cached = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
