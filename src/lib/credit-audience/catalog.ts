export type AudienceOperator = 'gte' | 'lte' | 'eq' | 'neq' | 'is_null' | 'not_null';

export type AudienceField = {
  code: string;
  column: string;
  description: string;
  category: string;
};

type DirectoryEntry = Pick<AudienceField, 'code' | 'description'>;

const directory: DirectoryEntry[] = [
  {
    code: 'TRV07',
    description:
      'Number of non-home finance balance decreases from the prior month to the current month',
  },
  {
    code: 'TRV09',
    description: 'Number of non-home finance balance decreases over the last 12 months',
  },
  { code: 'BALMAG01', description: 'Non-home finance balance magnitude' },
  { code: 'PAYMNT09', description: 'Card ratio of actual to minimum payment over the last month' },
  { code: 'AGGS907', description: 'Annual spend of the top-of-wallet card' },
  { code: 'PAYMNT03', description: 'Total amount prepaid on instalments last month' },
  {
    code: 'WALSHR06',
    description: 'Number of wallet-share shifts above 50% in the past 12 months',
  },
  { code: 'PAYMNT02', description: 'Number of instalment events prepaid in the last 12 months' },
  {
    code: 'TRV08',
    description: 'Number of non-home finance balance decreases over the past quarter',
  },
  { code: 'WALSHR08', description: 'Maximum wallet-share shift in 12 months' },
  {
    code: 'CV27',
    description: 'Percent of card accounts switching from inactive to active in the past 12 months',
  },
  {
    code: 'TRV05',
    description: 'Number of non-home finance balance increases over the last 12 months',
  },
  { code: 'PAYMNT04', description: 'Total amount prepaid on instalments in the last 3 months' },
  {
    code: 'AGG901',
    description: 'Number of non-home finance aggregate balance increases over the last quarter',
  },
  {
    code: 'CV28',
    description: 'Percent of card accounts switching from active to inactive in the past 12 months',
  },
  {
    code: 'AGG902',
    description: 'Number of non-home finance aggregate balance decreases over the last quarter',
  },
  { code: 'AGG911', description: 'Maximum aggregate card utilization over the last 12 months' },
  {
    code: 'TRV10',
    description:
      'Number of months with a non-home finance balance decrease over the last 12 months',
  },
  { code: 'RVLR01', description: 'Revolver card utilization' },
  { code: 'AGG908', description: 'Maximum aggregate card balance over the last 12 months' },
  { code: 'CV13', description: 'Percentage of accounts ever delinquent' },
  { code: 'BCPMTSTR', description: 'Consumer card payment behaviour category' },
  { code: 'PAYMNT01', description: 'Number of instalment events prepaid in the last 3 months' },
  { code: 'RVLR10', description: 'Number of revolver cards on newly opened cards' },
  { code: 'TRV23', description: 'Number of home finance balance decreases over the last 6 months' },
  { code: 'BKC53', description: 'Number of cards utilized above 75% in the past 12 months' },
  {
    code: 'ALL234',
    description: 'Aggregate excess payment for all accounts over the past 12 months',
  },
  {
    code: 'PAYMNT57',
    description: 'Number of missed payments in the last 6 months for financial trades',
  },
  {
    code: 'ALL235',
    description: 'Aggregate excess payment for all accounts over the past 24 months',
  },
  {
    code: 'PAYMNT53',
    description: 'Number of required payments in the last 12 months for financial trades',
  },
  { code: 'BKC51', description: 'Number of cards utilized above 25% in the past 12 months' },
  {
    code: 'BKC234',
    description: 'Aggregate excess payment for card accounts over the past 12 months',
  },
  { code: 'BKC82', description: 'Months since a card account last exceeded 50% utilization' },
  {
    code: 'PAYMNT63',
    description: 'Missed-payment ratio in the last 12 months for financial trades',
  },
  { code: 'BKC84', description: 'Months since a card account last exceeded 90% utilization' },
  { code: 'BKC54', description: 'Number of cards utilized above 90% in the past 12 months' },
  {
    code: 'PAYMNT62',
    description: 'Missed-payment ratio in the last 6 months for financial trades',
  },
  { code: 'BKC81', description: 'Months since a card account last exceeded 25% utilization' },
  {
    code: 'WALSHR03',
    description: 'Number of wallet-share shifts above 25% in the past 12 months',
  },
  { code: 'AGGS910', description: 'Current high credit of the top-of-wallet card' },
  { code: 'NON_MT_TRD', description: 'Number of non-home finance trades' },
  {
    code: 'AGG909',
    description: 'Months since maximum aggregate card balance over the last 12 months',
  },
  {
    code: 'PAYMNT58',
    description: 'Number of missed payments in the last 12 months for financial trades',
  },
  { code: 'BC_TRD', description: 'Number of card trades' },
  { code: 'CV12', description: 'Number of accounts ever 90 or more days past due' },
  { code: 'AGGS911', description: 'Current utilization of the top-of-wallet card' },
  { code: 'PAYMNT05', description: 'Total amount prepaid on instalments in the last 12 months' },
  { code: 'INST_TRD', description: 'Number of instalment trades' },
  {
    code: 'WALSRES01',
    description:
      'Spend on first revolving trade relative to total revolving spend over the past month',
  },
  {
    code: 'CV18',
    description:
      'Accounts previously 60 days past due, now current, verified in the past 12 months',
  },
  { code: 'AGGS908', description: 'Age of the top-of-wallet card' },
  { code: 'CV11', description: 'Number of accounts ever 60 or more days past due' },
  { code: 'AGGS909', description: 'Current balance of the top-of-wallet card' },
  { code: 'TRD', description: 'Number of trades' },
  { code: 'CV10', description: 'Number of accounts ever 30 or more days past due' },
  {
    code: 'TRV03',
    description:
      'Number of non-home finance balance increases from the prior month to the current month',
  },
  {
    code: 'CV17',
    description:
      'Accounts previously 30 days past due, now current, verified in the past 12 months',
  },
  { code: 'RVLR03', description: 'Total revolver card balance' },
  { code: 'RVLR05', description: 'Ratio of revolver card to total card balance' },
  { code: 'UL_TRD', description: 'Number of unsecured loan trades' },
  { code: 'BALMAG03', description: 'Cards balance magnitude' },
  {
    code: 'TRV04',
    description: 'Number of non-home finance balance increases over the past quarter',
  },
  {
    code: 'PAYMNT52',
    description: 'Number of required payments in the last 6 months for financial trades',
  },
  { code: 'AGG906', description: 'Average aggregate card utilization over the last 12 months' },
  { code: 'BKC83', description: 'Months since a card account last exceeded 75% utilization' },
  {
    code: 'BKC235',
    description: 'Aggregate excess payment for card accounts over the past 24 months',
  },
  { code: 'BKC52', description: 'Number of cards utilized above 50% in the past 12 months' },
  {
    code: 'TRV06',
    description:
      'Number of months with a non-home finance balance increase over the last 12 months',
  },
  { code: 'CV14', description: 'Number of deduplicated inquiries' },
  { code: 'CV15', description: 'Number of deduplicated auto inquiries' },
  { code: 'CV16', description: 'Number of deduplicated home finance inquiries' },
];

