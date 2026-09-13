import type { PolicyOperator } from './engine';

export const policyFields = [
  { key: 'score', label: 'Bureau score', kind: 'number' },
  { key: 'loanAmount', label: 'Requested loan amount', kind: 'number' },
  { key: 'monthlyIncome', label: 'Monthly income', kind: 'number' },
  { key: 'tenure', label: 'Requested tenure (months)', kind: 'number' },
  { key: 'foir', label: 'FOIR percentage', kind: 'number' },
  { key: 'maxLoanAmount', label: 'Calculated maximum loan', kind: 'number' },
  { key: 'loanType', label: 'Loan product', kind: 'string' },
  { key: 'state', label: 'Applicant state', kind: 'string' },
  { key: 'city', label: 'Applicant city', kind: 'string' },
  { key: 'employmentType', label: 'Employment type', kind: 'string' },
  { key: 'channel', label: 'Origination channel', kind: 'string' },
] as const;

export type PolicyFieldKey = (typeof policyFields)[number]['key'];

const presenceOperators: PolicyOperator[] = ['exists', 'not_exists'];
const numberOperators: PolicyOperator[] = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'between',
  'in',
  'not_in',
  ...presenceOperators,
];
const stringOperators: PolicyOperator[] = ['eq', 'neq', 'in', 'not_in', ...presenceOperators];

export function operatorsForPolicyField(fieldKey: string): PolicyOperator[] {
  const field = policyFields.find((item) => item.key === fieldKey);
  return field?.kind === 'number'
    ? numberOperators
    : field?.kind === 'string'
      ? stringOperators
      : [];
}

export type PolicyRuleInput = {
  fieldKey: string;
  operator: string;
  comparisonValue: unknown;
  severity?: string;
  reasonCode?: string;
  reasonText?: string;
  weight?: unknown;
};

export function validatePolicyRule(rule: PolicyRuleInput) {
  const errors: string[] = [];
  const field = policyFields.find((item) => item.key === rule.fieldKey);
  if (!field) return [`Unknown policy field: ${rule.fieldKey || '(blank)'}`];
  if (!operatorsForPolicyField(field.key).includes(rule.operator as PolicyOperator))
    errors.push(`${rule.operator || '(blank)'} is not valid for ${field.label}`);
  if (!['hard', 'soft', 'warning'].includes(rule.severity || 'hard'))
    errors.push('Invalid rule severity');
  if (!rule.reasonCode?.trim() || !/^[A-Za-z0-9_]{2,50}$/.test(rule.reasonCode.trim()))
    errors.push('Reason code must contain 2-50 letters, numbers, or underscores');
  if (!rule.reasonText?.trim() || rule.reasonText.trim().length < 5)
    errors.push('Reason text must contain at least 5 characters');
  const weight = Number(rule.weight || 0);
  if (!Number.isFinite(weight) || weight < 0 || weight > 100)
    errors.push('Rule weight must be between 0 and 100');
  if (!presenceOperators.includes(rule.operator as PolicyOperator)) {
    const values = Array.isArray(rule.comparisonValue)
      ? rule.comparisonValue
      : [rule.comparisonValue];
    if (rule.operator === 'between' && values.length !== 2)
      errors.push('Between requires exactly two values');
    if (['in', 'not_in'].includes(rule.operator) && values.length < 1)
      errors.push('List operator requires at least one value');
    if (
      field.kind === 'number' &&
      values.some((value) => value === '' || value === null || !Number.isFinite(Number(value)))
    )
      errors.push(`${field.label} comparisons must be numeric`);
    if (
      field.kind === 'string' &&
      values.some((value) => typeof value !== 'string' || !value.trim())
    )
      errors.push(`${field.label} comparisons must be non-empty text`);
  }
  return errors;
}
