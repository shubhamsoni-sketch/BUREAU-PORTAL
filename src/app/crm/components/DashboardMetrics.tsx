import MetricCard from '@/crm/components/ui/MetricCard';

export default function DashboardMetrics() {
  // BACKEND: GET /api/dashboard/metrics?period=current_month
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mb-5">
      {/* Hero card spanning 2 cols */}
      <div className="sm:col-span-2">
        <MetricCard
          label="MTD Disbursed Amount"
          value="₹4.82 Cr"
          subtext="Target: ₹6.00 Cr — 80.3% achieved"
          trend={{ value: '+12.4% vs last month', positive: true }}
          variant="success"
          className="h-full"
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
        >
          <div className="mt-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Monthly progress</span>
              <span className="font-600 text-success">80.3%</span>
            </div>
            <div className="h-1.5 rounded-full bg-success/20 overflow-hidden">
              <div className="h-full rounded-full bg-success" style={{ width: '80.3%' }} />
            </div>
          </div>
        </MetricCard>
      </div>

      <MetricCard
        label="Active Pipeline Value"
        value="₹12.4 Cr"
        subtext="48 applications in progress"
        trend={{ value: '+8 this week', positive: true }}
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
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        }
      />

      <MetricCard
        label="Pending Follow-ups"
        value="37"
        subtext="12 overdue by 2+ days"
        variant="alert"
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

      <MetricCard
        label="Stuck Applications"
        value="9"
        subtext="No update for 5+ days"
        variant="warning"
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
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        }
      />

      <MetricCard
        label="Docs Pending Verification"
        value="23"
        subtext="Across 15 applications"
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        }
      />

      <MetricCard
        label="Incentive Payable"
        value="₹3.18 L"
        subtext="To 18 agents this cycle"
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
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        }
      />

      <MetricCard
        label="Lead Conversion Rate"
        value="28.4%"
        subtext="182 leads → 52 disbursals (MTD)"
        trend={{ value: '+3.1% vs last month', positive: true }}
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
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        }
      />
    </div>
  );
}
