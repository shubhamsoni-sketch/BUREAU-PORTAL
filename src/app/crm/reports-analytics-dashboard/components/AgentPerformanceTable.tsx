export default function AgentPerformanceTable() {
  // BACKEND: GET /api/reports/agent-performance?period=90d
  const agents = [
    {
      id: 'rpt-agent-001',
      name: 'Priya Sharma',
      branch: 'Mumbai Central',
      leadsAssigned: 128,
      contacted: 104,
      loggedIn: 52,
      disbursed: 48,
      rejected: 14,
      conversionRate: '37.5%',
      totalAmount: '₹2.84 Cr',
      avgTat: '7.2 days',
      incentive: '₹56,800',
      csat: 4.8,
    },
    {
      id: 'rpt-agent-002',
      name: 'Anil Mehta',
      branch: 'Pune West',
      leadsAssigned: 112,
      contacted: 89,
      loggedIn: 43,
      disbursed: 39,
      rejected: 11,
      conversionRate: '34.8%',
      totalAmount: '₹2.18 Cr',
      avgTat: '8.1 days',
      incentive: '₹43,600',
      csat: 4.6,
    },
    {
      id: 'rpt-agent-003',
      name: 'Sunita Rao',
      branch: 'Bangalore HSR',
      leadsAssigned: 94,
      contacted: 76,
      loggedIn: 34,
      disbursed: 29,
      rejected: 9,
      conversionRate: '30.9%',
      totalAmount: '₹1.76 Cr',
      avgTat: '9.4 days',
      incentive: '₹35,200',
      csat: 4.4,
    },
    {
      id: 'rpt-agent-004',
      name: 'Vikram Joshi',
      branch: 'Delhi NCR',
      leadsAssigned: 88,
      contacted: 71,
      loggedIn: 28,
      disbursed: 22,
      rejected: 8,
      conversionRate: '25.0%',
      totalAmount: '₹1.32 Cr',
      avgTat: '10.2 days',
      incentive: '₹26,400',
      csat: 4.2,
    },
    {
      id: 'rpt-agent-005',
      name: 'Kavitha Nair',
      branch: 'Chennai Adyar',
      leadsAssigned: 76,
      contacted: 60,
      loggedIn: 21,
      disbursed: 18,
      rejected: 6,
      conversionRate: '23.7%',
      totalAmount: '₹0.98 Cr',
      avgTat: '11.1 days',
      incentive: '₹19,600',
      csat: 4.3,
    },
    {
      id: 'rpt-agent-006',
      name: 'Rohit Gupta',
      branch: 'Hyderabad Banjara',
      leadsAssigned: 64,
      contacted: 48,
      loggedIn: 16,
      disbursed: 12,
      rejected: 5,
      conversionRate: '18.8%',
      totalAmount: '₹0.68 Cr',
      avgTat: '12.4 days',
      incentive: '₹13,600',
      csat: 4.0,
    },
  ];

  return (
    <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-700 text-foreground">
          Agent Performance Report — Last 90 Days
        </h3>
        <button className="text-xs text-primary font-600 hover:underline">Export CSV</button>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-[1000px]">
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
                'Avg TAT',
                'Incentive',
                'CSAT',
              ]?.map((col) => (
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
            {agents?.map((agent, i) => (
              <tr key={agent?.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-700 shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-xs font-700 text-foreground whitespace-nowrap">
                      {agent?.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {agent?.branch}
                </td>
                <td className="px-4 py-2.5 text-xs font-600 text-foreground tabular-nums">
                  {agent?.leadsAssigned}
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                  {agent?.contacted}
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                  {agent?.loggedIn}
                </td>
                <td className="px-4 py-2.5 text-xs font-700 text-success tabular-nums">
                  {agent?.disbursed}
                </td>
                <td className="px-4 py-2.5 text-xs font-600 text-danger tabular-nums">
                  {agent?.rejected}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={[
                      'text-xs font-700 tabular-nums',
                      parseFloat(agent?.conversionRate) >= 35
                        ? 'text-success'
                        : parseFloat(agent?.conversionRate) >= 25
                          ? 'text-warning' :'text-danger',
                    ]?.join(' ')}
                  >
                    {agent?.conversionRate}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs font-700 text-foreground inr-value">
                  {agent?.totalAmount}
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {agent?.avgTat}
                </td>
                <td className="px-4 py-2.5 text-xs font-700 text-accent inr-value">
                  {agent?.incentive}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="var(--accent)"
                      stroke="none"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span className="text-xs font-700 text-foreground tabular-nums">
                      {agent?.csat}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
