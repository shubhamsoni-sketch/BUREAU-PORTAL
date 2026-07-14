import AppLayout from '@/crm/components/AppLayout';
import DashboardMetrics from './components/DashboardMetrics';
import DashboardCharts from './components/DashboardCharts';
import DashboardActivityFeed from './components/DashboardActivityFeed';
import DashboardAlerts from './components/DashboardAlerts';
import TopAgentsTable from './components/TopAgentsTable';
import DashboardHero from './components/DashboardHero';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="px-4 lg:px-6 xl:px-8 py-5 max-w-screen-2xl mx-auto">
        <DashboardHero />

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
