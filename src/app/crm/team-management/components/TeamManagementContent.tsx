'use client';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/crm/components/ui/Modal';
import StatusBadge from '@/crm/components/ui/StatusBadge';
import { crmFetch } from '@/lib/crm/api';
import {
  CrmPermissionKey,
  CrmTeamMember,
  CrmUserRole,
  CrmUserStatus,
  crmPermissionLabels,
  defaultCrmTeam,
  rolePermissions,
} from '@/lib/crm/team';

const USER_ROLES = Object.keys(rolePermissions) as CrmUserRole[];
const PERMISSION_KEYS = Object.keys(crmPermissionLabels) as CrmPermissionKey[];

const ROLE_COLORS: Record<CrmUserRole, string> = {
  Admin: 'bg-purple-100 text-purple-700',
  Manager: 'bg-blue-100 text-blue-700',
  'DSA Agent': 'bg-emerald-100 text-emerald-700',
  'Ops Executive': 'bg-amber-100 text-amber-700',
  Accounts: 'bg-slate-100 text-slate-700',
};

const emptyForm = {
  name: '',
  email: '',
  mobile: '',
  role: 'DSA Agent' as CrmUserRole,
  zone: '',
  status: 'active' as CrmUserStatus,
  permissions: rolePermissions['DSA Agent'],
};

type CredentialNotice = {
  email: string;
  temporaryPassword: string;
};

