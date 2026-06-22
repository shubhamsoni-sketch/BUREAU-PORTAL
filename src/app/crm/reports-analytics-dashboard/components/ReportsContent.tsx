import ReportsMetrics from './ReportsMetrics';
import ReportsCharts from './ReportsCharts';
import AgentPerformanceTable from './AgentPerformanceTable';

export default function ReportsContent() {
  return (
    <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-700 text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Performance overview — June 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-8 px-3 rounded-sm border border-input bg-card text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40">
            <option>Last 90 days</option>
            <option>Last 30 days</option>
            <option>This Quarter</option>
            <option>This FY (Apr–Mar)</option>
            <option>Custom Range</option>
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      <ReportsMetrics />
      <ReportsCharts />
      <AgentPerformanceTable />
    </div>
  );
}
