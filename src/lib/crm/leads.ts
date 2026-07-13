export type CrmLeadStage =
  | 'new' |'contacted' |'eligibility_pending' |'eligibility_done' |'submitted_to_lender' |'sanctioned' |'rejected' |'disbursed' |'lost';

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
    | 'case_sent_to_lender' |'login_pending' |'draft' |'submitted' |'under_review' |'credit_check' |'conditional_approval' |'final_approval' |'disbursal_initiated' |'sanctioned' |'rejected' |'disbursed';
  statusHistory?: {
    status: CrmApplication['status'];
    note: string;
    changedAt: string;
    changedBy: string;
  }[];
  notes?: {
    id: string;
    note: string;
    createdAt: string;
    createdBy: string;
  }[];
  lenderHistory?: {
    lenderName: string;
    status: string;
    changedAt: string;
    note: string;
  }[];
  documents?: CrmApplicationDocument[];
  followUpDate?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
};

export type CrmApplicationDocument = {
  id: string;
  name: string;
  required: boolean;
  status: 'missing' | 'uploaded' | 'verified' | 'rejected';
  fileName?: string;
  uploadedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  note?: string;
};

export const defaultApplicationDocuments: CrmApplicationDocument[] = [
  { id: 'aadhaar', name: 'Aadhaar Card', required: true, status: 'missing' },
  { id: 'pan', name: 'PAN Card', required: true, status: 'missing' },
  { id: 'bank_statement', name: 'Bank Statement', required: true, status: 'missing' },
  { id: 'income_proof', name: 'Income Proof', required: true, status: 'missing' },
  { id: 'photo', name: 'Customer Photo', required: false, status: 'missing' },
  { id: 'property_documents', name: 'Property Documents', required: false, status: 'missing' },
];

export function createDefaultApplicationDocuments(product?: string): CrmApplicationDocument[] {
  const docs = defaultApplicationDocuments.map((document) => ({ ...document }));
  if (product === 'home_loan' || product === 'lap') {
    return docs.map((document) =>
      document.id === 'property_documents' ? { ...document, required: true } : document
    );
  }
  return docs;
}

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
  return value
    .filter((item): item is Partial<CrmApplication> => Boolean(item && typeof item === 'object'))
    .map((application): CrmApplication => {
      const now = new Date().toISOString();
      const status = normalizeApplicationStatus(application.status);
      return {
        id: text(application.id) || `app-${Date.now()}`,
        leadId: text(application.leadId),
        customerName: text(application.customerName),
        mobile: text(application.mobile),
        lenderName: text(application.lenderName),
        product: text(application.product || 'personal_loan'),
        loanAmount: Number(application.loanAmount || 0),
        status,
        statusHistory: Array.isArray(application.statusHistory)
          ? application.statusHistory.map((item) => ({
              status: normalizeApplicationStatus(item?.status),
              note: text(item?.note),
              changedAt: text(item?.changedAt) || now,
              changedBy: text(item?.changedBy || 'System'),
            }))
          : [],
        notes: Array.isArray(application.notes)
          ? application.notes.map((item) => ({
              id: text(item?.id) || `note-${Date.now()}`,
              note: text(item?.note),
              createdAt: text(item?.createdAt) || now,
              createdBy: text(item?.createdBy || 'System'),
            }))
          : [],
        lenderHistory: Array.isArray(application.lenderHistory)
          ? application.lenderHistory.map((item) => ({
              lenderName: text(item?.lenderName),
              status: text(item?.status),
              changedAt: text(item?.changedAt) || now,
              note: text(item?.note),
            }))
          : [],
        documents: normalizeApplicationDocuments(application.documents, application.product),
        followUpDate: text(application.followUpDate) || undefined,
        rejectionReason: text(application.rejectionReason) || undefined,
        createdAt: text(application.createdAt) || now,
        updatedAt: text(application.updatedAt) || text(application.createdAt) || now,
      };
    })
    .filter((application) => application.id && application.leadId && application.customerName);
}

export function normalizeApplicationDocuments(
  value: unknown,
  product?: string
): CrmApplicationDocument[] {
  const defaults = createDefaultApplicationDocuments(text(product));
  if (!Array.isArray(value)) return defaults;

  const incoming = value
    .filter((item): item is Partial<CrmApplicationDocument> =>
      Boolean(item && typeof item === 'object')
    )
    .map((document) => ({
      id: text(document.id) || `doc-${Date.now()}`,
      name: text(document.name),
      required: Boolean(document.required),
      status: normalizeDocumentStatus(document.status),
      fileName: text(document.fileName) || undefined,
      uploadedAt: text(document.uploadedAt) || undefined,
      verifiedAt: text(document.verifiedAt) || undefined,
      rejectedAt: text(document.rejectedAt) || undefined,
      note: text(document.note) || undefined,
    }))
    .filter((document) => document.id && document.name);

  const merged = defaults.map((defaultDocument) => {
    const match = incoming.find((document) => document.id === defaultDocument.id);
    return match ? { ...defaultDocument, ...match } : defaultDocument;
  });
  const defaultIds = new Set(defaults.map((document) => document.id));
  return [...merged, ...incoming.filter((document) => !defaultIds.has(document.id))];
}

export function normalizeDocumentStatus(value: unknown): CrmApplicationDocument['status'] {
  const status = text(value);
  if (['missing', 'uploaded', 'verified', 'rejected'].includes(status)) {
    return status as CrmApplicationDocument['status'];
  }
  if (status === 'pending') return 'uploaded';
  return 'missing';
}

export function normalizeApplicationStatus(value: unknown): CrmApplication['status'] {
  const status = text(value);
  if (
    [
      'case_sent_to_lender',
      'login_pending',
      'draft',
      'submitted',
      'under_review',
      'credit_check',
      'conditional_approval',
      'final_approval',
      'disbursal_initiated',
      'sanctioned',
      'rejected',
      'disbursed',
    ].includes(status)
  ) {
    return status as CrmApplication['status'];
  }
  if (status === 'logged_in') return 'submitted';
  if (status === 'approved') return 'sanctioned';
  return 'case_sent_to_lender';
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
