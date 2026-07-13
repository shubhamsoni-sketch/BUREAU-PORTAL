'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAdmin, Partner, PartnerStatus } from '@/context/AdminContext';
import { createClient } from '@/lib/supabase/client';
import { PARTNER_PRODUCT_ACCESS_LABELS, type PartnerProductAccess } from '@/lib/partner-access';
import { authFetch } from '@/lib/supabase/auth-fetch';

import { Search, CheckCircle, XCircle, Ban, RotateCcw, ChevronDown, X, Edit2, Wallet, UserPlus, Mail, Copy, Eye, EyeOff, Phone, Settings2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import PartnerCommercialsModal from './components/PartnerCommercialsModal';

const STATUS_COLORS: Record<PartnerStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-700',
  Suspended: 'bg-red-100 text-red-700',
  Terminated: 'bg-slate-100 text-slate-500',
};

const PRICING_PLANS = ['None', 'Basic', 'Standard', 'Premium'];

type Tab = 'all' | 'pending-registrations';

interface MockEmailModal {
  name: string;
  email: string;
  partnerCode: string;
  password: string;
}

interface PartnerRequest {
  id: string;
  name: string;
  company_name: string;
  mobile: string;
  email: string;
  city?: string;
  state?: string;
  address?: string;
  pin_code?: string;
  gst?: string;
  business_type?: string;
  service_type?: string;
  submitted_at: string;
  status: string;
}

