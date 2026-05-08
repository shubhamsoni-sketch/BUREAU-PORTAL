'use client';

import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAdmin, Agreement } from '@/context/AdminContext';
import { Upload, UserPlus, X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const STATUS_COLORS: Record<Agreement['status'], string> = {
  Signed: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-700',
  Expired: 'bg-slate-100 text-slate-500',
};

const STATUS_ICONS: Record<Agreement['status'], React.ReactNode> = {
  Signed: <CheckCircle size={12} />,
  Pending: <Clock size={12} />,
  Expired: <AlertTriangle size={12} />,
};

const TEMPLATES = [
  'DSA Partner Agreement v2.2',
  'DSA Partner Agreement v2.1',
  'DSA Partner Agreement v2.0',
  'Premium Partner Agreement v1.0',
  'Basic Partner Agreement v1.0',
];

export default function AdminAgreementsPage() {
  const { agreements, partners, addAgreement, updateAgreementStatus } = useAdmin();
  const [assignModal, setAssignModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [assignPartnerId, setAssignPartnerId] = useState('');
  const [assignTemplate, setAssignTemplate] = useState(TEMPLATES[0]);
  const [statusFilter, setStatusFilter] = useState<Agreement['status'] | 'All'>('All');
  const [toast, setToast] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    return statusFilter === 'All' ? agreements : agreements.filter((a) => a.status === statusFilter);
  }, [agreements, statusFilter]);

  const handleAssign = () => {
    if (!assignPartnerId) return;
    const partner = partners.find((p) => p.id === assignPartnerId);
    if (!partner) return;
    addAgreement({
      partnerId: assignPartnerId,
      partnerName: partner.fullName,
      templateName: assignTemplate,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
    });
    showToast(`Agreement assigned to ${partner.fullName}`);
    setAssignModal(false);
    setAssignPartnerId('');
  };

  const handleUpload = () => {
    showToast(`Template "${uploadFileName || 'New Template'}" uploaded successfully (placeholder)`);
    setUploadModal(false);
    setUploadFileName('');
  };

  return (
    <AdminLayout title="Agreements">
      <div className="p-6 space-y-5">
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg animate-fade-in">
            {toast}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Agreements', value: agreements.length, color: 'text-slate-800' },
            { label: 'Signed', value: agreements.filter((a) => a.status === 'Signed').length, color: 'text-emerald-600' },
            { label: 'Pending Signature', value: agreements.filter((a) => a.status === 'Pending').length, color: 'text-amber-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Actions + Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(['All', 'Pending', 'Signed', 'Expired'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
              >
                {s}
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
              onClick={() => setAssignModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus size={14} /> Assign to Partner
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Partner</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Template</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Assigned Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((agr) => (
                  <tr key={agr.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{agr.partnerName}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{agr.templateName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{agr.assignedDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[agr.status]}`}>
                        {STATUS_ICONS[agr.status]} {agr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {agr.status === 'Pending' && (
                        <button
                          onClick={() => { updateAgreementStatus(agr.id, 'Signed'); showToast('Agreement marked as signed'); }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Mark Signed
                        </button>
                      )}
                      {agr.status === 'Signed' && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                      {agr.status === 'Expired' && (
                        <button
                          onClick={() => { updateAgreementStatus(agr.id, 'Pending'); showToast('Agreement re-sent for signature'); }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Re-send
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">No agreements found</div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800">Assign Agreement</h3>
              <button onClick={() => setAssignModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Select Partner</label>
                <select
                  value={assignPartnerId}
                  onChange={(e) => setAssignPartnerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">— Choose partner —</option>
                  {partners.filter((p) => p.status !== 'Terminated').map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.partnerCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Agreement Template</label>
                <select
                  value={assignTemplate}
                  onChange={(e) => setAssignTemplate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {TEMPLATES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAssignModal(false)} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleAssign} disabled={!assignPartnerId} className="flex-1 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800">Upload Agreement Template</h3>
              <button onClick={() => setUploadModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center mb-4">
              <Upload size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Click to upload or drag & drop</p>
              <p className="text-xs text-slate-400 mt-1">PDF, DOCX up to 10MB</p>
              <p className="text-xs text-blue-500 mt-2">(Placeholder — file upload not active)</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Template Name</label>
              <input
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                placeholder="e.g. DSA Partner Agreement v2.3"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setUploadModal(false)} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleUpload} className="flex-1 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Upload</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
