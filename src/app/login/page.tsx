import { LoginForm } from './login-form';

export const metadata = {
  title: 'Sign in · CreatorSuit',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">CreatorSuit</h1>
          <p className="text-sm text-muted mt-1">Aaghaz AI internal tool</p>
        </div>
        <LoginForm searchParamsPromise={searchParams} />
      </div>
    </main>
  );
}