export default function AdminPartnersPage() {
  const { partners, updatePartnerStatus, updatePartnerPricing, updatePartnerProductAccess, addPartner } = useAdmin();
  const supabase = createClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | 'All'>('All');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [pricingEdit, setPricingEdit] = useState<{ id: string; plan: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [mockEmailModal, setMockEmailModal] = useState<MockEmailModal | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [addPartnerResult, setAddPartnerResult] = useState<MockEmailModal | null>(null);
  const [commercialsPartner, setCommercialsPartner] = useState<Partner | null>(null);

  // Supabase partner requests state
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  // Add partner form state
  const [addForm, setAddForm] = useState({
    companyName: '',
    authorisedPersonName: '',
    contactNumber: '',
    email: '',
    address: '',
    state: '',
    pinCode: '',
    gst: '',
    businessType: '',
    serviceType: '',
    pricingPlan: 'Basic',
    productAccess: 'bureau_portal' as PartnerProductAccess,
  });
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});
  const [addFormSubmitting, setAddFormSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadPartnerRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await authFetch('/api/admin-partner-requests');
      const result = await res.json();
      if (res.ok && result.success && result.data) {
        setPartnerRequests(result.data);
      } else {
        console.error('[loadPartnerRequests] error:', result.error);
      }
    } catch (err) {
      console.error('[loadPartnerRequests] fetch failed:', err);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartnerRequests();
  }, [loadPartnerRequests]);

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      const matchSearch = !search || p.fullName.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()) || p.partnerCode.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [partners, search, statusFilter]);

  const handleStatusChange = (partner: Partner, newStatus: PartnerStatus) => {
    updatePartnerStatus(partner.id, newStatus);
    showToast(`${partner.fullName} status updated to ${newStatus}`);
    if (selectedPartner?.id === partner.id) {
      setSelectedPartner({ ...partner, status: newStatus });
    }
  };

  const handlePricingSave = (id: string) => {
    if (!pricingEdit) return;
    updatePartnerPricing(id, pricingEdit.plan);
    showToast('Pricing plan updated');
    setPricingEdit(null);
  };

  const handleProductAccessChange = (partner: Partner, access: PartnerProductAccess) => {
    updatePartnerProductAccess(partner.id, access);
    showToast(`${partner.fullName} access set to ${PARTNER_PRODUCT_ACCESS_LABELS[access]}`);
    if (selectedPartner?.id === partner.id) {
      setSelectedPartner({ ...partner, productAccess: access });
    }
  };

  const handleApproveRequest = async (req: PartnerRequest) => {
    try {
      const res = await authFetch('/api/approve-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: req.id }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMockEmailModal({
          name: result.name,
          email: result.email,
          partnerCode: result.partnerCode,
          password: result.password,
        });
        setPartnerRequests((prev) => prev.filter((r) => r.id !== req.id));
        // Add the newly approved partner to the All Partners list immediately
        addPartner({
          id: `partner-${Date.now()}`,
          partnerCode: result.partnerCode,
          fullName: result.name,
          email: result.email,
          phone: req.mobile || '',
          city: req.city || '',
          state: '',
          status: 'Active',
          walletBalance: 0,
          reportsPulled: 0,
          reportsThisMonth: 0,
          joinedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          lastActive: '—',
          pricingPlan: 'Basic',
          productAccess: 'bureau_portal',
        });
        showToast(`${req.name} approved successfully`);
      } else if (res.status === 409) {
        // Already processed — remove from pending list and notify
        setPartnerRequests((prev) => prev.filter((r) => r.id !== req.id));
        showToast(`${req.name} was already approved`);
      } else {
        showToast(result.error || 'Approval failed');
      }
    } catch {
      showToast('Approval failed. Please try again.');
    }
  };

  const handleRejectRequest = async (req: PartnerRequest) => {
    try {
      const res = await authFetch('/api/reject-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: req.id }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setPartnerRequests((prev) => prev.filter((r) => r.id !== req.id));
        showToast(`Application from ${req.name} has been rejected.`);
      } else {
        showToast(result.error || 'Rejection failed');
      }
    } catch {
      showToast('Rejection failed. Please try again.');
    }
  };

  const handleAddPartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!addForm.companyName.trim()) errs.companyName = 'Company name is required';
    if (!addForm.authorisedPersonName.trim()) errs.authorisedPersonName = 'Authorised person name is required';
    if (!addForm.contactNumber.trim()) errs.contactNumber = 'Contact number is required';
    else if (!/^[6-9]\d{9}$/.test(addForm.contactNumber)) errs.contactNumber = 'Enter a valid 10-digit mobile number';
    if (!addForm.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) errs.email = 'Enter a valid email';
    if (!addForm.address.trim()) errs.address = 'Address is required';
    if (!addForm.state) errs.state = 'Please select a state';
    if (!addForm.pinCode.trim()) errs.pinCode = 'PIN code is required';
    else if (!/^\d{6}$/.test(addForm.pinCode)) errs.pinCode = 'Enter a valid 6-digit PIN code';
    if (!addForm.businessType) errs.businessType = 'Please select a business type';
    if (!addForm.serviceType) errs.serviceType = 'Please select a service type';
    if (addForm.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(addForm.gst.toUpperCase())) {
      errs.gst = 'Enter a valid GST number';
    }
    setAddFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setAddFormSubmitting(true);
    try {
      const res = await authFetch('/api/add-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const result = await res.json();
      if (res.ok && result.success && result.partnerCode && result.email && result.password && result.name) {
        setAddPartnerResult({ name: result.name, email: result.email, partnerCode: result.partnerCode, password: result.password });
        setShowAddPartnerModal(false);
        setAddForm({ companyName: '', authorisedPersonName: '', contactNumber: '', email: '', address: '', state: '', pinCode: '', gst: '', businessType: '', serviceType: '', pricingPlan: 'Basic', productAccess: 'bureau_portal' });
        // Add the manually added partner to the All Partners list immediately
        addPartner({
          id: `partner-${Date.now()}`,
          partnerCode: result.partnerCode,
          fullName: result.name,
          email: result.email,
          phone: addForm.contactNumber,
          city: '',
          state: addForm.state || '',
          status: 'Active',
          walletBalance: 0,
          reportsPulled: 0,
          reportsThisMonth: 0,
          joinedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          lastActive: '—',
          pricingPlan: addForm.pricingPlan || 'Basic',
          productAccess: addForm.productAccess,
        });
      } else {
        showToast(result.error || 'Failed to create partner');
      }
    } catch {
      showToast('Failed to create partner. Please try again.');
    } finally {
      setAddFormSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    showToast('Copied to clipboard');
  };

  const pendingCount = partners.filter((p) => p.status === 'Pending').length;

  return (
    <ErrorBoundary label="Admin Partners">
      <AdminLayout title="Partner Management">
        <div className="p-6 space-y-5">
          {/* Toast */}
          {toast && (
            <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
              {toast}
            </div>
          )}

          {/* Header Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Partners', value: partners.length, color: 'text-slate-800' },
              { label: 'Active', value: partners.filter((p) => p.status === 'Active').length, color: 'text-emerald-600' },
              { label: 'Pending Applications', value: partnerRequests.length, color: 'text-amber-600' },
              { label: 'Suspended', value: partners.filter((p) => p.status === 'Suspended').length, color: 'text-red-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs + Add Partner Button */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                All Partners
              </button>
              <button
                onClick={() => setActiveTab('pending-registrations')}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'pending-registrations' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Pending Applications
                {partnerRequests.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {partnerRequests.length}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={() => setShowAddPartnerModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <UserPlus size={15} />
              Add Partner Manually
            </button>
          </div>

          {activeTab === 'all' ? (
            <>
              {/* Filters */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, code..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(['All', 'Active', 'Pending', 'Suspended', 'Terminated'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Partner</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Wallet</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pricing</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product Access</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((partner) => (
                        <tr key={partner.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <button onClick={() => setSelectedPartner(partner)} className="text-left">
                              <p className="font-medium text-slate-800 hover:text-blue-600 transition-colors">{partner.fullName}</p>
                              <p className="text-xs text-slate-400">{partner.email}</p>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-500">{partner.partnerCode}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{partner.city}{partner.state ? `, ${partner.state}` : ''}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[partner.status]}`}>
                              {partner.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                            ₹{partner.walletBalance.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3">
                            {pricingEdit?.id === partner.id ? (
                              <div className="flex items-center gap-1">
                                <select
                                  value={pricingEdit.plan}
                                  onChange={(e) => setPricingEdit({ id: partner.id, plan: e.target.value })}
                                  className="text-xs border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                >
                                  {PRICING_PLANS.map((p) => <option key={p}>{p}</option>)}
                                </select>
                                <button onClick={() => handlePricingSave(partner.id)} className="text-emerald-600 hover:text-emerald-700"><CheckCircle size={14} /></button>
                                <button onClick={() => setPricingEdit(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-600">{partner.pricingPlan}</span>
                                <button onClick={() => setPricingEdit({ id: partner.id, plan: partner.pricingPlan })} className="text-slate-400 hover:text-blue-500 transition-colors">
                                  <Edit2 size={12} />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={partner.productAccess}
                              onChange={(e) => handleProductAccessChange(partner, e.target.value as PartnerProductAccess)}
                              className="min-w-[148px] text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                              <option value="bureau_portal">Bureau Portal</option>
                              <option value="dsa_crm">DSA CRM</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">{partner.joinedDate}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {partner.status === 'Pending' && (
                                <>
                                  <button onClick={() => handleStatusChange(partner, 'Active')} title="Approve" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                                    <CheckCircle size={15} />
                                  </button>
                                  <button onClick={() => handleStatusChange(partner, 'Terminated')} title="Reject" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                    <XCircle size={15} />
                                  </button>
                                </>
                              )}
                              {partner.status === 'Active' && (
                                <button onClick={() => handleStatusChange(partner, 'Suspended')} title="Deactivate" className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors">
                                  <Ban size={15} />
                                </button>
                              )}
                              {partner.status === 'Suspended' && (
                                <button onClick={() => handleStatusChange(partner, 'Active')} title="Reactivate" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                                  <RotateCcw size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => setCommercialsPartner(partner)}
                                title="Set Commercials"
                                className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"
                              >
                                <Settings2 size={15} />
                              </button>
                              <button onClick={() => setSelectedPartner(partner)} title="View Details" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                                <ChevronDown size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-sm">No partners found</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Pending Applications Tab — from Supabase */
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {requestsLoading ? (
                <div className="py-16 text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : partnerRequests.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={22} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">No pending applications</p>
                  <p className="text-slate-400 text-xs mt-1">All partner applications have been reviewed.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Applicant</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mobile</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Business Type</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Service Type</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">State</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Applied On</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerRequests.map((req) => (
                        <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{req.name}</p>
                            <p className="text-xs text-slate-400">{req.email}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{req.company_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{req.mobile}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{req.business_type || '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{req.service_type || '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{req.state || req.city || '—'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {new Date(req.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveRequest(req)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                              >
                                <CheckCircle size={13} />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectRequest(req)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition-colors"
                              >
                                <XCircle size={13} />
                                Reject
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
          )}
        </div>

        {/* Partner Detail Drawer */}
        {selectedPartner && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/30" onClick={() => setSelectedPartner(null)} />
            <div className="w-96 bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Partner Details</h3>
                <button onClick={() => setSelectedPartner(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-5 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {selectedPartner.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{selectedPartner.fullName}</p>
                    <p className="text-xs text-slate-400">{selectedPartner.partnerCode}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Email', value: selectedPartner.email },
                    { label: 'Phone', value: selectedPartner.phone },
                    { label: 'Location', value: `${selectedPartner.city}${selectedPartner.state ? `, ${selectedPartner.state}` : ''}` },
                    { label: 'Joined', value: selectedPartner.joinedDate },
                    { label: 'Last Active', value: selectedPartner.lastActive },
                    { label: 'Reports Pulled', value: selectedPartner.reportsPulled.toString() },
                    { label: 'This Month', value: selectedPartner.reportsThisMonth.toString() },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-slate-500">{row.label}</span>
                      <span className="font-medium text-slate-800">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
                  <Wallet size={18} className="text-blue-500" />
                  <div>
                    <p className="text-xs text-slate-500">Wallet Balance</p>
                    <p className="text-lg font-bold text-slate-800">₹{selectedPartner.walletBalance.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selectedPartner.status]}`}>
                    {selectedPartner.status}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCommercialsPartner(selectedPartner);
                    setSelectedPartner(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Settings2 size={15} />
                  Set Commercials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Credentials Modal — shown after approval */}
        {mockEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMockEmailModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Partner Approved!</h3>
                    <p className="text-emerald-100 text-sm">Credentials generated (mock email)</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Generated Credentials</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Partner Code', value: mockEmailModal.partnerCode },
                      { label: 'Email', value: mockEmailModal.email },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200 text-sm">
                        <span className="text-slate-600"><strong>{row.label}:</strong> {row.value}</span>
                        <button onClick={() => copyToClipboard(row.value)} className="text-slate-400 hover:text-blue-500 ml-2"><Copy size={12} /></button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200 text-sm">
                      <span className="text-slate-600"><strong>Password:</strong> {showPassword ? mockEmailModal.password : '••••••••'}</span>
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-blue-500">
                          {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button onClick={() => copyToClipboard(mockEmailModal.password)} className="text-slate-400 hover:text-blue-500"><Copy size={12} /></button>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setMockEmailModal(null); setShowPassword(false); }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Partner Result Modal */}
        {addPartnerResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setAddPartnerResult(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Partner Created!</h3>
                    <p className="text-blue-100 text-sm">Credentials generated &amp; email sent</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Generated Credentials</p>
                  {[
                    { label: 'Name', value: addPartnerResult.name },
                    { label: 'Partner Code', value: addPartnerResult.partnerCode },
                    { label: 'Email', value: addPartnerResult.email },
                    { label: 'Password', value: addPartnerResult.password },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200">
                      <span className="text-slate-600"><strong>{row.label}:</strong> {row.value}</span>
                      <button onClick={() => copyToClipboard(row.value)} className="text-slate-400 hover:text-blue-500 ml-2"><Copy size={12} /></button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setAddPartnerResult(null)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Partner Manually Modal */}
        {showAddPartnerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddPartnerModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Add Partner Manually</h3>
                <button onClick={() => setShowAddPartnerModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddPartnerSubmit} className="p-6 space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business / Company Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="ABC Finance Pvt Ltd"
                      value={addForm.companyName}
                      onChange={(e) => setAddForm((p) => ({ ...p, companyName: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    {addFormErrors.companyName && <p className="mt-1 text-xs text-red-500">{addFormErrors.companyName}</p>}
                  </div>
                  {/* Authorised Person Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Authorised Person Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Rajesh Kumar"
                      value={addForm.authorisedPersonName}
                      onChange={(e) => setAddForm((p) => ({ ...p, authorisedPersonName: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    {addFormErrors.authorisedPersonName && <p className="mt-1 text-xs text-red-500">{addFormErrors.authorisedPersonName}</p>}
                  </div>
                  {/* Contact Number */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      value={addForm.contactNumber}
                      onChange={(e) => setAddForm((p) => ({ ...p, contactNumber: e.target.value.replace(/\D/g, '') }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    {addFormErrors.contactNumber && <p className="mt-1 text-xs text-red-500">{addFormErrors.contactNumber}</p>}
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      placeholder="partner@company.in"
                      value={addForm.email}
                      onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    {addFormErrors.email && <p className="mt-1 text-xs text-red-500">{addFormErrors.email}</p>}
                  </div>
                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
                    <select
                      value={addForm.state}
                      onChange={(e) => setAddForm((p) => ({ ...p, state: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="">Select state</option>
                      {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {addFormErrors.state && <p className="mt-1 text-xs text-red-500">{addFormErrors.state}</p>}
                  </div>
                  {/* PIN Code */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">PIN Code <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="400001"
                      maxLength={6}
                      value={addForm.pinCode}
                      onChange={(e) => setAddForm((p) => ({ ...p, pinCode: e.target.value.replace(/\D/g, '') }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    {addFormErrors.pinCode && <p className="mt-1 text-xs text-red-500">{addFormErrors.pinCode}</p>}
                  </div>
                  {/* Business Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Type <span className="text-red-500">*</span></label>
                    <select
                      value={addForm.businessType}
                      onChange={(e) => setAddForm((p) => ({ ...p, businessType: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="">Select type</option>
                      <option value="DSA">DSA</option>
                      <option value="Agent">Agent</option>
                      <option value="Individual">Individual</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Other">Other</option>
                    </select>
                    {addFormErrors.businessType && <p className="mt-1 text-xs text-red-500">{addFormErrors.businessType}</p>}
                  </div>
                  {/* Service Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Service Type <span className="text-red-500">*</span></label>
                    <select
                      value={addForm.serviceType}
                      onChange={(e) => setAddForm((p) => ({ ...p, serviceType: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="">Select service</option>
                      <option value="Consumer Report">Consumer Report</option>
                      <option value="Commercial Report">Commercial Report</option>
                      <option value="Both">Both</option>
                    </select>
                    {addFormErrors.serviceType && <p className="mt-1 text-xs text-red-500">{addFormErrors.serviceType}</p>}
                  </div>
                  {/* GST (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">GST Number <span className="text-slate-400 text-xs font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      value={addForm.gst}
                      onChange={(e) => setAddForm((p) => ({ ...p, gst: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 uppercase"
                    />
                    {addFormErrors.gst && <p className="mt-1 text-xs text-red-500">{addFormErrors.gst}</p>}
                  </div>
                  {/* Pricing Plan */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pricing Plan</label>
                    <select
                      value={addForm.pricingPlan}
                      onChange={(e) => setAddForm((p) => ({ ...p, pricingPlan: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      {PRICING_PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  {/* Product Access */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Product Access</label>
                    <select
                      value={addForm.productAccess}
                      onChange={(e) => setAddForm((p) => ({ ...p, productAccess: e.target.value as PartnerProductAccess }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="bureau_portal">Bureau Portal</option>
                      <option value="dsa_crm">DSA CRM</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-400">Partner login will open this product directly.</p>
                  </div>
                </div>
                {/* Address - full width */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address <span className="text-red-500">*</span></label>
                  <textarea
                    rows={2}
                    placeholder="Street, Area, City"
                    value={addForm.address}
                    onChange={(e) => setAddForm((p) => ({ ...p, address: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                  />
                  {addFormErrors.address && <p className="mt-1 text-xs text-red-500">{addFormErrors.address}</p>}
                </div>
                <p className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  Login credentials will be auto-generated and emailed to the partner after creation.
                </p>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddPartnerModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addFormSubmitting}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {addFormSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus size={14} />}
                    {addFormSubmitting ? 'Creating...' : 'Create Partner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Partner Commercials Modal */}
        {commercialsPartner && (
          <PartnerCommercialsModal
            partner={commercialsPartner}
            onClose={() => setCommercialsPartner(null)}
            onSaved={() => showToast(`Commercials saved for ${commercialsPartner.fullName}`)}
          />
        )}

      </AdminLayout>
    </ErrorBoundary>
  );
}
