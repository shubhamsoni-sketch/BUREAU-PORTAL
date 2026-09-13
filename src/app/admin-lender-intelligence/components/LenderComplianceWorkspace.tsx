'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';
import { useAuth } from '@/context/AuthContext';
import {
  hasLenderIntelligenceClientPermission,
  lenderIntelligenceBackPath,
} from '@/lib/lender-intelligence/client-access';

type Issue = {
  id: string;
  severity: string;
  status: string;
  title: string;
  detail: string;
  due_at: string | null;
  owner_user_id: string | null;
};
type Document = {
  id: string;
  document_type: string;
  file_name: string;
  review_status: string;
  expires_at: string | null;
};
type ScanRun = {
  id: string;
  readiness_issue_count: number;
  partner_payable_issue_count: number;
  total_issue_count: number;
  started_at: string;
  completed_at: string;
};
type AuditRecord = {
  id: string;
  actor_user_id: string | null;
  module: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
};

const button =
  'rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50';

export default function LenderComplianceWorkspace() {
  const { user } = useAuth();
  const canManageCompliance = hasLenderIntelligenceClientPermission(user, 'compliance.manage');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [scanRuns, setScanRuns] = useState<ScanRun[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authFetch('/api/admin-lender-intelligence/compliance', {
        cache: 'no-store',
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success)
        throw new Error(body.error || 'Unable to load compliance evidence');
      setIssues(body.data.dataQualityIssues || []);
      setDocuments(body.data.documents || []);
      setScanRuns(body.data.scanRuns || []);
      setAuditLogs(body.data.auditLogs || []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Unable to load compliance evidence'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const criticalOpen = useMemo(
    () =>
      issues.filter(
        (item) => item.severity === 'critical' && !['resolved', 'accepted'].includes(item.status)
      ).length,
    [issues]
  );
  const latestScan = scanRuns[0] || null;

  const manageIssue = async (issue: Issue, action: 'claim' | 'resolve' | 'accept' | 'reopen') => {
    if (!canManageCompliance) {
      setError('This action requires the compliance.manage permission.');
      return;
    }
    const needsEvidence = action !== 'claim';
    const note = needsEvidence
      ? window.prompt(`${action.replace(/_/g, ' ')} evidence:`)?.trim() || ''
      : '';
    if (needsEvidence && note.length < (action === 'accept' ? 15 : 5)) {
      setError(
        action === 'accept'
          ? 'Risk acceptance requires detailed evidence.'
          : 'Provide lifecycle evidence.'
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await authFetch('/api/admin-lender-intelligence/catalog', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'manage_data_quality_issue',
          issueId: issue.id,
          issueAction: action,
          note,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || 'Issue update failed');
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Issue update failed');
    } finally {
      setBusy(false);
    }
  };

  const openDocument = async (document: Document) => {
    const viewer = window.open('', '_blank');
    if (!viewer) {
      setError('Allow pop-ups for this portal to open private documents.');
      return;
    }
    viewer.opener = null;
    setBusy(true);
    setError('');
    try {
      const response = await authFetch(
        `/api/admin-lender-intelligence/documents?id=${encodeURIComponent(document.id)}`,
        { cache: 'no-store' }
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || 'Document access denied');
      viewer.location.replace(body.data.signedUrl);
    } catch (documentError) {
      viewer.close();
      setError(documentError instanceof Error ? documentError.message : 'Document access denied');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout title="Lender Compliance">
      <div className="space-y-5 p-6">
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href={lenderIntelligenceBackPath(user)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
            >
              <ArrowLeft size={14} />{' '}
              {lenderIntelligenceBackPath(user) === '/admin-lender-intelligence'
                ? 'Intelligence overview'
                : 'Admin dashboard'}
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Compliance evidence</h1>
            <p className="mt-1 text-sm text-slate-500">
              Scoped issue custody, private documents, and scheduler-run evidence without finance or
              catalog access.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || busy}
            className={button}
          >
            <RefreshCw size={14} className={loading ? 'mr-1 inline animate-spin' : 'mr-1 inline'} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {!canManageCompliance && (
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-700">
            <ShieldCheck size={16} />
            Read-only compliance access. Evidence and private documents remain available, but issue
            custody changes require the compliance.manage permission.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase text-slate-500">Open issues</p>
            <p className="mt-2 text-2xl font-bold">
              {issues.filter((item) => !['resolved', 'accepted'].includes(item.status)).length}
            </p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="text-xs font-semibold uppercase text-red-600">Critical open</p>
            <p className="mt-2 text-2xl font-bold text-red-700">{criticalOpen}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase text-slate-500">Last scheduled scan</p>
            <p className="mt-2 font-bold">
              {latestScan
                ? new Date(latestScan.completed_at).toLocaleString('en-IN')
                : 'No run evidence'}
            </p>
            <p className="text-xs text-slate-500">
              {latestScan
                ? `${latestScan.total_issue_count} refreshed · ${latestScan.readiness_issue_count} readiness · ${latestScan.partner_payable_issue_count} payables`
                : 'Run the protected scheduler after deployment.'}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold">Compliance issue queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Issue</th>
                  <th className="px-4 py-3 text-left">Severity</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Due</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map((issue) => (
                  <tr key={issue.id}>
                    <td className="max-w-xl px-4 py-3">
                      <p className="font-semibold">{issue.title}</p>
                      <p className="truncate text-xs text-slate-500">{issue.detail}</p>
                    </td>
                    <td className="px-4 py-3">{issue.severity}</td>
                    <td className="px-4 py-3">{issue.status.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      {issue.due_at ? new Date(issue.due_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {issue.status === 'open' && (
                          <button
                            className={button}
                            disabled={busy || !canManageCompliance}
                            onClick={() => void manageIssue(issue, 'claim')}
                          >
                            Claim
                          </button>
                        )}
                        {['open', 'in_progress'].includes(issue.status) && (
                          <>
                            <button
                              className={button}
                              disabled={busy || !canManageCompliance}
                              onClick={() => void manageIssue(issue, 'resolve')}
                            >
                              Resolve
                            </button>
                            <button
                              className={button}
                              disabled={busy || !canManageCompliance}
                              onClick={() => void manageIssue(issue, 'accept')}
                            >
                              Accept risk
                            </button>
                          </>
                        )}
                        {['resolved', 'accepted'].includes(issue.status) && (
                          <button
                            className={button}
                            disabled={busy || !canManageCompliance}
                            onClick={() => void manageIssue(issue, 'reopen')}
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && !issues.length && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No compliance issues.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold">Private document register</h2>
          </div>
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between rounded-md border border-slate-200 p-3"
              >
                <div>
                  <p className="font-semibold">{document.file_name}</p>
                  <p className="text-xs text-slate-500">
                    {document.document_type} · {document.review_status}
                    {document.expires_at
                      ? ` · expires ${new Date(document.expires_at).toLocaleDateString('en-IN')}`
                      : ''}
                  </p>
                </div>
                <button
                  className={button}
                  disabled={busy}
                  onClick={() => void openDocument(document)}
                >
                  <ExternalLink size={13} className="mr-1 inline" />
                  Open
                </button>
              </div>
            ))}
            {!loading && !documents.length && (
              <p className="text-sm text-slate-500">No documents registered.</p>
            )}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold">Scheduled scan history</h2>
              <p className="text-xs text-slate-500">Latest 50 atomic compliance runs.</p>
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Completed</th>
                    <th className="px-4 py-3 text-right">Readiness</th>
                    <th className="px-4 py-3 text-right">Payables</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scanRuns.map((run) => (
                    <tr key={run.id}>
                      <td className="px-4 py-3">
                        <p>{new Date(run.completed_at).toLocaleString('en-IN')}</p>
                        <p className="font-mono text-[10px] text-slate-400">{run.id}</p>
                      </td>
                      <td className="px-4 py-3 text-right">{run.readiness_issue_count}</td>
                      <td className="px-4 py-3 text-right">{run.partner_payable_issue_count}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {run.total_issue_count}
                      </td>
                    </tr>
                  ))}
                  {!loading && !scanRuns.length && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500">
                        No scheduled run evidence.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold">Minimized audit register</h2>
              <p className="text-xs text-slate-500">
                Stable actor and entity attribution without email or narrative.
              </p>
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Event</th>
                    <th className="px-4 py-3 text-left">Entity</th>
                    <th className="px-4 py-3 text-left">Actor</th>
                    <th className="px-4 py-3 text-left">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{record.action.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-slate-500">{record.module}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{record.entity_type.replace(/_/g, ' ')}</p>
                        <p className="max-w-36 truncate font-mono text-[10px] text-slate-400">
                          {record.entity_id || '—'}
                        </p>
                      </td>
                      <td className="max-w-36 truncate px-4 py-3 font-mono text-[10px]">
                        {record.actor_user_id || 'system'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(record.created_at).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {!loading && !auditLogs.length && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500">
                        No audit evidence.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <ShieldCheck size={17} className="mr-2 inline" />
          Document access is five-minute signed and audited. Scan evidence and issue history remain
          database governed.
        </div>
      </div>
    </AdminLayout>
  );
}
