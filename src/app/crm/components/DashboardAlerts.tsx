const alerts = [
  {
    id: 'alert-1',
    title: 'Lender SLA Breach',
    text: '3 files are pending beyond 7 days',
    action: 'Open Files',
    tone: 'border-red-200 bg-red-50 text-red-700',
  },
  {
    id: 'alert-2',
    title: 'Follow-up Gap',
    text: '12 leads have no next activity',
    action: 'Review Leads',
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  {
    id: 'alert-3',
    title: 'Eligibility Queue',
    text: '41 leads ready for bureau checks',
    action: 'Run Checks',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
  },
];

export default function DashboardAlerts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-lg border ${alert.tone} px-4 py-3 flex items-center justify-between gap-3 shadow-sm`}
        >
          <div className="min-w-0">
            <p className="text-xs font-900 text-foreground">{alert.title}</p>
            <p className="text-xs font-600 opacity-80 mt-0.5 truncate">{alert.text}</p>
          </div>
          <button className="h-7 shrink-0 rounded-sm bg-white/80 px-2.5 text-[10px] font-900 shadow-sm hover:bg-white transition-colors">
            {alert.action}
          </button>
        </div>
      ))}
    </div>
  );
}
