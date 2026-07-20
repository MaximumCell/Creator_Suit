/**
 * Hand-written Database type for the Supabase clients. We don't run the
 * Supabase CLI codegen, so we maintain this manually. Keep it in sync with
 * supabase/migrations/*.sql.
 */

export type UserRole = 'admin' | 'member';
export type ContentStage =
  | 'idea'
  | 'final_script'
  | 'shoot_edit'
  | 'final'
  | 'posted';

export interface UserRow {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface AttendanceLogRow {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  date: string;
  created_at: string;
}

export interface YoutubeChannelRow {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_url: string;
  added_by: string;
  thumbnail_url: string | null;
  created_at: string;
}

export interface YoutubeStatsSnapshotRow {
  id: string;
  channel_id: string;
  subscriber_count: number;
  view_count: number;
  video_count: number;
  fetched_at: string;
}

export interface ContentIdeaRow {
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

/** Loose insert types — we cast to these where supabase-js generics get strict. */
export type UserInsert = Partial<UserRow> & { id: string };
export type AttendanceLogInsert = Partial<AttendanceLogRow> & {
  user_id: string;
  clock_in: string;
};
export type YoutubeChannelInsert = Omit<YoutubeChannelRow, 'id' | 'created_at'>;
export type YoutubeStatsSnapshotInsert = Omit<YoutubeStatsSnapshotRow, 'id' | 'fetched_at'>;
export type ContentIdeaInsert = Omit<ContentIdeaRow, 'id' | 'created_at' | 'updated_at'> & {
  created_by: string;
  title: string;
};

export type UserUpdate = Partial<Omit<UserRow, 'id' | 'created_at'>>;

export type Database = {
  public: {
    Tables: {
      users: {
        Row: Record<string, unknown> & UserRow;
        Insert: Record<string, unknown> & UserInsert;
        Update: Record<string, unknown> & UserUpdate;
        Relationships: never[];
      };
      attendance_logs: {
        Row: Record<string, unknown> & AttendanceLogRow;
        Insert: Record<string, unknown> & AttendanceLogInsert;
        Update: Record<string, unknown> & Partial<AttendanceLogRow>;
        Relationships: never[];
      };
      youtube_channels: {
        Row: Record<string, unknown> & YoutubeChannelRow;
        Insert: Record<string, unknown> & YoutubeChannelInsert;
        Update: Record<string, unknown> & Partial<YoutubeChannelRow>;
        Relationships: never[];
      };
      youtube_stats_snapshots: {
        Row: Record<string, unknown> & YoutubeStatsSnapshotRow;
        Insert: Record<string, unknown> & YoutubeStatsSnapshotInsert;
        Update: Record<string, unknown> & Partial<YoutubeStatsSnapshotRow>;
        Relationships: never[];
      };
      content_ideas: {
        Row: Record<string, unknown> & ContentIdeaRow;
        Insert: Record<string, unknown> & ContentIdeaInsert;
        Update: Record<string, unknown> & Partial<ContentIdeaRow>;
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Re-export the app-facing types for convenience.
export type User = UserRow;
export type AttendanceLog = AttendanceLogRow;
export type YoutubeChannel = YoutubeChannelRow;
export type YoutubeStatsSnapshot = YoutubeStatsSnapshotRow;
export type ContentIdea = ContentIdeaRow;
export interface AttendanceLogWithUser extends AttendanceLogRow {
  user: Pick<UserRow, 'id' | 'full_name'> | null;
}
