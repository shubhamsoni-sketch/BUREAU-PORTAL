export default function TopAgentsTable() {
  // BACKEND: GET /api/dashboard/top-agents?period=current_month
  const agents = [
    {
      id: 'agent-001',
      name: 'Priya Sharma',
      branch: 'Mumbai Central',
      leads: 42,
      disbursed: 18,
      amount: '₹92.4L',
      conversion: '42.8%',
      incentive: '₹18,240',
      trend: 'up',
    },
    {
      id: 'agent-002',
      name: 'Anil Mehta',
      branch: 'Pune West',
      leads: 38,
      disbursed: 14,
      amount: '₹74.1L',
      conversion: '36.8%',
      incentive: '₹14,820',
      trend: 'up',
    },
    {
      id: 'agent-003',
      name: 'Sunita Rao',
      branch: 'Bangalore HSR',
      leads: 31,
      disbursed: 11,
      amount: '₹63.8L',
      conversion: '35.5%',
      incentive: '₹12,760',
      trend: 'down',
    },
    {
      id: 'agent-004',
      name: 'Vikram Joshi',
      branch: 'Delhi NCR',
      leads: 28,
      disbursed: 9,
      amount: '₹48.2L',
      conversion: '32.1%',
      incentive: '₹9,640',
      trend: 'up',
    },
    {
      id: 'agent-005',
      name: 'Kavitha Nair',
      branch: 'Chennai Adyar',
      leads: 24,
      disbursed: 7,
      amount: '₹38.6L',
      conversion: '29.2%',
      incentive: '₹7,720',
      trend: 'down',
    },
  ];

  return (
    <div className="bg-card rounded-lg border border-border shadow-card">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-700 text-foreground">Top Performing Agents — June 2026</h3>
        <button className="text-xs text-primary font-600 hover:underline">View all agents</button>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              {['Agent', 'Branch', 'Leads', 'Disbursed', 'Amount', 'Conversion', 'Incentive']?.map(
                (col) => (
                  <th
                    key={`col-${col}`}
                    className="px-4 py-2.5 text-left text-[11px] font-600 uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                  >
                    {col}
                  </th>
                )
              )}
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
                    <span className="font-600 text-foreground text-xs whitespace-nowrap">
                      {agent?.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {agent?.branch}
                </td>
                <td className="px-4 py-2.5 text-xs font-600 text-foreground tabular-nums">
                  {agent?.leads}
                </td>
                <td className="px-4 py-2.5 text-xs font-600 text-foreground tabular-nums">
                  {agent?.disbursed}
                </td>
                <td className="px-4 py-2.5 text-xs font-700 text-foreground inr-value">
                  {agent?.amount}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={[
                      'text-xs font-700 tabular-nums',
                      parseFloat(agent?.conversion) >= 35
                        ? 'text-success'
                        : parseFloat(agent?.conversion) >= 30
                          ? 'text-warning'
                          : 'text-danger',
                    ]?.join(' ')}
                  >
                    {agent?.conversion}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs font-600 text-accent inr-value">
                  {agent?.incentive}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
