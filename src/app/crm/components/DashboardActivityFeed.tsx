export default function DashboardActivityFeed() {
  // BACKEND: GET /api/dashboard/activity?limit=8
  const activities = [
    {
      id: 'act-1',
      type: 'disbursal',
      text: 'Home Loan ₹42L disbursed for Ramesh Gupta via HDFC Bank',
      time: '14 min ago',
      color: 'bg-success',
    },
    {
      id: 'act-2',
      type: 'approval',
      text: 'Personal Loan ₹8.5L approved — Neha Kulkarni (Bajaj Finserv)',
      time: '38 min ago',
      color: 'bg-primary',
    },
    {
      id: 'act-3',
      type: 'doc',
      text: 'ITR documents uploaded for Suresh Patel — pending verification',
      time: '1 hr ago',
      color: 'bg-warning',
    },
    {
      id: 'act-4',
      type: 'lead',
      text: 'New lead assigned to Priya Sharma — Sanjay Verma, Business Loan ₹25L',
      time: '2 hr ago',
      color: 'bg-info',
    },
    {
      id: 'act-5',
      type: 'rejection',
      text: 'LAP application rejected — Mohan Das (low CIBIL 612)',
      time: '3 hr ago',
      color: 'bg-danger',
    },
    {
      id: 'act-6',
      type: 'disbursal',
      text: 'Car Loan ₹7.2L disbursed — Anita Singh via Axis Bank',
      time: '4 hr ago',
      color: 'bg-success',
    },
    {
      id: 'act-7',
      type: 'lead',
      text: 'Walk-in lead captured — Deepak Nair, Home Loan ₹55L',
      time: '5 hr ago',
      color: 'bg-info',
    },
    {
      id: 'act-8',
      type: 'approval',
      text: 'Business Loan conditional approval — Ravi Desai (Tata Capital)',
      time: '6 hr ago',
      color: 'bg-primary',
    },
  ];

  return (
    <div className="bg-card rounded-lg border border-border shadow-card h-full">
      <div className="px-4 py-3.5 border-b border-border">
        <h3 className="text-sm font-700 text-foreground">Recent Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Live updates across all agents</p>
      </div>
      <div
        className="divide-y divide-border overflow-y-auto scrollbar-thin"
        style={{ maxHeight: '340px' }}
      >
        {activities?.map((act) => (
          <div
            key={act?.id}
            className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
          >
            <div className={['w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', act?.color]?.join(' ')} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground leading-relaxed">{act?.text}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{act?.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