function categoryFor(code: string) {
  if (code.startsWith('PAYMNT')) return 'Repayment behaviour';
  if (code.startsWith('CV')) return 'Credit performance';
  if (code.startsWith('TRV')) return 'Balance movement';
  if (code.startsWith('BKC') || code.startsWith('RVLR') || code.startsWith('AGG'))
    return 'Card utilization';
  if (code.startsWith('WALS')) return 'Wallet share';
  return 'Credit portfolio';
}

const portfolioFields: AudienceField[] = [
  {
    code: 'SCORE',
    column: 'score_value_numeric',
    description: 'Score band value',
    category: 'Score',
  },
  {
    code: 'SECURED_ACCOUNTS',
    column: 'secured_accounts_count',
    description: 'Number of secured accounts',
    category: 'Credit portfolio',
  },
  {
    code: 'UNSECURED_ACCOUNTS',
    column: 'unsecured_accounts_count',
    description: 'Number of unsecured accounts',
    category: 'Credit portfolio',
  },
  {
    code: 'SECURED_HIGH_CREDIT',
    column: 'secured_high_credit_sum',
    description: 'Total secured high credit',
    category: 'Credit portfolio',
  },
  {
    code: 'UNSECURED_HIGH_CREDIT',
    column: 'unsecured_high_credit_sum',
    description: 'Total unsecured high credit',
    category: 'Credit portfolio',
  },
  {
    code: 'SECURED_OVERDUE',
    column: 'secured_amount_overdue_sum',
    description: 'Total secured amount overdue',
    category: 'Credit portfolio',
  },
  {
    code: 'UNSECURED_OVERDUE',
    column: 'unsecured_amount_overdue_sum',
    description: 'Total unsecured amount overdue',
    category: 'Credit portfolio',
  },
  {
    code: 'SECURED_BALANCE',
    column: 'secured_balances_sum',
    description: 'Total secured balance',
    category: 'Credit portfolio',
  },
  {
    code: 'UNSECURED_BALANCE',
    column: 'unsecured_balances_sum',
    description: 'Total unsecured balance',
    category: 'Credit portfolio',
  },
  {
    code: 'OWN_ACCOUNTS',
    column: 'own_accounts_count',
    description: 'Number of own accounts',
    category: 'Credit portfolio',
  },
  {
    code: 'OTHER_ACCOUNTS',
    column: 'other_accounts_count',
    description: 'Number of other accounts',
    category: 'Credit portfolio',
  },
];

export const audienceFields: AudienceField[] = [
  ...portfolioFields,
  ...directory.map((entry) => ({
    ...entry,
    column: entry.code.toLowerCase(),
    category: categoryFor(entry.code),
  })),
];

export const audienceOperators: Array<{
  value: AudienceOperator;
  label: string;
  needsValue: boolean;
}> = [
  { value: 'gte', label: 'is at least', needsValue: true },
  { value: 'lte', label: 'is at most', needsValue: true },
  { value: 'eq', label: 'equals', needsValue: true },
  { value: 'neq', label: 'does not equal', needsValue: true },
  { value: 'is_null', label: 'is missing', needsValue: false },
  { value: 'not_null', label: 'is available', needsValue: false },
];

export function fieldByCode(code: string) {
  return audienceFields.find((field) => field.code === code);
}
