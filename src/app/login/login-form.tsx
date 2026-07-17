'use client';

import { useActionState, use, useState, type Dispatch, type SetStateAction } from 'react';
import { login, signUp, type LoginState } from './actions';
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon, UserIcon, CheckIcon } from '@/components/icons';

const initialState: LoginState = {};

type Mode = 'signin' | 'signup';
type SetBool = Dispatch<SetStateAction<boolean>>;

const inputClass =
  'w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20';

export function LoginForm({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ error?: string; next?: string }>;
}) {
  const params = use(searchParamsPromise);
  const [mode, setMode] = useState<Mode>('signin');
  const [showPassword, setShowPassword] = useState(false);

  return mode === 'signin' ? (
    <SignInForm
      searchParamsError={params.error}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      onSwitch={() => setMode('signup')}
    />
  ) : (
    <SignUpForm
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      onSwitch={() => setMode('signin')}
    />
  );
}

function SignInForm({
  searchParamsError,
  showPassword,
  setShowPassword,
  onSwitch,
}: {
  searchParamsError?: string;
  showPassword: boolean;
  setShowPassword: SetBool;
  onSwitch: () => void;
}) {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const error = state.error ?? searchParamsError;

  return (
    <Card>
      <ModeTabs mode="signin" onSwitch={onSwitch} />

      <form action={formAction} className="space-y-4">
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          icon={<MailIcon className="w-4 h-4" />}
        />

        <PasswordField
          id="password"
          autoComplete="current-password"
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />

        {error ? <ErrorBox>{error}</ErrorBox> : null}

        <SubmitButton pending={isPending}>Sign in</SubmitButton>
      </form>
    </Card>
  );
}

function SignUpForm({
  showPassword,
  setShowPassword,
  onSwitch,
}: {
  showPassword: boolean;
  setShowPassword: SetBool;
  onSwitch: () => void;
}) {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  if (state.checkEmail) {
    return (
      <Card>
        <ModeTabs mode="signup" onSwitch={onSwitch} />
        <div className="text-center py-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-success-soft text-success flex items-center justify-center mb-3">
            <CheckIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            We sent a confirmation link. Click it to activate your account,
            then come back here to sign in.
          </p>
          <button
            type="button"
            onClick={onSwitch}
            className="mt-5 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <ModeTabs mode="signup" onSwitch={onSwitch} />

      <form action={formAction} className="space-y-4">
        <Field
          id="full_name"
          name="full_name"
          label="Full name"
          autoComplete="name"
          autoFocus
          icon={<UserIcon className="w-4 h-4" />}
        />
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          icon={<MailIcon className="w-4 h-4" />}
        />

        <PasswordField
          id="password"
          autoComplete="new-password"
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />

        {state.error ? <ErrorBox>{state.error}</ErrorBox> : null}

        <SubmitButton pending={isPending}>Create account</SubmitButton>

        <p className="text-xs text-muted-foreground text-center pt-1 leading-relaxed">
          New accounts join as <strong className="text-foreground font-medium">member</strong>.
          The admin can promote you to admin in the database.
        </p>
      </form>
    </Card>
  );
}

// --- Shared building blocks -------------------------------------------------

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm">{children}</div>
  );
}

function ModeTabs({ mode, onSwitch }: { mode: Mode; onSwitch: () => void }) {
  return (
    <div role="tablist" className="flex gap-1 border-b mb-6 -mx-6 px-6">
      <TabButton
        active={mode === 'signin'}
        onClick={() => mode !== 'signin' && onSwitch()}
      >
        Sign in
      </TabButton>
      <TabButton
        active={mode === 'signup'}
        onClick={() => mode !== 'signup' && onSwitch()}
      >
        Sign up
      </TabButton>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative px-3 pb-3 -mb-px text-sm font-medium transition-colors ${
        active
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      <span
        aria-hidden="true"
        className={`absolute left-0 right-0 -bottom-px h-0.5 rounded-full transition-colors ${
          active ? 'bg-foreground' : 'bg-transparent'
        }`}
      />
    </button>
  );
}

function Field({
  id,
  name,
  label,
  type = 'text',
  autoComplete,
  autoFocus,
  icon,
}: {
  id: string;
  name?: string;
  label: string;
  type?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          name={name ?? id}
          type={type}
          required
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={`${inputClass} ${icon ? 'pl-9' : ''}`}
        />
      </div>
    </div>
  );
}

function PasswordField({
  id,
  autoComplete,
  showPassword,
  setShowPassword,
}: {
  id: string;
  autoComplete?: string;
  showPassword: boolean;
  setShowPassword: SetBool;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        Password
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <LockIcon className="w-4 h-4" />
        </span>
        <input
          id={id}
          name="password"
          type={showPassword ? 'text' : 'password'}
          required
          minLength={6}
          autoComplete={autoComplete}
          className={`${inputClass} pl-9 pr-11`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          title={showPassword ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground hover:text-foreground rounded-r-md focus:outline-none focus-visible:text-foreground transition-colors"
        >
          {showPassword ? (
            <EyeOffIcon className="w-[18px] h-[18px]" />
          ) : (
            <EyeIcon className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>
    </div>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-md px-3 py-2"
    >
      {children}
    </p>
  );
}

function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground h-10 text-sm font-medium hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? <Spinner /> : null}
      <span>{pending ? 'Working…' : children}</span>
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="4"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
      />
    </svg>
  );
}
