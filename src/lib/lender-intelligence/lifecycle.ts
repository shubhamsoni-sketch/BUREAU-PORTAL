export const lenderApplicationStages = [
  'case_sent_to_lender',
  'login_pending',
  'draft',
  'submitted',
  'under_review',
  'credit_check',
  'conditional_approval',
  'final_approval',
  'sanctioned',
  'disbursal_initiated',
  'rejected',
  'rerouted',
  'disbursed',
] as const;

export type LenderApplicationStage = (typeof lenderApplicationStages)[number];

const exits = new Set<LenderApplicationStage>(['rejected', 'rerouted']);
const forward: LenderApplicationStage[] = [
  'case_sent_to_lender',
  'login_pending',
  'draft',
  'submitted',
  'under_review',
  'credit_check',
  'conditional_approval',
  'final_approval',
  'sanctioned',
  'disbursal_initiated',
  'disbursed',
];

export function isLenderApplicationStage(value: string): value is LenderApplicationStage {
  return (lenderApplicationStages as readonly string[]).includes(value);
}

export function canTransitionLenderApplication(from: string, to: string) {
  if (!isLenderApplicationStage(from) || !isLenderApplicationStage(to) || from === to) return false;
  if (['rejected', 'rerouted', 'disbursed'].includes(from)) return false;
  if (exits.has(to)) return true;
  const fromIndex = forward.indexOf(from);
  const toIndex = forward.indexOf(to);
  return fromIndex >= 0 && toIndex > fromIndex;
}
