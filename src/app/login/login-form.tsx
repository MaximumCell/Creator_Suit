'use client';

import { useActionState, use } from 'react';
import { login, type LoginState } from './actions';

const initialState: LoginState = {};

export function LoginForm({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ error?: string; next?: string }>;
}) {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const params = use(searchParamsPromise);
  const error = state.error ?? params.error;

  return (
    <form
      action={formAction}
      className="bg-card border rounded-xl p-6 shadow-sm space-y-4"
    >
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary text-white py-2 text-sm font-medium hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-xs text-muted text-center pt-1">
        New accounts are created by the admin from the Supabase dashboard.
      </p>
    </form>
  );
}
