const metrics = [
  {
    label: 'Lead Queue',
    value: '286',
    subtext: '41 fresh leads waiting',
    change: '+18 today',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
    bar: 'bg-blue-500',
  },
  {
    label: 'Eligibility Checked',
    value: '124',
    subtext: '93 bureau reports success',
    change: '75% hit rate',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    bar: 'bg-emerald-500',
  },
  {
    label: 'Files In Process',
    value: '58',
    subtext: '31 sent to lenders',
    change: '9 urgent',
    tone: 'border-violet-200 bg-violet-50 text-violet-700',
    bar: 'bg-violet-500',
  },
  {
    label: 'Login Pending',
    value: '7',
    subtext: 'Lender action required',
    change: '3 ageing',
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
    bar: 'bg-amber-500',
  },
  {
    label: 'Disbursed MTD',
    value: '₹4.82 Cr',
    subtext: '₹6.00 Cr monthly target',
    change: '80% achieved',
    tone: 'border-green-200 bg-green-50 text-green-700',
    bar: 'bg-green-500',
  },
  {
    label: 'Rejections',
    value: '11',
    subtext: '4 can be rerouted',
    change: 'Review',
    tone: 'border-rose-200 bg-rose-50 text-rose-700',
    bar: 'bg-rose-500',
  },
];

export default function DashboardMetrics() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 mb-5">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={`rounded-lg border ${metric.tone} px-4 py-3 shadow-sm`}
        >
          <div className={`h-1 w-10 rounded-full ${metric.bar} mb-3`} />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-800 uppercase tracking-wide opacity-80">
                {metric.label}
              </p>
              <p className="text-2xl font-900 text-foreground mt-1 tabular-nums">
                {metric.value}
              </p>
            </div>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-800 shadow-sm">
              {metric.change}
            </span>
          </div>
          <p className="text-xs font-600 mt-2 opacity-80">{metric.subtext}</p>
        </div>
      ))}
    </div>
  );
}
