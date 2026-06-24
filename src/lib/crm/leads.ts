export type CrmLeadStage =
  | 'new'
  | 'contacted'
  | 'eligibility_pending'
  | 'eligibility_done'
  | 'submitted_to_lender'
  | 'sanctioned'
  | 'rejected'
  | 'disbursed'
  | 'lost';

export type CrmLead = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  product: string;
  loanAmount: number;
  source: string;
  stage: CrmLeadStage;
  assignedAgent: string;
  lastContact: string;
  nextFollowUp: string;
  daysInStage: number;
  city: string;
  notes: string;
  eligibilityReportId?: string;
  selectedLender?: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmApplication = {
  id: string;
  leadId: string;
  customerName: string;
  mobile: string;
  lenderName: string;
  product: string;
  loanAmount: number;
  status:
    | 'case_sent_to_lender'
    | 'login_pending'
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'credit_check'
    | 'conditional_approval'
    | 'final_approval'
    | 'disbursal_initiated'
    | 'sanctioned'
    | 'rejected'
    | 'disbursed';
  createdAt: string;
};

export const defaultCrmLeads: CrmLead[] = [
  {
    id: 'lead-001',
    name: 'Ramesh Gupta',
    mobile: '9876543210',
    email: 'ramesh.g@gmail.com',
    product: 'home_loan',
    loanAmount: 4200000,
    source: 'reference',
    stage: 'eligibility_pending',
    assignedAgent: 'Priya Sharma',
    lastContact: '20 Jun 2026',
    nextFollowUp: '23 Jun 2026',
    daysInStage: 3,
    city: 'Mumbai',
    notes: '',
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-06-20T00:00:00.000Z',
  },
  {
    id: 'lead-002',
    name: 'Neha Kulkarni',
    mobile: '9765432109',
    email: 'neha.k@yahoo.com',
    product: 'personal_loan',
    loanAmount: 850000,
    source: 'web',
    stage: 'eligibility_pending',
    assignedAgent: 'Anil Mehta',
    lastContact: '21 Jun 2026',
    nextFollowUp: '22 Jun 2026',
    daysInStage: 1,
    city: 'Pune',
    notes: '',
    createdAt: '2026-06-21T00:00:00.000Z',
    updatedAt: '2026-06-21T00:00:00.000Z',
  },
  {
    id: 'lead-003',
    name: 'Suresh Patel',
    mobile: '9654321098',
    email: 'suresh.p@gmail.com',
    product: 'business_loan',
    loanAmount: 2500000,
    source: 'walk_in',
    stage: 'new',
    assignedAgent: 'Priya Sharma',
    lastContact: '18 Jun 2026',
    nextFollowUp: '22 Jun 2026',
    daysInStage: 4,
    city: 'Ahmedabad',
    notes: '',
    createdAt: '2026-06-18T00:00:00.000Z',
    updatedAt: '2026-06-18T00:00:00.000Z',
  },
];

function text(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

export function normalizeLeads(value: unknown): CrmLead[] {
  if (!Array.isArray(value)) return defaultCrmLeads;
  return value
    .filter((item): item is Partial<CrmLead> => Boolean(item && typeof item === 'object'))
    .map((lead): CrmLead => {
      const now = new Date().toISOString();
      return {
        id: text(lead.id) || `lead-${Date.now()}`,
        name: text(lead.name),
        mobile: text(lead.mobile),
        email: text(lead.email),
        product: text(lead.product || 'personal_loan'),
        loanAmount: Number(lead.loanAmount || 0),
        source: text(lead.source || 'walk_in'),
        stage: normalizeLeadStage(lead.stage),
        assignedAgent: text(lead.assignedAgent || 'Unassigned'),
        lastContact: text(lead.lastContact || '-'),
        nextFollowUp: text(lead.nextFollowUp || '-'),
        daysInStage: Number(lead.daysInStage || 0),
        city: text(lead.city),
        notes: text(lead.notes),
        eligibilityReportId: text(lead.eligibilityReportId) || undefined,
        selectedLender: text(lead.selectedLender) || undefined,
        createdAt: text(lead.createdAt) || now,
        updatedAt: text(lead.updatedAt) || now,
      };
    })
    .filter((lead) => lead.name && lead.mobile);
}

export function normalizeApplications(value: unknown): CrmApplication[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CrmApplication => Boolean(item && typeof item === 'object'));
}

export function normalizeLeadStage(value: unknown): CrmLeadStage {
  const stage = text(value);
  if (
    [
      'new',
      'contacted',
      'eligibility_pending',
      'eligibility_done',
      'submitted_to_lender',
      'sanctioned',
      'rejected',
      'disbursed',
      'lost',
    ].includes(stage)
  ) {
    return stage as CrmLeadStage;
  }
  if (stage === 'interested' || stage === 'docs_submitted') return 'eligibility_pending';
  if (stage === 'login_pending' || stage === 'logged_in' || stage === 'approved') {
    return 'submitted_to_lender';
  }
  return 'new';
}
