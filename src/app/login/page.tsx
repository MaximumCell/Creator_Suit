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
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold tracking-tight mb-4">
            CS
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">CreatorSuit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aaghaz AI internal tool
          </p>
        </div>
        <LoginForm searchParamsPromise={searchParams} />
      </div>
    </main>
  );
}
