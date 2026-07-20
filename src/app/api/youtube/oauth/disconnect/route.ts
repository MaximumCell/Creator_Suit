/**
 * POST /api/youtube/oauth/disconnect
 *
 * Deletes the current user's stored OAuth tokens, so the next page load
 * prompts them to connect again.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('youtube_oauth_tokens')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/youtube');
  revalidatePath('/youtube/analytics');
  return NextResponse.json({ ok: true });
}
