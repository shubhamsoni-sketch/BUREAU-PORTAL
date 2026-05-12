'use client';

import React, { useState, useMemo, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useInvoice, Invoice, InvoiceSettings } from '@/context/InvoiceContext';
import { FileText, Eye, Search, X, CheckCircle2, Calendar, CreditCard, Hash, Building2, User, Download, Settings, Save, AlertCircle, Send, Clock, RefreshCw, BadgeCheck } from 'lucide-react';


const PAYMENT_MODES = ['Bank Transfer', 'UPI', 'NEFT', 'IMPS', 'Cheque', 'Cash'] as const;
type PaymentMode = typeof PAYMENT_MODES[number];

// ─── Mark as Paid Modal ────────────────────────────────────────────────────────
function MarkAsPaidModal({
  invoice,
  onClose,
  onConfirm,
}: {
  invoice: Invoice;
  onClose: () => void;
  onConfirm: (paymentMode: string, utrNumber: string) => Promise<void>;
}) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Bank Transfer');
  const [utrNumber, setUtrNumber] = useState('');
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    setConfirming(true);
    await onConfirm(paymentMode, utrNumber.trim());
    setConfirming(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <BadgeCheck size={18} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Mark as Paid</h2>
              <p className="text-xs text-muted-foreground">{invoice.invoiceNumber} · ₹{invoice.amount.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700">
              Confirming payment will update <strong>{invoice.partnerName}</strong>'s wallet balance by <strong>₹{invoice.amount.toLocaleString('en-IN')}</strong> and create a payment record.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Payment Mode <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 bg-white"
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              UTR / Reference Number <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="e.g. UTR123456789012 or transaction ID"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter UTR number, transaction ID, or cheque number for reference</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-60 transition-colors"
            >
              {confirming ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Confirming...</>
              ) : (
                <><BadgeCheck size={14} /> Confirm Payment</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice Detail Modal ──────────────────────────────────────────────────────
function InvoiceDetailModal({ invoice, settings, onClose, onRaise, onMarkPaid }: {
  invoice: Invoice;
  settings: InvoiceSettings | null;
  onClose: () => void;
  onRaise?: (id: string) => Promise<void>;
  onMarkPaid?: (id: string, paymentMode: string, utrNumber: string) => Promise<void>;
}) {
  const [raising, setRaising] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const formattedDate = new Date(invoice.issuedAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  function handleDownload() {
    const content = `
INVOICE
=======================================================
Invoice No : ${invoice.invoiceNumber}
Date       : ${formattedDate}
Status     : ${invoice.status.toUpperCase()}
=======================================================

FROM:
${settings?.companyName ?? 'Credit Trust'}
${settings?.companyAddress ?? ''}
${settings?.gstNumber ? `GST: ${settings.gstNumber}` : ''}

TO:
${invoice.partnerName}
${invoice.partnerEmail}
Partner ID : ${invoice.partnerId}

=======================================================
DESCRIPTION                          AMOUNT
-------------------------------------------------------
Wallet Credit Addition               ₹${invoice.amount.toLocaleString('en-IN')}
Credits Added                        ${invoice.creditsAdded.toLocaleString('en-IN')} credits
Payment Mode                         ${invoice.paymentMode}
Transaction Ref                      ${invoice.transactionRef ?? 'N/A'}
${invoice.utrNumber ? `UTR Number                           ${invoice.utrNumber}` : ''}
${invoice.notes ? `Notes                                ${invoice.notes}` : ''}
=======================================================
TOTAL AMOUNT                         ₹${invoice.amount.toLocaleString('en-IN')}
=======================================================

${invoice.status === 'raised' ? 'INVOICE RAISED AND ISSUED' : `Status: ${invoice.status.toUpperCase()}`}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRaise() {
    if (!onRaise) return;
    setRaising(true);
    await onRaise(invoice.id);
    setRaising(false);
    onClose();
  }

  const isDraft = invoice.status === 'draft';
  const isRaised = invoice.status === 'raised';

  return (
    <>
      {showMarkPaidModal && onMarkPaid && (
        <MarkAsPaidModal
          invoice={invoice}
          onClose={() => setShowMarkPaidModal(false)}
          onConfirm={async (mode, utr) => {
            await onMarkPaid(invoice.id, mode, utr);
            setShowMarkPaidModal(false);
            onClose();
          }}
        />
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText size={18} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Invoice Detail</h2>
                <p className="text-xs text-muted-foreground">{invoice.invoiceNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isDraft && onRaise && (
                <button
                  onClick={handleRaise}
                  disabled={raising}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                  {raising ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Raising...</>
                  ) : (
                    <><Send size={14} /> Raise Invoice</>
                  )}
                </button>
              )}
              {isRaised && onMarkPaid && (
                <button
                  onClick={() => setShowMarkPaidModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  <BadgeCheck size={14} /> Mark as Paid
                </button>
              )}
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Download size={14} />
                Download
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">{settings?.companyName ?? 'Credit Trust'}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">{settings?.companyAddress ?? ''}</p>
                {settings?.gstNumber && (
                  <p className="text-xs text-muted-foreground mt-1">GST: {settings.gstNumber}</p>
                )}
              </div>
              <StatusBadge status={invoice.status} />
            </div>

            <div className="border-t border-border" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice Number</p>
                    <p className="text-sm font-semibold text-foreground font-mono">{invoice.invoiceNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice Date</p>
                    <p className="text-sm font-medium text-foreground">{formattedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Mode</p>
                    <p className="text-sm font-medium text-foreground">{invoice.paymentMode}</p>
                  </div>
                </div>
                {invoice.utrNumber && (
                  <div className="flex items-center gap-2">
                    <Hash size={14} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">UTR / Reference</p>
                      <p className="text-sm font-mono text-foreground">{invoice.utrNumber}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Billed To</p>
                    <p className="text-sm font-semibold text-foreground">{invoice.partnerName}</p>
                    <p className="text-xs text-muted-foreground">{invoice.partnerEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Partner ID</p>
                    <p className="text-sm font-mono text-foreground">{invoice.partnerId}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">Wallet Credit Addition</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{invoice.creditsAdded.toLocaleString('en-IN')} credits added</p>
                      {invoice.notes && <p className="text-xs text-muted-foreground mt-0.5">Note: {invoice.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold font-mono text-foreground">
                      ₹{invoice.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  {invoice.transactionRef && (
                    <tr className="border-b border-border bg-slate-50/50">
                      <td className="px-4 py-2 text-xs text-muted-foreground" colSpan={2}>
                        Transaction Ref: <span className="font-mono">{invoice.transactionRef}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-foreground">Total Amount</td>
                    <td className="px-4 py-3 text-right font-bold text-lg font-mono text-foreground">
                      ₹{invoice.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {isDraft && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Clock size={14} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700">This is a draft invoice. Click <strong>Raise Invoice</strong> to issue it to the partner.</p>
              </div>
            )}
            {isRaised && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Send size={14} className="text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-700">Invoice has been raised. Click <strong>Mark as Paid</strong> once payment is received.</p>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
              This is a computer-generated invoice. No signature required.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Invoice['status'] }) {
  const config: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    raised: { label: 'Raised', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    Cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200' },
  };
  const c = config[status] ?? config['Pending'];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${c.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {c.label}
    </span>
  );
}

// ─── Template Settings Panel ───────────────────────────────────────────────────
function TemplateSettingsPanel({ settings, onSave }: {
  settings: InvoiceSettings | null;
  onSave: (data: Partial<InvoiceSettings>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    companyName: settings?.companyName ?? '',
    companyAddress: settings?.companyAddress ?? '',
    gstNumber: settings?.gstNumber ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (settings) {
      setForm({
        companyName: settings.companyName,
        companyAddress: settings.companyAddress,
        gstNumber: settings.gstNumber ?? '',
      });
    }
  }, [settings]);

  async function handleSave() {
    setSaving(true);
    await onSave({
      companyName: form.companyName,
      companyAddress: form.companyAddress,
      gstNumber: form.gstNumber || null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="bg-white rounded-xl border border-border p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
          <Settings size={18} className="text-purple-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Invoice Template Settings</h2>
          <p className="text-xs text-muted-foreground">These details appear on all generated invoices</p>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700">Settings saved successfully</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Company Name *</label>
          <input
            type="text"
            className="input-base"
            value={form.companyName}
            onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
            placeholder="e.g. Credit Trust Financial Services Pvt. Ltd."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Company Address *</label>
          <textarea
            className="input-base resize-none"
            rows={3}
            value={form.companyAddress}
            onChange={(e) => setForm((p) => ({ ...p, companyAddress: e.target.value }))}
            placeholder="Full address including city, state, PIN"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">GST Number <span className="text-muted-foreground font-normal">(Optional)</span></label>
          <input
            type="text"
            className="input-base font-mono"
            value={form.gstNumber}
            onChange={(e) => setForm((p) => ({ ...p, gstNumber: e.target.value }))}
            placeholder="e.g. 27AABCC1234D1Z5"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Company Logo <span className="text-muted-foreground font-normal">(Placeholder)</span></label>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border bg-slate-50">
            <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
              <Building2 size={18} className="text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Logo Upload</p>
              <p className="text-xs text-muted-foreground">Logo upload will be available in a future update</p>
            </div>
            <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Coming Soon</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !form.companyName}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? (
            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
          ) : (
            <><Save size={14} /> Save Settings</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'invoices', label: 'All Invoices', icon: FileText },
  { id: 'settings', label: 'Template Settings', icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

const STATUS_FILTERS = ['All', 'draft', 'raised', 'paid'] as const;

export default function AdminInvoicesPage() {
  const { invoices, settings, isLoading, updateSettings, fetchInvoices, fetchSettings, raiseInvoice, markAsPaid } = useInvoice();
  const [activeTab, setActiveTab] = useState<TabId>('invoices');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [markPaidInvoice, setMarkPaidInvoice] = useState<Invoice | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchInvoices();
    fetchSettings();
  }, [fetchInvoices, fetchSettings]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3500);
  };

  const handleRaise = async (invoiceId: string) => {
    const ok = await raiseInvoice(invoiceId);
    if (ok) {
      showToast('Invoice raised successfully — now visible to partner', 'success');
    } else {
      showToast('Failed to raise invoice. Please try again.', 'error');
    }
  };

  const handleMarkPaid = async (invoiceId: string, paymentMode: string, utrNumber: string) => {
    const ok = await markAsPaid(invoiceId, paymentMode, utrNumber);
    if (ok) {
      showToast('Invoice marked as paid — wallet balance updated', 'success');
    } else {
      showToast('Failed to mark invoice as paid. Please try again.', 'error');
    }
  };

  const filtered = useMemo(() => {
    let result = invoices;
    if (statusFilter !== 'All') {
      result = result.filter((inv) => {
        const normalizedStatus = inv.status.toLowerCase();
        const normalizedFilter = statusFilter.toLowerCase();
        return normalizedStatus === normalizedFilter;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.partnerName.toLowerCase().includes(q) ||
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.partnerId.toLowerCase().includes(q)
      );
    }
    return result;
  }, [invoices, search, statusFilter]);

  const draftCount = invoices.filter((i) => i.status === 'draft').length;
  const raisedCount = invoices.filter((i) => i.status === 'raised').length;
  const paidCount = invoices.filter((i) => i.status === 'paid' || i.status === 'Paid').length;

  return (
    <AdminLayout title="Invoice Management">
      <div className="p-6 space-y-5">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg max-w-sm ${toastType === 'error' ? 'bg-red-600' : 'bg-slate-800'}`}>
            {toast}
          </div>
        )}

        {/* Mark as Paid Modal (standalone, triggered from table row) */}
        {markPaidInvoice && (
          <MarkAsPaidModal
            invoice={markPaidInvoice}
            onClose={() => setMarkPaidInvoice(null)}
            onConfirm={async (mode, utr) => {
              await handleMarkPaid(markPaidInvoice.id, mode, utr);
              setMarkPaidInvoice(null);
            }}
          />
        )}

        {selectedInvoice && (
          <InvoiceDetailModal
            invoice={selectedInvoice}
            settings={settings}
            onClose={() => setSelectedInvoice(null)}
            onRaise={handleRaise}
            onMarkPaid={handleMarkPaid}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Total Invoices</p>
            <p className="text-3xl font-bold font-mono text-foreground">{invoices.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Draft</p>
            <p className="text-3xl font-bold font-mono text-amber-600">{draftCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Raised (Awaiting Payment)</p>
            <p className="text-3xl font-bold font-mono text-blue-600">{raisedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Paid</p>
            <p className="text-3xl font-bold font-mono text-emerald-600">{paidCount}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <TabIcon size={15} />
                {tab.label}
                {tab.id === 'invoices' && draftCount > 0 && (
                  <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{draftCount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab: All Invoices */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-xl border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-semibold text-foreground">All Invoices</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  {STATUS_FILTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${statusFilter === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="relative w-56">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    className="input-base pl-8 text-sm"
                    placeholder="Search partner or invoice..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button onClick={fetchInvoices} className="p-2 rounded-lg border border-border hover:bg-slate-50 transition-colors" title="Refresh">
                  <RefreshCw size={14} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="px-6 py-12 text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading invoices...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <AlertCircle size={22} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice No.</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Partner</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-sm text-foreground">{inv.invoiceNumber}</td>
                        <td className="px-6 py-3.5">
                          <p className="text-sm font-medium text-foreground">{inv.partnerName}</p>
                          <p className="text-xs text-muted-foreground">{inv.partnerId}</p>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(inv.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-3.5 text-right font-semibold font-mono text-foreground">
                          ₹{inv.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                              <Eye size={12} />
                              View
                            </button>
                            {inv.status === 'draft' && (
                              <button
                                onClick={async () => {
                                  const ok = await raiseInvoice(inv.id);
                                  if (ok) showToast(`Invoice ${inv.invoiceNumber} raised`, 'success');
                                  else showToast('Failed to raise invoice', 'error');
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                              >
                                <Send size={12} />
                                Raise
                              </button>
                            )}
                            {inv.status === 'raised' && (
                              <button
                                onClick={() => setMarkPaidInvoice(inv)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                              >
                                <BadgeCheck size={12} />
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Template Settings */}
        {activeTab === 'settings' && (
          <TemplateSettingsPanel settings={settings} onSave={updateSettings} />
        )}
      </div>
    </AdminLayout>
  );
}
