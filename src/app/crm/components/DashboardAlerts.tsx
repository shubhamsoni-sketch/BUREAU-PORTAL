export default function DashboardAlerts() {
  const alerts = [
    {
      id: 'alert-1',
      type: 'danger',
      text: '3 loan applications have been pending at lender for 7+ days — SLA breach risk',
      action: 'View Applications',
    },
    {
      id: 'alert-2',
      type: 'warning',
      text: '12 leads have no follow-up scheduled — last contact was 5+ days ago',
      action: 'Review Leads',
    },
  ];

  return (
    <div className="space-y-2 mb-5">
      {alerts?.map((alert) => (
        <div
          key={alert?.id}
          className={[
            'flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border text-sm font-medium',
            alert?.type === 'danger'
              ? 'bg-danger-bg border-danger/20 text-danger'
              : 'bg-warning-bg border-warning/20 text-warning',
          ]?.join(' ')}
        >
          <div className="flex items-center gap-2">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{alert?.text}</span>
          </div>
          <button
            className={[
              'shrink-0 text-xs font-700 underline underline-offset-2',
              alert?.type === 'danger' ? 'text-danger' : 'text-warning',
            ]?.join(' ')}
          >
            {alert?.action}
          </button>
        </div>
      ))}
    </div>
  );
}
