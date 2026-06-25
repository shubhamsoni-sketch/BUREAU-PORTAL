const agents = [
  {
    id: 'agent-001',
    name: 'Priya Sharma',
    branch: 'Mumbai Central',
    leads: 42,
    disbursed: 18,
    amount: '₹92.4L',
    conversion: 43,
    badge: 'Top',
  },
  {
    id: 'agent-002',
    name: 'Anil Mehta',
    branch: 'Pune West',
    leads: 38,
    disbursed: 14,
    amount: '₹74.1L',
    conversion: 37,
    badge: 'Fast',
  },
  {
    id: 'agent-003',
    name: 'Sunita Rao',
    branch: 'Bangalore HSR',
    leads: 31,
    disbursed: 11,
    amount: '₹63.8L',
    conversion: 36,
    badge: 'Steady',
  },
  {
    id: 'agent-004',
    name: 'Vikram Joshi',
    branch: 'Delhi NCR',
    leads: 28,
    disbursed: 9,
    amount: '₹48.2L',
    conversion: 32,
    badge: 'Rising',
  },
];

export default function TopAgentsTable() {
  return (
    <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-[linear-gradient(135deg,rgba(124,58,237,0.08),rgba(37,99,235,0.06))]">
        <div>
          <h3 className="text-sm font-800 text-foreground">Agent Scoreboard</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Top performers this month</p>
        </div>
        <button className="h-7 rounded-sm border border-border bg-card px-2.5 text-[10px] font-800 text-primary hover:bg-muted transition-colors">
          View All
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-4">
        {agents.map((agent, index) => (
          <div key={agent.id} className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-sm bg-primary text-primary-foreground flex items-center justify-center text-xs font-900 shrink-0">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-800 text-foreground truncate">{agent.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{agent.branch}</p>
                </div>
              </div>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-800 text-success">
                {agent.badge}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div>
                <p className="text-[10px] text-muted-foreground">Leads</p>
                <p className="text-sm font-900 text-foreground">{agent.leads}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Disbursed</p>
                <p className="text-sm font-900 text-foreground">{agent.disbursed}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Amount</p>
                <p className="text-sm font-900 text-foreground">{agent.amount}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] font-800 mb-1">
                <span className="text-muted-foreground">Conversion</span>
                <span className="text-primary">{agent.conversion}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${agent.conversion}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
