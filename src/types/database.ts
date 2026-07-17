export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface AttendanceLog {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  date: string;
  created_at: string;
}

/** Attendance log joined with user info (for admin view). */
export interface AttendanceLogWithUser extends AttendanceLog {
  user: Pick<User, 'id' | 'full_name'> | null;
}

export interface YoutubeChannel {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_url: string;
  added_by: string;
  created_at: string;
}

export interface YoutubeStatsSnapshot {
  id: string;
  channel_id: string;
  subscriber_count: number;
  view_count: number;
  video_count: number;
  fetched_at: string;
}

export type ContentStage = 'idea' | 'final' | 'shooting' | 'posted';

export interface ContentIdea {
  id: string;
  title: string;
  description: string | null;
  stage: ContentStage;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}
