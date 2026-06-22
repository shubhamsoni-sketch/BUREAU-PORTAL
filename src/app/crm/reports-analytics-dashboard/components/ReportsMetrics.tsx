import MetricCard from '@/crm/components/ui/MetricCard';

export default function ReportsMetrics() {
  // BACKEND: GET /api/reports/summary?period=90d
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <MetricCard
        label="Total Disbursed (90 days)"
        value="₹14.8 Cr"
        subtext="Across 148 applications"
        trend={{ value: '+18.2% vs prev period', positive: true }}
        variant="success"
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      />
      <MetricCard
        label="Overall Conversion Rate"
        value="31.2%"
        subtext="482 leads → 150 disbursals"
        trend={{ value: '+4.8% vs prev period', positive: true }}
        variant="info"
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        }
      />
      <MetricCard
        label="Avg Disbursal TAT"
        value="8.4 days"
        subtext="From application login to disbursal"
        trend={{ value: '-1.2 days vs prev period', positive: true }}
        variant="default"
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        }
      />
    </div>
  );
}
