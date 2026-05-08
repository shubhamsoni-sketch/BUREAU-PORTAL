'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/context/AuthContext';
import { useInvoice, Invoice } from '@/context/InvoiceContext';
import { createClient } from '@/lib/supabase/client';
import { FileText, Download, Eye, X, Calendar, CreditCard, Hash, Building2, User, Loader2, AlertCircle,  } from 'lucide-react';

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Invoice['status'] }) {
  const config: Record<string, { label: string; className: string }> = {
    raised: { label: 'Raised', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    Pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    Cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200' },
  };
  const c = config[status] ?? config['raised'];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${c.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {c.label}
    </span>
  );
}

function InvoiceDetailModal({ invoice, settings, onClose }: {
  invoice: Invoice;
  settings: { companyName: string; companyAddress: string; gstNumber: string | null } | null;
  onClose: () => void;
}) {
  const formattedDate = new Date(invoice.issuedAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  function handleDownload() {
    const content = `
INVOICE
=======================================================
Invoice No : ${invoice.invoiceNumber}
Date       : ${formattedDate}
Status     : RAISED
=======================================================

FROM:
${settings?.companyName ?? 'Insight'}
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
${invoice.notes ? `Notes                                ${invoice.notes}` : ''}
=======================================================
TOTAL AMOUNT                         ₹${invoice.amount.toLocaleString('en-IN')}
=======================================================

Thank you for your business!
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Invoice Preview</h2>
              <p className="text-xs text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Invoice Body */}
        <div className="p-6 space-y-6">
          {/* Company Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">{settings?.companyName ?? 'Insight'}</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">{settings?.companyAddress ?? ''}</p>
              {settings?.gstNumber && (
                <p className="text-xs text-muted-foreground mt-1">GST: {settings.gstNumber}</p>
              )}
            </div>
            <div className="text-right">
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Invoice Meta */}
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

          {/* Line Items */}
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
                    <p className="text-xs text-muted-foreground mt-0.5">{invoice.creditsAdded.toLocaleString('en-IN')} credits added to wallet</p>
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

          <p className="text-xs text-center text-muted-foreground">
            This is a computer-generated invoice. No signature required.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PartnerInvoicesPage() {
  const { user } = useAuth();
  const { fetchPartnerInvoices, settings, fetchSettings, isLoading } = useInvoice();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);

  // Resolve partner ID from user ID
  useEffect(() => {
    async function resolvePartner() {
      if (!user) return;
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('partners')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data?.id) {
          setPartnerId(data.id);
        }
      } catch {
        // ignore
      }
    }
    resolvePartner();
  }, [user]);

  useEffect(() => {
    async function load() {
      if (!partnerId) return;
      setLoading(true);
      const data = await fetchPartnerInvoices(partnerId);
      setInvoices(data);
      setLoading(false);
    }
    load();
    fetchSettings();
  }, [partnerId, fetchPartnerInvoices, fetchSettings]);

  return (
    <AppLayout role="partner">
      <Topbar
        title="My Invoices"
        subtitle="View and download your invoices"
        role="partner"
      />

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          settings={settings}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-5 fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Total Invoices</p>
            <p className="text-3xl font-bold font-mono text-foreground">{invoices.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Total Amount</p>
            <p className="text-3xl font-bold font-mono text-emerald-600">
              ₹{invoices.reduce((s, i) => s + i.amount, 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Credits Added</p>
            <p className="text-3xl font-bold font-mono text-blue-600">
              {invoices.reduce((s, i) => s + i.creditsAdded, 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Invoice History</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Invoices raised by your account manager</p>
          </div>

          {loading ? (
            <div className="px-6 py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-sm">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <AlertCircle size={28} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No invoices yet</p>
              <p className="text-xs text-muted-foreground mt-1">Invoices will appear here once your account manager raises them</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice No.</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Credits</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-sm text-foreground">{inv.invoiceNumber}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(inv.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold font-mono text-foreground">
                        ₹{inv.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-foreground">
                        {inv.creditsAdded.toLocaleString('en-IN')} credits
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
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              // Trigger download after modal opens
                              setTimeout(() => {
                                const btn = document.querySelector('[data-download-btn]') as HTMLButtonElement;
                                btn?.click();
                              }, 100);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            <Download size={12} />
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
