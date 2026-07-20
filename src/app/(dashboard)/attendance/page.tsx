import { createClient } from '@/lib/supabase/server';
import { ClockWidget } from '@/components/clock-widget';
import { AdminTeamView } from './admin-team-view';
import { PersonalLog } from './personal-log';
import type { AttendanceLog, User } from '@/types/database';
import { toDateInputValue } from '@/lib/time';
import { autoCloseStaleSession, getTodayUtc, type AutoCloseResult } from '@/lib/attendance';
import { ClockIcon } from '@/components/icons';

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

  // --- Auto-close any stale open session from a previous day ------------
  // The user forgot to clock out — close it at 23:59:59 of that day so
  // they can start fresh today. Returns info for the widget banner.
  const autoClosed: AutoCloseResult | null = await autoCloseStaleSession(
    supabase,
    authUser.id,
  );

  // --- Today's log (open OR already-closed) for the current user -------
  // The DB trigger stamps date from (clock_in at time zone 'UTC')::date,
  // so we filter on the same UTC date here.
  const todayUtc = getTodayUtc();
  const { data: todayLog } = await supabase
    .from('attendance_logs')
    .select('id, clock_in, clock_out, duration_minutes')
    .eq('user_id', authUser.id)
    .eq('date', todayUtc)
    .maybeSingle<{
      id: string;
      clock_in: string;
      clock_out: string | null;
      duration_minutes: number | null;
    }>();

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
        <PageHeader displayName={displayName} isAdmin />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ClockWidget
              isAdmin={isAdmin}
              todayLog={todayLog}
              autoClosed={autoClosed}
            />
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
      <PageHeader displayName={displayName} isAdmin={false} />

      <ClockWidget
        isAdmin={isAdmin}
        todayLog={todayLog}
        autoClosed={autoClosed}
      />
      <PersonalLog logs={personalLogs ?? []} />
    </div>
  );
}

function PageHeader({
  displayName,
  isAdmin,
}: {
  displayName: string;
  isAdmin: boolean;
}) {
  return (
    <header className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-subtle flex items-center justify-center text-foreground">
        <ClockIcon className="w-5 h-5" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Hi {displayName} —{' '}
          {isAdmin
            ? 'clock in and out, and review team hours.'
            : 'clock in and out, and view your hours.'}
        </p>
      </div>
    </header>
  );
}
