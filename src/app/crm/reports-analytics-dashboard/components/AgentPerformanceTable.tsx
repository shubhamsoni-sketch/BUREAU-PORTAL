'use client';

import { useEffect, useMemo, useState } from 'react';
import { crmFetch } from '@/lib/crm/api';

type CrmLead = {
  assignedAgent?: string;
  stage?: string;
};

type CrmApplication = {
  customerName?: string;
  status?: string;
  loanAmount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type CrmTeamMember = {
  id?: string;
  name?: string;
  zone?: string;
};

type AnalyticsStore = {
  leads?: CrmLead[];
  applications?: CrmApplication[];
  team?: CrmTeamMember[];
};

const formatAmount = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

const stageSet = (stages: string[]) => new Set(stages);
const contactedStages = stageSet([
  'contacted',
  'eligibility_pending',
  'eligibility_done',
  'submitted_to_lender',
  'sanctioned',
  'rejected',
  'disbursed',
]);
const loggedInStages = stageSet(['submitted_to_lender', 'sanctioned', 'rejected', 'disbursed']);

export default function AgentPerformanceTable() {
  const [store, setStore] = useState<AnalyticsStore>({});

  useEffect(() => {
    let cancelled = false;
    crmFetch('/api/crm/eligibility-check', { cache: 'no-store' })
      .then((response) => response.json())
      .then((json) => {
        if (!cancelled && json?.success) setStore(json.data || {});
      })
      .catch(() => {
        if (!cancelled) setStore({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const agents = useMemo(() => {
    const leads = Array.isArray(store.leads) ? store.leads : [];
    const applications = Array.isArray(store.applications) ? store.applications : [];
    const team = Array.isArray(store.team) ? store.team : [];
    const names = new Set<string>();
    team.forEach((member) => {
      if (member.name) names.add(member.name);
    });
    leads.forEach((lead) => {
      if (lead.assignedAgent && lead.assignedAgent !== 'Unassigned') names.add(lead.assignedAgent);
    });

    return Array.from(names)
      .map((name) => {
        const agentLeads = leads.filter((lead) => lead.assignedAgent === name);
        const leadNames = new Set(agentLeads.map((lead: any) => String(lead.name || '').toLowerCase()));
        const agentApplications = applications.filter((application) =>
          leadNames.has(String(application.customerName || '').toLowerCase())
        );
        const disbursed = agentApplications.filter((application) => application.status === 'disbursed');
        const rejected = agentApplications.filter((application) => application.status === 'rejected');
        const totalAmount = disbursed.reduce(
          (sum, application) => sum + Number(application.loanAmount || 0),
          0
        );
        const member = team.find((item) => item.name === name);
        return {
          id: member?.id || name,
          name,
          branch: member?.zone || '-',
          leadsAssigned: agentLeads.length,
          contacted: agentLeads.filter((lead) => contactedStages.has(String(lead.stage || ''))).length,
          loggedIn: agentLeads.filter((lead) => loggedInStages.has(String(lead.stage || ''))).length,
          disbursed: disbursed.length,
          rejected: rejected.length,
          conversionRate: agentLeads.length
            ? `${Math.round((disbursed.length / agentLeads.length) * 1000) / 10}%`
            : '0%',
          totalAmount: formatAmount(totalAmount),
        };
      })
      .sort((a, b) => b.leadsAssigned - a.leadsAssigned);
  }, [store]);

  return (
    <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-700 text-foreground">Agent Performance Report</h3>
        <span className="text-xs text-muted-foreground">Live CRM data</span>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-[850px]">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              {[
                'Agent',
                'Branch',
                'Leads',
                'Contacted',
                'Logged In',
                'Disbursed',
                'Rejected',
                'Conversion',
                'Total Amount',
              ].map((col) => (
                <th
                  key={`rpt-col-${col}`}
                  className="px-4 py-2.5 text-left text-[11px] font-600 uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {agents.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No agent activity found
                </td>
              </tr>
            ) : (
              agents.map((agent, i) => (
                <tr key={agent.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-700 shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-xs font-700 text-foreground whitespace-nowrap">
                        {agent.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {agent.branch}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-600 text-foreground tabular-nums">
                    {agent.leadsAssigned}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                    {agent.contacted}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                    {agent.loggedIn}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-700 text-success tabular-nums">
                    {agent.disbursed}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-600 text-danger tabular-nums">
                    {agent.rejected}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={[
                        'text-xs font-700 tabular-nums',
                        parseFloat(agent.conversionRate) >= 35
                          ? 'text-success'
                          : parseFloat(agent.conversionRate) >= 25
                            ? 'text-warning'
                            : 'text-danger',
                      ].join(' ')}
                    >
                      {agent.conversionRate}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-700 text-foreground">
                    {agent.totalAmount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
