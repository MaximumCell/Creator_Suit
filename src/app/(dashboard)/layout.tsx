import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/sidebar';
import type { User } from '@/types/database';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, role, avatar_url, created_at')
    .eq('id', authUser.id)
    .single<User>();

  const user =
    profile ?? {
      id: authUser.id,
      full_name: authUser.email ?? 'Unknown',
      role: 'member',
      avatar_url: null,
      created_at: new Date().toISOString(),
    };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar user={user} email={authUser.email} />
      <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
