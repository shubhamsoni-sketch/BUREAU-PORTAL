'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import Icon from '@/components/ui/AppIcon';

import EmptyState from '@/components/ui/EmptyState';
import { TableRowSkeleton } from '@/components/ui/LoadingSkeleton';
import PartnerStatusDropdown from './PartnerStatusDropdown';

type PartnerStatus = 'Active' | 'Pending' | 'Suspended' | 'Terminated';

type Partner = {
  id: string;
  partnerCode: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: PartnerStatus;
  walletBalance: number;
  reportsPulled: number;
  reportsThisMonth: number;
  joinedDate: string;
  lastActive: string;
};

const mockPartners: Partner[] = [
  {
    id: 'partner-001',
    partnerCode: 'DSA-2024-001',
    fullName: 'Rajesh Kumar Sharma',
    email: 'rajesh.sharma@creditdsa.in',
    phone: '+91 98201 44321',
    city: 'Mumbai',
    state: 'Maharashtra',
    status: 'Active',
    walletBalance: 12450,
    reportsPulled: 384,
    reportsThisMonth: 47,
    joinedDate: '12 Jan 2024',
    lastActive: '01 Apr 2026',
  },
  {
    id: 'partner-002',
    partnerCode: 'DSA-2024-002',
    fullName: 'Priya Nair',
    email: 'priya.nair@finbridge.co.in',
    phone: '+91 97305 88210',
    city: 'Bengaluru',
    state: 'Karnataka',
    status: 'Active',
    walletBalance: 8320,
    reportsPulled: 219,
    reportsThisMonth: 31,
    joinedDate: '03 Feb 2024',
    lastActive: '31 Mar 2026',
  },
  {
    id: 'partner-003',
    partnerCode: 'DSA-2024-003',
    fullName: 'Amit Verma',
    email: 'amit.verma@loanexpert.in',
    phone: '+91 99112 67540',
    city: 'Delhi',
    state: 'Delhi',
    status: 'Pending',
    walletBalance: 0,
    reportsPulled: 0,
    reportsThisMonth: 0,
    joinedDate: '28 Mar 2026',
    lastActive: '—',
  },
  {
    id: 'partner-004',
    partnerCode: 'DSA-2023-091',
    fullName: 'Sunita Agarwal',
    email: 'sunita.agarwal@creditmitra.in',
    phone: '+91 98765 00234',
    city: 'Jaipur',
    state: 'Rajasthan',
    status: 'Active',
    walletBalance: 3100,
    reportsPulled: 156,
    reportsThisMonth: 18,
    joinedDate: '15 Aug 2023',
    lastActive: '01 Apr 2026',
  },
  {
    id: 'partner-005',
    partnerCode: 'DSA-2023-054',
    fullName: 'Mohammed Farhan',
    email: 'm.farhan@dsahub.co.in',
    phone: '+91 90001 55678',
    city: 'Hyderabad',
    state: 'Telangana',
    status: 'Suspended',
    walletBalance: 450,
    reportsPulled: 92,
    reportsThisMonth: 0,
    joinedDate: '22 Jun 2023',
    lastActive: '14 Feb 2026',
  },
  {
    id: 'partner-006',
    partnerCode: 'DSA-2024-008',
    fullName: 'Kavitha Rajan',
    email: 'kavitha.rajan@tncredit.in',
    phone: '+91 94441 22890',
    city: 'Chennai',
    state: 'Tamil Nadu',
    status: 'Active',
    walletBalance: 19800,
    reportsPulled: 501,
    reportsThisMonth: 62,
    joinedDate: '11 Mar 2024',
    lastActive: '01 Apr 2026',
  },
  {
    id: 'partner-007',
    partnerCode: 'DSA-2024-015',
    fullName: 'Deepak Patel',
    email: 'deepak.patel@gujdsa.in',
    phone: '+91 98254 77001',
    city: 'Ahmedabad',
    state: 'Gujarat',
    status: 'Active',
    walletBalance: 6750,
    reportsPulled: 178,
    reportsThisMonth: 24,
    joinedDate: '05 Apr 2024',
    lastActive: '31 Mar 2026',
  },
  {
    id: 'partner-008',
    partnerCode: 'DSA-2025-003',
    fullName: 'Ankita Singh',
    email: 'ankita.singh@upcredit.in',
    phone: '+91 97718 44500',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    status: 'Pending',
    walletBalance: 0,
    reportsPulled: 0,
    reportsThisMonth: 0,
    joinedDate: '30 Mar 2026',
    lastActive: '—',
  },
  {
    id: 'partner-009',
    partnerCode: 'DSA-2023-021',
    fullName: 'Suresh Babu Reddy',
    email: 'suresh.reddy@apfinance.in',
    phone: '+91 98501 33442',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    status: 'Active',
    walletBalance: 2200,
    reportsPulled: 267,
    reportsThisMonth: 9,
    joinedDate: '18 Nov 2023',
    lastActive: '28 Mar 2026',
  },
  {
    id: 'partner-010',
    partnerCode: 'DSA-2022-044',
    fullName: 'Meenakshi Iyer',
    email: 'meenakshi.iyer@kreditkar.in',
    phone: '+91 99001 88120',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    status: 'Terminated',
    walletBalance: 0,
    reportsPulled: 48,
    reportsThisMonth: 0,
    joinedDate: '07 Sep 2022',
    lastActive: '03 Jan 2026',
  },
  {
    id: 'partner-011',
    partnerCode: 'DSA-2025-007',
    fullName: 'Harpreet Singh Bedi',
    email: 'harpreet.bedi@punjablock.in',
    phone: '+91 98140 55600',
    city: 'Chandigarh',
    state: 'Punjab',
    status: 'Pending',
    walletBalance: 0,
    reportsPulled: 0,
    reportsThisMonth: 0,
    joinedDate: '01 Apr 2026',
    lastActive: '—',
  },
];

