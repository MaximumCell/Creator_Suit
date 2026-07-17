'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export interface LoginState {
  error?: string;
  /** When signup succeeds with email-confirm off, redirect straight to app. */
  signedIn?: boolean;
  /** When signup succeeds with email-confirm on, tell the user to check inbox. */
  checkEmail?: boolean;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect('/attendance');
}

export async function signUp(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('full_name') ?? '').trim();

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }
  if (!fullName) {
    return { error: 'Please enter your name so the team knows who you are.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // The DB trigger picks up raw_user_meta_data->>'full_name' to populate
      // public.users.full_name when the auth user is created.
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If Supabase has email confirmation OFF, signUp also signs the user in and
  // returns a session. Send them to the app.
  if (data.session) {
    redirect('/attendance');
  }

  // Otherwise, they need to click the confirmation link first.
  return { checkEmail: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
