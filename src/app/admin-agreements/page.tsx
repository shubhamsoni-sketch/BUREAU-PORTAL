'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { useAdmin } from '@/context/AdminContext';
import { Upload, UserPlus, X, CheckCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react';

type AgreementStatus = 'pending' | 'signed' | 'expired' | 'cancelled';

interface AgreementRow {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_code: string;
  partner_email: string;
  agreement_name: string;
  status: AgreementStatus;
  assigned_at: string;
  signed_at: string | null;
  signed_url: string | null;
}

const STATUS_LABELS: Record<AgreementStatus, string> = {
  pending: 'Pending',
  signed: 'Signed',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<AgreementStatus, string> = {
  signed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  expired: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_ICONS: Record<AgreementStatus, React.ReactNode> = {
  signed: <CheckCircle size={12} />,
  pending: <Clock size={12} />,
  expired: <AlertTriangle size={12} />,
  cancelled: <AlertTriangle size={12} />,
};

export default function AdminAgreementsPage() {
  const { partners } = useAdmin();
  const supabase = createClient();
  const [agreements, setAgreements] = useState<AgreementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [assignPartnerId, setAssignPartnerId] = useState('');
  const [agreementName, setAgreementName] = useState('DSA Partner Agreement');
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [statusFilter, setStatusFilter] = useState<AgreementStatus | 'All'>('All');
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const authHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  const loadAgreements = async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/admin-agreements-list', { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setAgreements(json.data ?? []);
      } else {
        showToast(json.error || 'Failed to load agreements');
      }
    } catch {
      showToast('Failed to load agreements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgreements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return statusFilter === 'All' ? agreements : agreements.filter((a) => a.status === statusFilter);
  }, [agreements, statusFilter]);

  const resetUpload = () => {
    setAssignPartnerId('');
    setAgreementName('DSA Partner Agreement');
    setAgreementFile(null);
  };

  const handleUpload = async () => {
    if (!assignPartnerId || !agreementName.trim() || !agreementFile) return;
    setSubmitting(true);
    try {
      const headers = await authHeaders();
      const form = new FormData();
      form.append('partnerId', assignPartnerId);
      form.append('agreementName', agreementName.trim());
      form.append('file', agreementFile);

      const res = await fetch('/api/admin-upload-agreement', {
        method: 'POST',
        headers,
        body: form,
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast('Agreement uploaded and assigned');
        setUploadModal(false);
        setAssignModal(false);
        resetUpload();
        loadAgreements();
      } else {
        showToast(json.error || 'Upload failed');
      }
    } catch {
      showToast('Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (agreementId: string, status: AgreementStatus) => {
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/admin-update-agreement-status', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agreementId, status }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(status === 'signed' ? 'Agreement marked as signed' : 'Agreement re-sent for signature');
        loadAgreements();
      } else {
        showToast(json.error || 'Status update failed');
      }
    } catch {
      showToast('Status update failed');
    }
  };

  const openUploadForPartner = () => {
    setAssignModal(true);
  };

  return (
    <AdminLayout title="Agreements">
      <div className="p-6 space-y-5">
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg animate-fade-in">
            {toast}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Agreements', value: agreements.length, color: 'text-slate-800' },
            { label: 'Signed', value: agreements.filter((a) => a.status === 'signed').length, color: 'text-emerald-600' },
            { label: 'Pending Signature', value: agreements.filter((a) => a.status === 'pending').length, color: 'text-amber-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(['All', 'pending', 'signed', 'expired', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
              >
                {s === 'All' ? 'All' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setUploadModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Upload size={14} /> Upload Template
            </button>
            <button
              onClick={openUploadForPartner}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus size={14} /> Assign to Partner
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Partner</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Agreement</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Assigned Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((agr) => (
                  <tr key={agr.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{agr.partner_name}</p>
                      <p className="text-xs text-slate-400">{agr.partner_code || agr.partner_email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{agr.agreement_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {agr.assigned_at ? new Date(agr.assigned_at).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[agr.status]}`}>
                        {STATUS_ICONS[agr.status]} {STATUS_LABELS[agr.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {agr.signed_url && (
                          <a
                            href={agr.signed_url}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <ExternalLink size={12} /> View
                          </a>
                        )}
                        {agr.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(agr.id, 'signed')}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Mark Signed Manually
                          </button>
                        )}
                        {agr.status === 'expired' && (
                          <button
                            onClick={() => handleStatusUpdate(agr.id, 'pending')}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Re-send
                          </button>
                        )}
                        {agr.status === 'signed' && (
                          <span className="text-xs text-slate-400">
                            {agr.signed_at ? `Signed ${new Date(agr.signed_at).toLocaleDateString('en-IN')}` : 'Signed'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">No agreements found</div>
            )}
            {loading && (
              <div className="py-12 text-center text-slate-400 text-sm">Loading agreements...</div>
            )}
          </div>
        </div>
      </div>

      {(assignModal || uploadModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800">
                {assignModal ? 'Assign Agreement' : 'Upload Agreement Template'}
              </h3>
              <button
                onClick={() => { setAssignModal(false); setUploadModal(false); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Select Partner</label>
                <select
                  value={assignPartnerId}
                  onChange={(e) => setAssignPartnerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">Choose partner</option>
                  {partners.filter((p) => p.status !== 'Terminated').map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.partnerCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Agreement Name</label>
                <input
                  value={agreementName}
                  onChange={(e) => setAgreementName(e.target.value)}
                  placeholder="e.g. DSA Partner Agreement"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Agreement File</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setAgreementFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-600 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200"
                />
                <p className="text-xs text-slate-400 mt-1">PDF or DOCX up to 10MB</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setAssignModal(false); setUploadModal(false); }}
                className="flex-1 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!assignPartnerId || !agreementName.trim() || !agreementFile || submitting}
                className="flex-1 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
