'use client';
import React, { useState } from 'react';
import Modal from '@/crm/components/ui/Modal';
import StatusBadge from '@/crm/components/ui/StatusBadge';

type UserRole = 'Admin' | 'Manager' | 'DSA Agent';
type UserStatus = 'active' | 'inactive';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  zone: string;
  leadsAssigned: number;
  leadsConverted: number;
  joinedDate: string;
  status: UserStatus;
  avatar: string;
}

const MOCK_TEAM: TeamMember[] = [
  {
    id: 'usr-001',
    name: 'Rajesh Kumar',
    email: 'rajesh.k@dsacrm.in',
    mobile: '9876543210',
    role: 'Admin',
    zone: 'HQ — Mumbai',
    leadsAssigned: 0,
    leadsConverted: 0,
    joinedDate: '01 Jan 2024',
    status: 'active',
    avatar: 'RK',
  },
  {
    id: 'usr-002',
    name: 'Sunita Rao',
    email: 'sunita.r@dsacrm.in',
    mobile: '9765432109',
    role: 'Manager',
    zone: 'Bangalore HSR',
    leadsAssigned: 42,
    leadsConverted: 31,
    joinedDate: '15 Mar 2024',
    status: 'active',
    avatar: 'SR',
  },
  {
    id: 'usr-003',
    name: 'Priya Sharma',
    email: 'priya.s@dsacrm.in',
    mobile: '9654321098',
    role: 'DSA Agent',
    zone: 'Mumbai Central',
    leadsAssigned: 38,
    leadsConverted: 24,
    joinedDate: '10 Apr 2024',
    status: 'active',
    avatar: 'PS',
  },
  {
    id: 'usr-004',
    name: 'Anil Mehta',
    email: 'anil.m@dsacrm.in',
    mobile: '9543210987',
    role: 'DSA Agent',
    zone: 'Pune West',
    leadsAssigned: 29,
    leadsConverted: 18,
    joinedDate: '20 May 2024',
    status: 'active',
    avatar: 'AM',
  },
  {
    id: 'usr-005',
    name: 'Vikram Joshi',
    email: 'vikram.j@dsacrm.in',
    mobile: '9432109876',
    role: 'DSA Agent',
    zone: 'Delhi NCR',
    leadsAssigned: 33,
    leadsConverted: 21,
    joinedDate: '05 Jun 2024',
    status: 'active',
    avatar: 'VJ',
  },
  {
    id: 'usr-006',
    name: 'Kavitha Nair',
    email: 'kavitha.n@dsacrm.in',
    mobile: '9321098765',
    role: 'DSA Agent',
    zone: 'Chennai Adyar',
    leadsAssigned: 27,
    leadsConverted: 15,
    joinedDate: '12 Jul 2024',
    status: 'active',
    avatar: 'KN',
  },
  {
    id: 'usr-007',
    name: 'Deepak Verma',
    email: 'deepak.v@dsacrm.in',
    mobile: '9210987654',
    role: 'Manager',
    zone: 'Hyderabad',
    leadsAssigned: 55,
    leadsConverted: 40,
    joinedDate: '01 Aug 2024',
    status: 'inactive',
    avatar: 'DV',
  },
  {
    id: 'usr-008',
    name: 'Meena Pillai',
    email: 'meena.p@dsacrm.in',
    mobile: '9109876543',
    role: 'DSA Agent',
    zone: 'Kochi',
    leadsAssigned: 19,
    leadsConverted: 11,
    joinedDate: '15 Sep 2024',
    status: 'active',
    avatar: 'MP',
  },
];

const ROLE_COLORS: Record<UserRole, string> = {
  Admin: 'bg-purple-100 text-purple-700',
  Manager: 'bg-blue-100 text-blue-700',
  'DSA Agent': 'bg-emerald-100 text-emerald-700',
};

const emptyForm = {
  name: '',
  email: '',
  mobile: '',
  role: 'DSA Agent' as UserRole,
  zone: '',
  status: 'active' as UserStatus,
};

export default function TeamManagementContent() {
  const [team, setTeam] = useState<TeamMember[]>(MOCK_TEAM);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const openEdit = (m: TeamMember) => {
    setEditMember(m);
    setForm({
      name: m.name,
      email: m.email,
      mobile: m.mobile,
      role: m.role,
      zone: m.zone,
      status: m.status,
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
    await new Promise((r) => setTimeout(r, 600));
    if (editMember) {
      setTeam((prev) => prev.map((m) => (m.id === editMember.id ? { ...m, ...form } : m)));
    } else {
      const initials = form.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      const newMember: TeamMember = {
        id: `usr-${Date.now()}`,
        ...form,
        leadsAssigned: 0,
        leadsConverted: 0,
        joinedDate: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        avatar: initials,
      };
      setTeam((prev) => [newMember, ...prev]);
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setTeam((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const toggleStatus = (id: string) => {
    setTeam((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m
      )
    );
  };

  const stats = {
    total: team.length,
    active: team.filter((m) => m.status === 'active').length,
    admins: team.filter((m) => m.role === 'Admin').length,
    managers: team.filter((m) => m.role === 'Manager').length,
    agents: team.filter((m) => m.role === 'DSA Agent').length,
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
          { label: 'DSA Agents', value: stats.agents, color: 'text-accent' },
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
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {[
                  'Member',
                  'Role',
                  'Zone',
                  'Leads Assigned',
                  'Conversion',
                  'Joined',
                  'Status',
                  'Actions',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[11px] font-600 uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No team members found
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-700 shrink-0">
                            {m.avatar}
                          </div>
                          <div>
                            <p className="text-xs font-700 text-foreground">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-700 ${ROLE_COLORS[m.role]}`}
                        >
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{m.zone}</td>
                      <td className="px-4 py-3 text-xs font-700 text-foreground tabular-nums">
                        {m.leadsAssigned}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1 rounded-full bg-border overflow-hidden min-w-[40px]">
                            <div
                              className={`h-full rounded-full ${convRate >= 60 ? 'bg-success' : convRate >= 40 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${convRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-700 tabular-nums text-foreground">
                            {convRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{m.joinedDate}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleStatus(m.id)} className="cursor-pointer">
                          <StatusBadge variant={m.status} size="sm" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                placeholder="priya@dsacrm.in"
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
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
                className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="DSA Agent">DSA Agent</option>
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
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as UserStatus }))}
                className="w-full h-9 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
    </div>
  );
}
