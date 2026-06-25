'use client';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import StatusBadge from '@/crm/components/ui/StatusBadge';

interface LoanApplication {
  id: string;
  appId: string;
  applicant: string;
  product: string;
  loanAmount: number;
  lender: string;
  stage: string;
  cibil: number;
  emi: number;
  assignedAgent: string;
  lastUpdate: string;
  daysPending: number;
  city: string;
  processingFee: number;
  roi: number;
  tenure: number;
  followUpDate?: string;
  rejectionReason?: string;
  statusHistory?: {
    status: string;
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
}

interface Props {
  app: LoanApplication;
  onClose: () => void;
  onAddNote: (applicationId: string, note: string) => Promise<void>;
  onUpdateFollowUp: (applicationId: string, followUpDate: string) => Promise<void>;
  onUpdateStatus: (
    applicationId: string,
    status: any,
    options?: { note?: string; rejectionReason?: string }
  ) => Promise<void>;
}

const formatINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

const MOCK_DOCS = [
  { id: 'doc-1', name: 'Aadhaar Card', status: 'verified' },
  { id: 'doc-2', name: 'PAN Card', status: 'verified' },
  { id: 'doc-3', name: 'Last 6 months bank statement', status: 'verified' },
  { id: 'doc-4', name: 'ITR (last 2 years)', status: 'pending' },
  { id: 'doc-5', name: 'Salary slips (last 3 months)', status: 'pending' },
  { id: 'doc-6', name: 'Property documents', status: 'pending' },
];

const LENDER_OFFERS = [
  {
    id: 'offer-hdfc',
    lender: 'HDFC Bank',
    roi: 8.65,
    emi: 34820,
    processingFee: 12600,
    approval: '3–5 days',
  },
  {
    id: 'offer-icici',
    lender: 'ICICI Bank',
    roi: 8.9,
    emi: 35610,
    processingFee: 10500,
    approval: '4–6 days',
  },
  {
    id: 'offer-axis',
    lender: 'Axis Bank',
    roi: 9.1,
    emi: 36280,
    processingFee: 8400,
    approval: '5–7 days',
  },
];

export default function ApplicationDetailPanel({
  app,
  onClose,
  onAddNote,
  onUpdateFollowUp,
  onUpdateStatus,
}: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'documents' | 'offers'>(
    'overview'
  );
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState(app.followUpDate || '');

  useEffect(() => {
    setFollowUpDate(app.followUpDate || '');
    setNote('');
  }, [app.id, app.followUpDate]);

  const handleUpload = async (docId: string) => {
    setUploadingDoc(docId);
    // BACKEND: POST /api/documents/upload with file + applicationId
    await new Promise((r) => setTimeout(r, 1200));
    setUploadingDoc(null);
    toast.success('Document uploaded — pending verification');
  };

  const submitNote = async () => {
    const cleanNote = note.trim();
    if (!cleanNote) return;
    await onAddNote(app.id, cleanNote);
    setNote('');
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-card flex flex-col h-full max-h-[calc(100vh-160px)] sticky top-0 fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <p className="text-[11px] font-700 text-primary font-mono">{app.appId}</p>
          <p className="text-sm font-700 text-foreground">{app.applicant}</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close detail panel"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {(['overview', 'activity', 'documents', 'offers'] as const).map((tab) => (
          <button
            key={`dtab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={[
              'flex-1 py-2 text-xs font-600 transition-colors capitalize',
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge variant={app.stage as Parameters<typeof StatusBadge>[0]['variant']} />
              <StatusBadge
                variant={app.product as Parameters<typeof StatusBadge>[0]['variant']}
                size="sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Loan Amount', value: formatINR(app.loanAmount) },
                { label: 'Lender', value: app.lender },
                { label: 'Follow-up', value: app.followUpDate || 'Not set' },
                { label: 'ROI', value: app.roi > 0 ? `${app.roi}% p.a.` : '—' },
                { label: 'Tenure', value: app.tenure > 0 ? `${app.tenure} months` : '—' },
                {
                  label: 'EMI',
                  value: app.emi > 0 ? `₹${app.emi.toLocaleString('en-IN')}/mo` : '—',
                },
                {
                  label: 'Processing Fee',
                  value:
                    app.processingFee > 0 ? `₹${app.processingFee.toLocaleString('en-IN')}` : '—',
                },
              ].map((item) => (
                <div key={`detail-${item.label}`} className="bg-muted/30 rounded-sm p-2.5">
                  <p className="text-[10px] font-600 uppercase tracking-wide text-muted-foreground mb-0.5">
                    {item.label}
                  </p>
                  <p className="text-xs font-700 text-foreground inr-value">{item.value}</p>
                </div>
              ))}
            </div>

            {app.stage === 'rejected' && (
              <div className="rounded-sm border border-danger/20 bg-danger/5 p-2.5">
                <p className="text-[10px] font-600 uppercase tracking-wide text-danger mb-1">
                  Rejection Reason
                </p>
                <p className="text-xs font-700 text-foreground">
                  {app.rejectionReason || 'Reason not captured'}
                </p>
              </div>
            )}

            <div className="bg-muted/30 rounded-sm p-2.5">
              <p className="text-[10px] font-600 uppercase tracking-wide text-muted-foreground mb-1">
                Credit Score
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'text-xl font-800 tabular-nums',
                    app.cibil >= 750
                      ? 'text-success'
                      : app.cibil >= 700
                        ? 'text-warning'
                        : 'text-danger',
                  ].join(' ')}
                >
                  {app.cibil || '—'}
                </span>
                <span
                  className={[
                    'text-[10px] font-600',
                    app.cibil >= 750
                      ? 'text-success'
                      : app.cibil >= 700
                        ? 'text-warning'
                        : 'text-danger',
                  ].join(' ')}
                >
                  {app.cibil
                    ? app.cibil >= 750
                      ? 'Excellent'
                      : app.cibil >= 700
                        ? 'Good'
                        : 'Poor'
                    : 'Pending'}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className={[
                    'h-full rounded-full',
                    app.cibil >= 750 ? 'bg-success' : app.cibil >= 700 ? 'bg-warning' : 'bg-danger',
                  ].join(' ')}
                  style={{ width: `${app.cibil ? ((app.cibil - 300) / 600) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                <span>300</span>
                <span>900</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-600 uppercase tracking-wide text-muted-foreground">
                Assigned Agent
              </p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-700">
                  {app.assignedAgent
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <span className="text-xs font-600 text-foreground">{app.assignedAgent}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-600 uppercase tracking-wide text-muted-foreground">
                Follow-up Date
              </p>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                  className="h-8 min-w-0 flex-1 rounded-sm border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                <button
                  onClick={() => onUpdateFollowUp(app.id, followUpDate)}
                  className="h-8 rounded-sm bg-primary px-3 text-xs font-700 text-primary-foreground hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-600 uppercase tracking-wide text-muted-foreground">
                Quick Note
              </p>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Add file remark..."
                className="w-full resize-none rounded-sm border border-input bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                onClick={submitNote}
                className="h-8 w-full rounded-sm border border-border text-xs font-600 text-foreground hover:bg-muted active:scale-95 transition-all duration-150"
              >
                Add Note
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onUpdateStatus(app.id, 'submitted', { note: 'File submitted' })}
                className="flex-1 h-8 rounded-sm bg-primary text-primary-foreground text-xs font-600 hover:bg-primary/90 active:scale-95 transition-all duration-150"
              >
                Mark Submitted
              </button>
              <button
                onClick={() => {
                  const reason = window.prompt('Rejection reason?') || '';
                  onUpdateStatus(app.id, 'rejected', { note: reason, rejectionReason: reason });
                }}
                className="flex-1 h-8 rounded-sm border border-danger/20 text-xs font-600 text-danger hover:bg-danger/5 active:scale-95 transition-all duration-150"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-700 text-foreground mb-2">Status History</p>
              <div className="space-y-2">
                {(app.statusHistory || []).length ? (
                  (app.statusHistory || []).map((item, index) => (
                    <div
                      key={`${item.changedAt}-${index}`}
                      className="rounded-sm border border-border bg-muted/30 p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge
                          variant={item.status as Parameters<typeof StatusBadge>[0]['variant']}
                          size="sm"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.changedAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-foreground">{item.note || '-'}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{item.changedBy}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-sm border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                    No status movement captured yet.
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-700 text-foreground mb-2">Notes</p>
              <div className="space-y-2">
                {(app.notes || []).length ? (
                  (app.notes || []).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-sm border border-border bg-background p-2.5"
                    >
                      <p className="text-xs text-foreground">{item.note}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {item.createdBy} · {new Date(item.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-sm border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                    No notes added yet.
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-700 text-foreground mb-2">Lender Trail</p>
              <div className="space-y-2">
                {(app.lenderHistory || []).length ? (
                  (app.lenderHistory || []).map((item, index) => (
                    <div
                      key={`${item.lenderName}-${index}`}
                      className="rounded-sm border border-border bg-muted/30 p-2.5"
                    >
                      <p className="text-xs font-700 text-foreground">{item.lenderName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.note || item.status}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(item.changedAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-sm border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                    No lender movement captured yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              {MOCK_DOCS.filter((d) => d.status === 'verified').length} of {MOCK_DOCS.length}{' '}
              documents verified
            </p>
            {MOCK_DOCS.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2.5 rounded-sm border border-border bg-background hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={[
                      'w-6 h-6 rounded-sm flex items-center justify-center shrink-0',
                      doc.status === 'verified'
                        ? 'bg-success-bg text-success'
                        : 'bg-warning-bg text-warning',
                    ].join(' ')}
                  >
                    {doc.status === 'verified' ? (
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs font-600 text-foreground truncate">{doc.name}</p>
                </div>
                {doc.status === 'pending' && (
                  <button
                    onClick={() => handleUpload(doc.id)}
                    disabled={uploadingDoc === doc.id}
                    className="shrink-0 h-6 px-2 rounded-sm bg-primary/10 text-primary text-[10px] font-700 hover:bg-primary/20 transition-colors disabled:opacity-60 flex items-center gap-1"
                  >
                    {uploadingDoc === doc.id ? (
                      <svg
                        className="animate-spin"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    )}
                    Upload
                  </button>
                )}
                {doc.status === 'verified' && (
                  <span className="text-[10px] font-600 text-success">Verified</span>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-1">
              Compare offers from 3 lenders for this application
            </p>
            {LENDER_OFFERS.map((offer, i) => (
              <div
                key={offer.id}
                className={[
                  'rounded-sm border p-3',
                  i === 0 ? 'border-success/30 bg-success-bg' : 'border-border bg-background',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-700 text-foreground">{offer.lender}</span>
                  {i === 0 && (
                    <span className="text-[10px] font-700 text-success bg-success/10 px-1.5 py-0.5 rounded-full border border-success/20">
                      Best Rate
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'ROI', value: `${offer.roi}% p.a.` },
                    { label: 'EMI', value: `₹${offer.emi.toLocaleString('en-IN')}` },
                    {
                      label: 'Processing Fee',
                      value: `₹${offer.processingFee.toLocaleString('en-IN')}`,
                    },
                    { label: 'Approval TAT', value: offer.approval },
                  ].map((item) => (
                    <div key={`offer-item-${offer.id}-${item.label}`}>
                      <p className="text-[9px] font-600 uppercase text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs font-700 text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
                <button
                  className={[
                    'w-full mt-2.5 h-7 rounded-sm text-[11px] font-700 transition-all active:scale-95',
                    i === 0
                      ? 'bg-success text-white hover:bg-success/90'
                      : 'border border-border text-foreground hover:bg-muted',
                  ].join(' ')}
                  onClick={() => toast.success(`Application sent to ${offer.lender}`)}
                >
                  Select {offer.lender}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
