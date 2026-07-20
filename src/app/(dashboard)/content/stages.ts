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
