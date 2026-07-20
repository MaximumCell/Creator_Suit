import type { ContentStage } from '@/types/database';

/** Ordered list of pipeline stages. */
export const STAGES: readonly ContentStage[] = [
  'idea',
  'final_script',
  'shoot_edit',
  'final',
  'posted',
];

/** Human-friendly label for each stage. */
export const STAGE_LABELS: Record<ContentStage, string> = {
  idea: 'Idea',
  final_script: 'Final Script',
  shoot_edit: 'Shoot & Edit',
  final: 'Final',
  posted: 'Posted',
};

/**
 * Per-stage accent colors. The pipeline reads cool → warm → success, so the
 * color tells you at a glance where in the lifecycle an idea is.
 */
export const STAGE_COLORS: Record<
  ContentStage,
  { /** solid color for the dot, accent bar, etc. */ hex: string; /** tinted bg for icons / chips */ soft: string; /** short tailwind color name (for text classes) */ tone: string }
> = {
  idea: { hex: '#3b82f6', soft: '#dbeafe', tone: 'blue' },
  final_script: { hex: '#7c3aed', soft: '#ede9fe', tone: 'purple' },
  shoot_edit: { hex: '#f59e0b', soft: '#fef3c7', tone: 'amber' },
  final: { hex: '#ec4899', soft: '#fce7f3', tone: 'pink' },
  posted: { hex: '#10b981', soft: '#d1fae5', tone: 'emerald' },
};