const STATUS_FILTER_OPTIONS: { label: string; value: PartnerStatus | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Active', value: 'Active' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Suspended', value: 'Suspended' },
  { label: 'Terminated', value: 'Terminated' },
];

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

export default function PartnersTableSection() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | 'All'>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [partners, setPartners] = useState<Partner[]>(mockPartners);
  const [loading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortCol, setSortCol] = useState<keyof Partner>('joinedDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = partners.filter((p) => {
      const matchSearch =
        !search ||
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.partnerCode.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });

    result = [...result].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return result;
  }, [partners, search, statusFilter, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const allSelected = paginated.length > 0 && paginated.every((p) => selectedIds.has(p.id));

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selectedIds);
      paginated.forEach((p) => next.delete(p.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginated.forEach((p) => next.add(p.id));
      setSelectedIds(next);
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSort = (col: keyof Partner) => {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const handleStatusChange = (partnerId: string, newStatus: PartnerStatus) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === partnerId ? { ...p, status: newStatus } : p))
    );
    const partner = partners.find((p) => p.id === partnerId);
    toast.success(`${partner?.fullName} status updated to ${newStatus}.`);
  };

  const handleDelete = (partnerId: string) => {
    setDeletingId(partnerId);
    setTimeout(() => {
      setPartners((prev) => prev.filter((p) => p.id !== partnerId));
      setDeletingId(null);
      toast.success('Partner removed from platform.');
    }, 400);
  };

  const handleBulkSuspend = () => {
    setPartners((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, status: 'Suspended' } : p))
    );
    toast.success(`${selectedIds.size} partner(s) suspended.`);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    setPartners((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    toast.success(`${selectedIds.size} partner(s) removed.`);
    setSelectedIds(new Set());
  };

  const SortIcon = ({ col }: { col: keyof Partner }) => (
    <span className="ml-1 inline-flex flex-col">
      <Icon
        name="ChevronUpIcon"
        size={10}
        className={sortCol === col && sortDir === 'asc' ? 'text-primary' : 'text-muted-foreground/40'}
      />
      <Icon
        name="ChevronDownIcon"
        size={10}
        className={sortCol === col && sortDir === 'desc' ? 'text-primary' : 'text-muted-foreground/40'}
      />
    </span>
  );

  const statusBadgeVariant = (status: PartnerStatus) => {
    const map: Record<PartnerStatus, 'active' | 'pending' | 'suspended' | 'terminated'> = {
      Active: 'active',
      Pending: 'pending',
      Suspended: 'suspended',
      Terminated: 'terminated',
    };
    return map[status];
  };

  return (
    <>
      <Toaster position="bottom-right" richColors />

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Partners', value: partners.length, icon: 'UsersIcon', color: 'text-blue-600 bg-blue-50' },
          { label: 'Active', value: partners.filter((p) => p.status === 'Active').length, icon: 'CheckCircleIcon', color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pending Approval', value: partners.filter((p) => p.status === 'Pending').length, icon: 'ClockIcon', color: 'text-amber-600 bg-amber-50' },
          { label: 'Suspended', value: partners.filter((p) => p.status === 'Suspended').length, icon: 'ExclamationCircleIcon', color: 'text-red-600 bg-red-50' },
        ].map((stat) => (
          <div key={`stat-${stat.label.replace(/\s/g, '-').toLowerCase()}`} className="stat-card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <Icon name={stat.icon as Parameters<typeof Icon>[0]['name']} size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold text-foreground font-tabular">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 border-b border-border">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              className="input-base pl-9 h-9 text-sm"
              placeholder="Search by name, code, email, city..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              aria-label="Search partners"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button
                key={`filter-${opt.value}`}
                onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  statusFilter === opt.value
                    ? 'bg-primary text-white' :'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="sm:ml-auto flex items-center gap-2">
            <button className="btn-secondary h-9 text-xs">
              <Icon name="ArrowDownTrayIcon" size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-b border-blue-100 fade-in">
            <span className="text-sm font-semibold text-blue-700">
              {selectedIds.size} partner{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBulkSuspend}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors duration-150"
            >
              <Icon name="PauseCircleIcon" size={14} />
              Suspend Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-150"
            >
              <Icon name="TrashIcon" size={14} />
              Remove Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1100px]" role="table">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="table-th w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-border"
                    aria-label="Select all partners"
                  />
                </th>
                {[
                  { label: 'Partner Code', col: 'partnerCode' as keyof Partner },
                  { label: 'Name', col: 'fullName' as keyof Partner },
                  { label: 'Contact', col: 'email' as keyof Partner },
                  { label: 'City / State', col: 'city' as keyof Partner },
                  { label: 'Status', col: 'status' as keyof Partner },
                  { label: 'Wallet Balance', col: 'walletBalance' as keyof Partner },
                  { label: 'Reports (Total)', col: 'reportsPulled' as keyof Partner },
                  { label: 'This Month', col: 'reportsThisMonth' as keyof Partner },
                  { label: 'Joined', col: 'joinedDate' as keyof Partner },
                  { label: 'Last Active', col: 'lastActive' as keyof Partner },
                ].map(({ label, col }) => (
                  <th
                    key={`th-${col}`}
                    className="table-th cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort(col)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <SortIcon col={col} />
                    </span>
                  </th>
                ))}
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton key={`skel-row-${i + 1}`} cols={12} />
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={12}>
                    <EmptyState
                      iconName="UsersIcon"
                      title="No partners found"
                      description="No partners match your current search or filter. Try adjusting your criteria or add a new partner."
                      action={
                        <button
                          className="btn-primary"
                          onClick={() => { setSearch(''); setStatusFilter('All'); }}
                        >
                          Clear Filters
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((partner) => (
                  <tr
                    key={partner.id}
                    className={`border-b border-border transition-all duration-200 hover:bg-muted/40 ${
                      selectedIds.has(partner.id) ? 'bg-blue-50/50' : ''
                    } ${deletingId === partner.id ? 'opacity-0 max-h-0' : 'opacity-100'}`}
                  >
                    <td className="table-td">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(partner.id)}
                        onChange={() => toggleRow(partner.id)}
                        className="rounded border-border"
                        aria-label={`Select ${partner.fullName}`}
                      />
                    </td>
                    <td className="table-td">
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {partner.partnerCode}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                          {partner.fullName.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{partner.fullName}</span>
                      </div>
                    </td>
                    <td className="table-td">
                      <div>
                        <p className="text-sm text-foreground">{partner.email}</p>
                        <p className="text-xs text-muted-foreground">{partner.phone}</p>
                      </div>
                    </td>
                    <td className="table-td">
                      <div>
                        <p className="text-sm text-foreground">{partner.city}</p>
                        <p className="text-xs text-muted-foreground">{partner.state}</p>
                      </div>
                    </td>
                    <td className="table-td">
                      <PartnerStatusDropdown
                        partnerId={partner.id}
                        currentStatus={partner.status}
                        onStatusChange={handleStatusChange}
                      />
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-tabular font-semibold text-sm ${
                            partner.walletBalance < 1000 && partner.walletBalance > 0
                              ? 'text-amber-600'
                              : partner.walletBalance === 0
                              ? 'text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          ₹{partner.walletBalance.toLocaleString('en-IN')}
                        </span>
                        {partner.walletBalance > 0 && partner.walletBalance < 1000 && (
                          <Icon name="ExclamationTriangleIcon" size={13} className="text-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="table-td font-tabular font-medium text-foreground">
                      {partner.reportsPulled.toLocaleString('en-IN')}
                    </td>
                    <td className="table-td font-tabular text-foreground">
                      {partner.reportsThisMonth}
                    </td>
                    <td className="table-td text-sm text-muted-foreground">{partner.joinedDate}</td>
                    <td className="table-td text-sm text-muted-foreground">{partner.lastActive}</td>
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <RowActionButtons
                          partner={partner}
                          onDelete={handleDelete}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Showing{' '}
                <span className="font-semibold text-foreground">
                  {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-foreground">{filtered.length}</span> partners
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Per page:</span>
                <select
                  className="text-xs border border-border rounded-md px-2 py-1 bg-white text-foreground focus:outline-none focus:ring-2"
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  aria-label="Items per page"
                >
                  {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                    <option key={`per-page-${n}`} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                aria-label="First page"
              >
                <Icon name="ChevronDoubleLeftIcon" size={14} />
              </button>
              <button
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <Icon name="ChevronLeftIcon" size={14} />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={`page-${page}`}
                    className={`w-8 h-8 rounded-md text-xs font-semibold transition-all duration-150 ${
                      currentPage === page
                        ? 'bg-primary text-white' :'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <Icon name="ChevronRightIcon" size={14} />
              </button>
              <button
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Last page"
              >
                <Icon name="ChevronDoubleRightIcon" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Row Action Buttons — separate to keep table clean
function RowActionButtons({
  partner,
  onDelete,
}: {
  partner: Partner;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-center gap-1">
      {/* View */}
      <button
        className="relative p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-blue-600 transition-all duration-150 group/btn"
        aria-label={`View ${partner.fullName}`}
      >
        <Icon name="EyeIcon" size={15} />
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity z-50">
          View Profile
        </span>
      </button>

      {/* Edit */}
      <button
        className="relative p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 group/btn"
        aria-label={`Edit ${partner.fullName}`}
      >
        <Icon name="PencilSquareIcon" size={15} />
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity z-50">
          Edit Partner
        </span>
      </button>

      {/* Wallet */}
      <button
        className="relative p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-emerald-600 transition-all duration-150 group/btn"
        aria-label={`Add funds to ${partner.fullName}'s wallet`}
      >
        <Icon name="WalletIcon" size={15} />
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity z-50">
          Manage Wallet
        </span>
      </button>

      {/* Delete */}
      {!confirmDelete ? (
        <button
          className="relative p-1.5 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all duration-150 group/btn"
          aria-label={`Remove ${partner.fullName}`}
          onClick={() => setConfirmDelete(true)}
        >
          <Icon name="TrashIcon" size={15} />
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity z-50">
            Remove partner — cannot be undone
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-1 bg-red-50 rounded-md px-1 py-0.5 fade-in">
          <span className="text-xs text-red-600 font-medium ml-1">Remove?</span>
          <button
            className="p-1 rounded text-red-600 hover:bg-red-100 transition-colors"
            onClick={() => onDelete(partner.id)}
            aria-label="Confirm remove"
          >
            <Icon name="CheckIcon" size={13} />
          </button>
          <button
            className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => setConfirmDelete(false)}
            aria-label="Cancel remove"
          >
            <Icon name="XMarkIcon" size={13} />
          </button>
        </div>
      )}
    </div>
  );
}