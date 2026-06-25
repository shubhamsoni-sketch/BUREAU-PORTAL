const agents = [
  {
    id: 'agent-001',
    name: 'Priya Sharma',
    branch: 'Mumbai Central',
    leads: 42,
    eligibility: 31,
    files: 18,
    conversion: 43,
    activeTask: '7 callbacks due',
    currentStage: 'Eligibility queue',
    status: 'On track',
    tone: 'bg-emerald-500',
  },
  {
    id: 'agent-002',
    name: 'Anil Mehta',
    branch: 'Pune West',
    leads: 38,
    eligibility: 26,
    files: 14,
    conversion: 37,
    activeTask: '3 docs pending',
    currentStage: 'File process',
    status: 'Needs follow-up',
    tone: 'bg-amber-500',
  },
  {
    id: 'agent-003',
    name: 'Sunita Rao',
    branch: 'Bangalore HSR',
    leads: 31,
    eligibility: 22,
    files: 11,
    conversion: 36,
    activeTask: '5 lender responses',
    currentStage: 'Lender selection',
    status: 'On track',
    tone: 'bg-blue-500',
  },
  {
    id: 'agent-004',
    name: 'Vikram Joshi',
    branch: 'Delhi NCR',
    leads: 28,
    eligibility: 19,
    files: 9,
    conversion: 32,
    activeTask: '2 urgent files',
    currentStage: 'Login pending',
    status: 'Attention',
    tone: 'bg-red-500',
  },
];

export default function TopAgentsTable() {
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
            {agents.map((agent, index) => (
              <tr key={agent.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-sm bg-primary text-primary-foreground flex items-center justify-center text-xs font-900 shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-800 text-foreground truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.branch}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-800 text-foreground">{agent.currentStage}</p>
                  <p className="text-xs text-muted-foreground">{agent.activeTask}</p>
                </td>
                <td className="px-4 py-3.5 text-sm font-900 text-foreground tabular-nums">{agent.leads}</td>
                <td className="px-4 py-3.5 text-sm font-900 text-foreground tabular-nums">{agent.eligibility}</td>
                <td className="px-4 py-3.5 text-sm font-900 text-foreground tabular-nums">{agent.files}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${agent.conversion}%` }} />
                    </div>
                    <span className="text-xs font-900 text-primary tabular-nums">{agent.conversion}%</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1 text-[10px] font-800 text-foreground">
                    <span className={`h-2 w-2 rounded-full ${agent.tone}`} />
                    {agent.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-border bg-muted/20 p-4">
        {[
          ['Active agents', '12'],
          ['Leads assigned today', '64'],
          ['Eligibility pending', '41'],
          ['Follow-ups due', '17'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-sm border border-border bg-card px-3 py-2">
            <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-lg font-900 text-foreground tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
