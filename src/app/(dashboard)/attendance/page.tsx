import { createClient } from '@/lib/supabase/server';
import { ClockWidget } from '@/components/clock-widget';
import { AdminTeamView } from './admin-team-view';
import { PersonalLog } from './personal-log';
import type { AttendanceLog, User } from '@/types/database';
import { toDateInputValue } from '@/lib/time';

interface SearchParams {
  from?: string;
  to?: string;
  range?: string;
}

const RECENT_LOG_DAYS = 30;
const ADMIN_DEFAULT_RANGE_DAYS = 7;

function parseDate(s: string | undefined, fallback: Date): Date {
  if (!s) return fallback;
  const d = new Date(s + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null; // middleware handles this, but keep TS happy

  // --- Profile + role ----------------------------------------------------
  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, role, avatar_url, created_at')
    .eq('id', authUser.id)
    .single<User>();

  const isAdmin = profile?.role === 'admin';
  const displayName = profile?.full_name || authUser.email || 'You';

  // --- Open clock-in for the current user --------------------------------
  const { data: openLog } = await supabase
    .from('attendance_logs')
    .select('id, clock_in')
    .eq('user_id', authUser.id)
    .is('clock_out', null)
    .maybeSingle<{ id: string; clock_in: string }>();

  // --- Personal log: last RECENT_LOG_DAYS days ---------------------------
  const since = new Date();
  since.setDate(since.getDate() - RECENT_LOG_DAYS);
  const sinceIso = since.toISOString();

  const { data: personalLogs } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', authUser.id)
    .gte('created_at', sinceIso)
    .order('clock_in', { ascending: false })
    .returns<AttendanceLog[]>();

  // --- Admin: team view --------------------------------------------------
  let teamData: {
    users: User[];
    from: string;
    to: string;
  } | null = null;

  if (isAdmin) {
    const sp = await searchParams;
    const range = sp.range ?? 'last7';

    const today = new Date();
    let fromDate: Date;
    let toDate: Date = today;

    if (range === 'thismonth') {
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      toDate = today;
    } else if (range === 'last30') {
      fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 30);
    } else if (range === 'custom') {
      fromDate = parseDate(sp.from, new Date(today.getTime() - 7 * 86400_000));
      toDate = parseDate(sp.to, today);
    } else {
      // 'last7' (default)
      fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - ADMIN_DEFAULT_RANGE_DAYS);
      toDate = today;
    }

    // Pull all users (for the team list) and the logs in the range.
    const [{ data: allUsers }, { data: teamLogs }] = await Promise.all([
      supabase
        .from('users')
        .select('id, full_name, role, avatar_url, created_at')
        .order('full_name')
        .returns<User[]>(),
      supabase
        .from('attendance_logs')
        .select('*')
        .gte('date', toDateInputValue(fromDate))
        .lte('date', toDateInputValue(toDate))
        .order('clock_in', { ascending: false })
        .returns<AttendanceLog[]>(),
    ]);

    teamData = {
      users: allUsers ?? [],
      from: toDateInputValue(fromDate),
      to: toDateInputValue(toDate),
    };

    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted mt-1">
            Hi {displayName} — clock in and out, and review team hours.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ClockWidget isAdmin={isAdmin} openLog={openLog} />
          </div>
          <div className="lg:col-span-2">
            <PersonalLog logs={personalLogs ?? []} />
          </div>
        </div>

        <AdminTeamView
          users={teamData.users}
          logs={teamLogs ?? []}
          from={teamData.from}
          to={teamData.to}
          range={range}
        />
      </div>
    );
  }

  // --- Member view -------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <p className="text-sm text-muted mt-1">
          Hi {displayName} — clock in and out, and view your hours.
        </p>
      </header>

      <ClockWidget isAdmin={isAdmin} openLog={openLog} />
      <PersonalLog logs={personalLogs ?? []} />
    </div>
  );
}