export default function TeamManagementContent() {
  const [team, setTeam] = useState<CrmTeamMember[]>(defaultCrmTeam);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<CrmTeamMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CrmTeamMember | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [credentialNotice, setCredentialNotice] = useState<CredentialNotice | null>(null);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const response = await crmFetch('/api/crm/team', { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.error || 'Unable to load team');
        setTeam(Array.isArray(json.data) ? json.data : defaultCrmTeam);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to load team');
        setTeam(defaultCrmTeam);
      } finally {
        setLoading(false);
      }
    };
    loadTeam();
  }, []);

  const filtered = team.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || m.role === filterRole;
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const openAdd = () => {
    setEditMember(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (m: CrmTeamMember) => {
    setEditMember(m);
    setForm({
      name: m.name,
      email: m.email,
      mobile: m.mobile,
      role: m.role,
      zone: m.zone,
      status: m.status,
      permissions: m.permissions?.length ? m.permissions : rolePermissions[m.role],
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.mobile.trim() || !/^[6-9]\d{9}$/.test(form.mobile))
      e.mobile = '10-digit mobile required';
    if (!form.zone.trim()) e.zone = 'Zone / location is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setSaving(true);
    try {
      const response = await crmFetch('/api/crm/team', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, id: editMember?.id }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to save member');
      setTeam(Array.isArray(json.data) ? json.data : team);
      if (json.credentials?.temporaryPassword) {
        setCredentialNotice(json.credentials);
      }
      toast.success(editMember ? 'Team member updated' : 'Team member added');
      setModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const response = await crmFetch('/api/crm/team', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: deleteConfirm.id }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to remove member');
      setTeam(Array.isArray(json.data) ? json.data : team);
      toast.success('Team member removed');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to remove member');
    }
  };

  const toggleStatus = async (member: CrmTeamMember) => {
    const nextStatus = member.status === 'active' ? 'inactive' : 'active';
    const previousTeam = team;
    setTeam((prev) => prev.map((m) => (m.id === member.id ? { ...m, status: nextStatus } : m)));
    try {
      const response = await crmFetch('/api/crm/team', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_status', id: member.id, status: nextStatus }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to update status');
      setTeam(Array.isArray(json.data) ? json.data : team);
    } catch (error) {
      setTeam(previousTeam);
      toast.error(error instanceof Error ? error.message : 'Unable to update status');
    }
  };

  const resetPassword = async (member: CrmTeamMember) => {
    try {
      const response = await crmFetch('/api/crm/team', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', id: member.id }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to reset password');
      setTeam(Array.isArray(json.data) ? json.data : team);
      if (json.credentials?.temporaryPassword) setCredentialNotice(json.credentials);
      toast.success('Temporary password generated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to reset password');
    }
  };

  const stats = {
    total: team.length,
    active: team.filter((m) => m.status === 'active').length,
    admins: team.filter((m) => m.role === 'Admin').length,
    managers: team.filter((m) => m.role === 'Manager').length,
    agents: team.filter((m) => m.role === 'DSA Agent').length,
    ops: team.filter((m) => m.role === 'Ops Executive').length,
  };

  const setCurrentRolePreview = (member: CrmTeamMember) => {
    window.localStorage.setItem(
      'crm_current_user',
      JSON.stringify({
        name: member.name,
        role: member.role,
        avatar: member.avatar,
        permissions: member.permissions,
      })
    );
    window.dispatchEvent(new Event('crm-current-user-changed'));
    toast.success(`Previewing CRM as ${member.role}`);
  };

  const updateRole = (role: CrmUserRole) => {
    setForm((previous) => ({
      ...previous,
      role,
      permissions: rolePermissions[role],
    }));
  };

  const togglePermission = (permission: CrmPermissionKey) => {
    setForm((previous) => {
      const exists = previous.permissions.includes(permission);
      return {
        ...previous,
        permissions: exists
          ? previous.permissions.filter((item) => item !== permission)
          : [...previous.permissions, permission],
      };
    });
  };

  return (
    <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-700 text-foreground">Team Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats.active} active members — {stats.agents} agents, {stats.managers} managers
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary text-primary-foreground text-xs font-600 hover:bg-primary/90 active:scale-95 transition-all duration-150"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Members', value: stats.total, color: 'text-foreground' },
          { label: 'Active', value: stats.active, color: 'text-success' },
          { label: 'Managers', value: stats.managers, color: 'text-primary' },
          { label: 'Ops + Agents', value: stats.ops + stats.agents, color: 'text-accent' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-lg border border-border shadow-card px-4 py-3"
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-700 mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-sm border border-input bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="h-8 px-2 rounded-sm border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
          <option value="DSA Agent">DSA Agent</option>
          <option value="Ops Executive">Ops Executive</option>
          <option value="Accounts">Accounts</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-8 px-2 rounded-sm border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {[
                  'Member',
                  'Role & Zone',
                  'Login',
                  'Access',
                  'Performance',
                  'Status',
                  'Actions',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2.5 text-left text-[10px] font-700 uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {loading ? 'Loading team...' : 'No team members found'}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const convRate =
                    m.leadsAssigned > 0
                      ? Math.round((m.leadsConverted / m.leadsAssigned) * 100)
                      : 0;
                  return (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[11px] font-700 shrink-0">
                            {m.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-800 text-foreground truncate max-w-[190px]">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[190px]">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-700 ${ROLE_COLORS[m.role]}`}
                          >
                            {m.role}
                          </span>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">{m.zone}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="space-y-0.5">
                          <span
                            className={[
                              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-700 whitespace-nowrap',
                              m.authUserId
                                ? 'bg-success/10 text-success'
                                : 'bg-muted text-muted-foreground',
                            ].join(' ')}
                          >
                            {m.authUserId ? 'Active' : 'Not Created'}
                          </span>
                          <p className="text-[9px] text-muted-foreground whitespace-nowrap">
                            {m.credentialsGeneratedAt
                              ? new Date(m.credentialsGeneratedAt).toLocaleDateString('en-IN')
                              : m.joinedDate}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1 max-w-[170px]">
                          {(m.permissions || rolePermissions[m.role]).slice(0, 2).map((permission) => (
                            <span
                              key={`${m.id}-${permission}`}
                              className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-700 text-muted-foreground whitespace-nowrap"
                            >
                              {crmPermissionLabels[permission]}
                            </span>
                          ))}
                          {(m.permissions || rolePermissions[m.role]).length > 2 && (
                            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-700 text-primary whitespace-nowrap">
                              +{(m.permissions || rolePermissions[m.role]).length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="w-[120px] space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground">Leads</span>
                            <span className="text-xs font-800 text-foreground tabular-nums">{m.leadsAssigned}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                              <div
                                className={`h-full rounded-full ${convRate >= 60 ? 'bg-success' : convRate >= 40 ? 'bg-warning' : 'bg-danger'}`}
                                style={{ width: `${convRate}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-800 tabular-nums text-foreground">
                              {convRate}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => toggleStatus(m)} className="cursor-pointer">
                          <StatusBadge variant={m.status} size="sm" />
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => setCurrentRolePreview(m)}
                            className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Preview access"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openEdit(m)}
                            className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit member"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => resetPassword(m)}
                            className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Reset login password"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78z" />
                              <path d="M15.5 7.5l3 3L22 7l-3-3" />
                            </svg>
                          </button>
                          {m.role !== 'Admin' && (
                            <button
                              onClick={() => setDeleteConfirm(m)}
                              className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                              title="Remove member"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4h6v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMember ? 'Edit Team Member' : 'Add New Member'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-600 text-foreground">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Priya Sharma"
                className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-600 text-foreground">
                Email <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="priya@credittrust.in"
                className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-600 text-foreground">
                Mobile <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
                placeholder="9876543210"
                className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              {errors.mobile && <p className="text-xs text-danger">{errors.mobile}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-600 text-foreground">
                Role <span className="text-danger">*</span>
              </label>
              <select
                value={form.role}
                onChange={(e) => updateRole(e.target.value as CrmUserRole)}
                className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                {USER_ROLES.map((role) => (
                  <option key={`role-${role}`} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-600 text-foreground">
                Zone / Location <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.zone}
                onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))}
                placeholder="Mumbai Central"
                className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              {errors.zone && <p className="text-xs text-danger">{errors.zone}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-600 text-foreground">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value as CrmUserStatus }))
                }
                className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-600 text-foreground">Module Access</label>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, permissions: rolePermissions[p.role] }))}
                className="text-xs font-700 text-primary hover:text-primary/80"
              >
                Reset to role default
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-border bg-muted/20 p-2">
              {PERMISSION_KEYS.map((permission) => (
                <label
                  key={`permission-${permission}`}
                  className="flex items-center gap-2 rounded-sm bg-card px-2.5 py-2 text-xs font-600 text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                    className="h-3.5 w-3.5 rounded accent-primary"
                  />
                  {crmPermissionLabels[permission]}
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              onClick={() => setModalOpen(false)}
              className="h-9 px-4 rounded-sm border border-border text-sm font-600 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-5 rounded-sm bg-primary text-primary-foreground text-sm font-700 hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Saving...
                </>
              ) : editMember ? (
                'Save Changes'
              ) : (
                'Add Member'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Remove Team Member"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove{' '}
            <span className="font-700 text-foreground">{deleteConfirm?.name}</span> from the team?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="h-9 px-4 rounded-sm border border-border text-sm font-600 text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="h-9 px-5 rounded-sm bg-danger text-white text-sm font-700 hover:bg-danger/90 active:scale-95 transition-all duration-150"
            >
              Remove
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!credentialNotice}
        onClose={() => setCredentialNotice(null)}
        title="CRM Login Credentials"
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
            <div>
              <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">
                Login Email
              </p>
              <p className="text-sm font-800 text-foreground break-all">
                {credentialNotice?.email}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">
                Temporary Password
              </p>
              <p className="text-sm font-800 text-foreground font-mono break-all">
                {credentialNotice?.temporaryPassword}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this with the CRM user. They should change password after first login.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setCredentialNotice(null)}
              className="h-9 px-4 rounded-sm bg-primary text-primary-foreground text-sm font-700 hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
