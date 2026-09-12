import { fieldByCode, type AudienceOperator } from './catalog';

export type AudienceRule = { field: string; operator: AudienceOperator; value: string };
export type AudienceUseCase = {
  id: string;
  name: string;
  industry: string;
  category: string;
  description: string;
  interpretation: string;
  icon: 'home' | 'card' | 'loans' | 'repayment';
  rules: AudienceRule[];
};
export const AUDIENCE_RULE_VERSION = '2026-09-10.1';
// Presets map marketable use cases to the private signal directory.
export const audienceUseCases: AudienceUseCase[] = [
  {
    id: 'mortgage-enquiries',
    name: 'Home buyer intent',
    industry: 'Housing & real estate',
    category: 'Buyer demand',
    icon: 'home',
    description: 'People showing fresh interest in home finance.',
    interpretation:
      'Audience is based on verified intent signals. It should be treated as demand interest, not ownership proof.',
    rules: [{ field: 'CV16', operator: 'gte', value: '1' }],
  },
  {
    id: 'mortgage-balance',
    name: 'Home loan upgrade base',
    industry: 'Housing & real estate',
    category: 'Portfolio movement',
    icon: 'home',
    description: 'Customers who may fit balance transfer or top-up offers.',
    interpretation:
      'Audience is based on recent secured-loan movement. Use for offers, not as a legal property database.',
    rules: [{ field: 'TRV23', operator: 'gte', value: '1' }],
  },
  {
    id: 'card-holders',
    name: 'Card-ready audience',
    industry: 'Banking & payments',
    category: 'Cards',
    icon: 'card',
    description: 'Customers already familiar with card and payment products.',
    interpretation: 'Audience is based on payment-product activity indicators.',
    rules: [{ field: 'BC_TRD', operator: 'gte', value: '1' }],
  },
  {
    id: 'card-utilisation',
    name: 'Limit upgrade opportunity',
    industry: 'Banking & payments',
    category: 'Cards',
    icon: 'card',
    description: 'Card customers who may respond to upgrade or liquidity offers.',
    interpretation: 'Audience is based on historic utilisation behaviour, not a live balance view.',
    rules: [{ field: 'BKC52', operator: 'gte', value: '1' }],
  },
  {
    id: 'unsecured-borrowers',
    name: 'Personal credit audience',
    industry: 'Consumer finance',
    category: 'Loans',
    icon: 'loans',
    description: 'Consumers with signals relevant to personal credit products.',
    interpretation: 'Audience is based on unsecured-credit behaviour indicators.',
    rules: [{ field: 'UL_TRD', operator: 'gte', value: '1' }],
  },
  {
    id: 'vehicle-enquiries',
    name: 'Vehicle buyer intent',
    industry: 'Auto & mobility',
    category: 'Vehicle finance',
    icon: 'loans',
    description: 'People showing interest in two-wheeler or auto finance.',
    interpretation: 'Audience is based on vehicle-finance intent signals, not ownership proof.',
    rules: [{ field: 'CV15', operator: 'gte', value: '1' }],
  },
  {
    id: 'prepayment',
    name: 'Early payer segment',
    industry: 'Lender portfolio growth',
    category: 'Repayment',
    icon: 'repayment',
    description: 'Customers with behaviour suited to premium or top-up offers.',
    interpretation: 'Audience is based on repayment behaviour over a recent reporting window.',
    rules: [{ field: 'PAYMNT01', operator: 'gte', value: '1' }],
  },
  {
    id: 'repayment-record',
    name: 'Reliable repayment base',
    industry: 'Risk & retention',
    category: 'Repayment',
    icon: 'repayment',
    description: 'Customers with steady repayment behaviour for lower-risk outreach.',
    interpretation:
      'Audience is based on consistency indicators. Missing values are not counted as positive signals.',
    rules: [
      { field: 'PAYMNT52', operator: 'gte', value: '1' },
      { field: 'PAYMNT57', operator: 'eq', value: '0' },
    ],
  },
];

export function getAudienceUseCase(id: string | null | undefined) {
  return audienceUseCases.find((item) => item.id === id);
}
export function rulesForUseCase(id: string): AudienceRule[] {
  const useCase = getAudienceUseCase(id);
  if (!useCase) throw new Error('Unknown audience use case.');
  for (const rule of useCase.rules)
    if (!fieldByCode(rule.field)) throw new Error(`Unmapped signal: ${rule.field}`);
  return useCase.rules.map((rule) => ({ ...rule }));
}
