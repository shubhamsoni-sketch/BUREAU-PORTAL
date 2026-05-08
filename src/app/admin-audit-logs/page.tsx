'use client';

import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAdmin, AuditLog } from '@/context/AdminContext';
import { Search, Shield, User } from 'lucide-react';

const ACTION_COLORS: Record<AuditLog['action'], string> = {
  'Login': 'bg-blue-100 text-blue-700',
  'CIBIL Pull': 'bg-purple-100 text-purple-700',
  'Wallet Recharge': 'bg-emerald-100 text-emerald-700',
  'Partner Approval': 'bg-teal-100 text-teal-700',
  'Partner Rejection': 'bg-red-100 text-red-600',
  'Partner Deactivation': 'bg-amber-100 text-amber-700',
};

const ACTION_FILTERS = ['All', 'Login', 'CIBIL Pull', 'Wallet Recharge', 'Partner Approval', 'Partner Rejection', 'Partner Deactivation'] as const;

export default function AdminAuditLogsPage() {
  const { auditLogs } = useAdmin();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<typeof ACTION_FILTERS[number]>('All');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Partner'>('All');

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch = !search || log.actor.toLowerCase().includes(search.toLowerCase()) || log.target.toLowerCase().includes(search.toLowerCase()) || log.details.toLowerCase().includes(search.toLowerCase());
      const matchAction = actionFilter === 'All' || log.action === actionFilter;
      const matchRole = roleFilter === 'All' || log.actorRole === roleFilter;
      return matchSearch && matchAction && matchRole;
    });
  }, [auditLogs, search, actionFilter, roleFilter]);

  return (
    <AdminLayout title="Audit Logs">
      <div className="p-6 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: auditLogs.length },
            { label: 'Logins', value: auditLogs.filter((l) => l.action === 'Login').length },
            { label: 'CIBIL Pulls', value: auditLogs.filter((l) => l.action === 'CIBIL Pull').length },
            { label: 'Partner Actions', value: auditLogs.filter((l) => l.action.startsWith('Partner')).length },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search actor, target, details..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div className="flex gap-2">
              {(['All', 'Admin', 'Partner'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${roleFilter === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ACTION_FILTERS.map((a) => (
              <button
                key={a}
                onClick={() => setActionFilter(a)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${actionFilter === a ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Log Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Timestamp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Target</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action]}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {log.actorRole === 'Admin' ? (
                          <Shield size={12} className="text-blue-500 flex-shrink-0" />
                        ) : (
                          <User size={12} className="text-slate-400 flex-shrink-0" />
                        )}
                        <span className="text-slate-700 font-medium">{log.actor}</span>
                        <span className="text-xs text-slate-400">({log.actorRole})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs max-w-[160px] truncate">{log.target}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[240px] truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">No audit logs found</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
