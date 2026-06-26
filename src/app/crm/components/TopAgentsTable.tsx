'use client';

import { useEffect, useMemo, useState } from 'react';
import { crmFetch } from '@/lib/crm/api';

type Lead = {
  assignedAgent?: string;
  stage?: string;
  city?: string;
};

type Application = {
  customerName?: string;
  status?: string;
  lenderName?: string;
  loanAmount?: number;
};

type Store = {
  leads?: Lead[];
  applications?: Application[];
};

const fallbackAgents = [
  ['Priya Sharma', 'Mumbai Central', 42, 31, 18, 43, 'Eligibility queue', '7 callbacks due', 'On track', 'bg-emerald-500'],
  ['Anil Mehta', 'Pune West', 38, 26, 14, 37, 'File process', '3 docs pending', 'Needs follow-up', 'bg-amber-500'],
  ['Sunita Rao', 'Bangalore HSR', 31, 22, 11, 36, 'Lender selection', '5 lender responses', 'On track', 'bg-blue-500'],
  ['Vikram Joshi', 'Delhi NCR', 28, 19, 9, 32, 'Login pending', '2 urgent files', 'Attention', 'bg-red-500'],
] as const;

export default function TopAgentsTable() {
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    let active = true;
    crmFetch('/api/crm/eligibility-check', { cache: 'no-store' })
      .then((response) => response.json())
      .then((json) => {
        if (active && json?.success) setStore(json.data || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const agents = useMemo(() => {
    if (!store) return fallbackAgents;
    const leads = store.leads || [];
    const applications = store.applications || [];
    const grouped = new Map<string, Lead[]>();

    for (const lead of leads) {
      const agent = lead.assignedAgent || 'Unassigned';
      grouped.set(agent, [...(grouped.get(agent) || []), lead]);
    }

    const rows = Array.from(grouped.entries()).map(([agent, agentLeads]) => {
      const eligibility = agentLeads.filter((lead) =>
        ['eligibility_done', 'submitted_to_lender', 'sanctioned', 'disbursed'].includes(String(lead.stage || ''))
      ).length;
      const files = agentLeads.filter((lead) =>
        ['submitted_to_lender', 'sanctioned', 'disbursed'].includes(String(lead.stage || ''))
      ).length;
      const conversion = agentLeads.length ? Math.round((files / agentLeads.length) * 100) : 0;
      const pending = agentLeads.filter((lead) =>
        ['new', 'contacted', 'eligibility_pending'].includes(String(lead.stage || ''))
      ).length;
      const currentStage = pending ? 'Eligibility queue' : files ? 'File process' : 'Lead nurture';
      const activeTask = pending
        ? `${pending} checks pending`
        : applications.length
          ? `${applications.length} files in system`
          : 'No urgent task';
      const status = pending > 5 ? 'Attention' : pending > 0 ? 'Needs follow-up' : 'On track';
      const tone = pending > 5 ? 'bg-red-500' : pending > 0 ? 'bg-amber-500' : 'bg-emerald-500';
      const branch = agentLeads.find((lead) => lead.city)?.city || 'Assigned zone';
      return [agent, branch, agentLeads.length, eligibility, files, conversion, currentStage, activeTask, status, tone] as const;
    });

    return rows.length ? rows.sort((a, b) => Number(b[2]) - Number(a[2])).slice(0, 6) : fallbackAgents;
  }, [store]);

  const summary = useMemo(() => {
    if (!store) return [
      ['Active agents', '12'],
      ['Leads assigned today', '64'],
      ['Eligibility pending', '41'],
      ['Follow-ups due', '17'],
    ];
    const leads = store.leads || [];
    const pending = leads.filter((lead) =>
      ['new', 'contacted', 'eligibility_pending'].includes(String(lead.stage || ''))
    ).length;
    return [
      ['Active agents', String(agents.length)],
      ['Total assigned leads', String(leads.length)],
      ['Eligibility pending', String(pending)],
      ['Files in process', String((store.applications || []).length)],
    ];
  }, [agents.length, store]);

  return (
    <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-[linear-gradient(135deg,rgba(124,58,237,0.08),rgba(37,99,235,0.06))]">
        <div>
          <h3 className="text-sm font-800 text-foreground">Agent Workboard</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Agent-wise workload, checks, files, and follow-ups</p>
        </div>
        <button className="h-7 rounded-sm border border-border bg-card px-2.5 text-[10px] font-800 text-primary hover:bg-muted transition-colors">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Agent', 'Current Work', 'Leads', 'Eligibility', 'Files', 'Conversion', 'Status'].map((head) => (
                <th
                  key={head}
                  className="px-4 py-3 text-left text-[10px] font-800 uppercase tracking-wide text-muted-foreground"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {agents.map(([name, branch, leads, eligibility, files, conversion, currentStage, activeTask, status, tone], index) => (
              <tr key={`${name}-${index}`} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-sm bg-primary text-primary-foreground flex items-center justify-center text-xs font-900 shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-800 text-foreground truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">{branch}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-800 text-foreground">{currentStage}</p>
                  <p className="text-xs text-muted-foreground">{activeTask}</p>
                </td>
                <td className="px-4 py-3.5 text-sm font-900 text-foreground tabular-nums">{leads}</td>
                <td className="px-4 py-3.5 text-sm font-900 text-foreground tabular-nums">{eligibility}</td>
                <td className="px-4 py-3.5 text-sm font-900 text-foreground tabular-nums">{files}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${conversion}%` }} />
                    </div>
                    <span className="text-xs font-900 text-primary tabular-nums">{conversion}%</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1 text-[10px] font-800 text-foreground">
                    <span className={`h-2 w-2 rounded-full ${tone}`} />
                    {status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-border bg-muted/20 p-4">
        {summary.map(([label, value]) => (
          <div key={label} className="rounded-sm border border-border bg-card px-3 py-2">
            <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-lg font-900 text-foreground tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
