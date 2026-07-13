import AppLayout from '@/crm/components/AppLayout';
import DashboardMetrics from './components/DashboardMetrics';
import DashboardCharts from './components/DashboardCharts';
import DashboardActivityFeed from './components/DashboardActivityFeed';
import DashboardAlerts from './components/DashboardAlerts';
import TopAgentsTable from './components/TopAgentsTable';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="px-4 lg:px-6 xl:px-8 py-5 max-w-screen-2xl mx-auto">
        <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden mb-5">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px]">
            <div className="p-5 lg:p-6 bg-[linear-gradient(135deg,rgba(37,99,235,0.10),rgba(16,185,129,0.08)_45%,rgba(245,158,11,0.10))] border-b xl:border-b-0 xl:border-r border-border">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-800 uppercase tracking-wide text-primary mb-3">
                    CreditTrust CRM Command Center
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-800 text-foreground">
                    Good Morning, Amit Kumar
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    Track leads, eligibility checks, lender files, and team priorities from one CreditTrust workspace.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                {[
                  ['Files Today', '18', '+6 vs yesterday', 'bg-blue-500'],
                  ['Eligibility Pulls', '124', '93 successful', 'bg-emerald-500'],
                  ['Lender Logins', '31', '7 pending login', 'bg-violet-500'],
                  ['Disbursal MTD', '₹4.82 Cr', '80% target', 'bg-orange-500'],
                ]?.map(([label, value, subtext, color]) => (
                  <div key={label} className="rounded-lg border border-border bg-card/85 px-4 py-3 shadow-sm">
                    <div className={`w-7 h-1 rounded-full ${color} mb-3`} />
                    <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <p className="text-xl font-800 text-foreground mt-0.5 tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground">{subtext}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-card">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-800 text-foreground">Today&apos;s Priorities</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Friday, 26 Jun 2026</p>
                </div>
                <span className="rounded-full bg-danger/10 px-2 py-1 text-[10px] font-800 text-danger">
                  9 urgent
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Overdue Callbacks', '12 leads', 'text-blue-600 bg-blue-50'],
                  ['Docs Pending', '23 files', 'text-amber-600 bg-amber-50'],
                  ['Lender TAT Breach', '3 files', 'text-red-600 bg-red-50'],
                  ['Fresh Eligibility Queue', '41 leads', 'text-emerald-600 bg-emerald-50'],
                ]?.map(([label, value, tone]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-sm border border-border bg-muted/20 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-800 text-foreground truncate">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{value}</p>
                    </div>
                    <span className={`h-7 w-7 rounded-sm flex items-center justify-center text-xs font-900 ${tone}`}>
                      &gt;
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-800 text-foreground">Business Snapshot</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Live operational pulse across your CreditTrust workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select className="h-8 px-3 rounded-sm border border-input bg-card text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40">
              <option>This Month (June 2026)</option>
              <option>Last Month</option>
              <option>Last Quarter</option>
              <option>This FY</option>
            </select>
            <button className="h-8 px-3 rounded-sm bg-primary text-primary-foreground text-xs font-600 hover:bg-primary/90 active:scale-95 transition-all duration-150 flex items-center gap-1.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              Export
            </button>
          </div>
        </div>

        <DashboardMetrics />
        <DashboardAlerts />
        <DashboardCharts />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
          <div className="xl:col-span-2">
            <TopAgentsTable />
          </div>
          <div>
            <DashboardActivityFeed />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
