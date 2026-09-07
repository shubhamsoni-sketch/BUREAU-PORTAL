'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Bell,
  BrainCircuit,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileDown,
  FileText,
  Gauge,
  Home,
  Landmark,
  LineChart,
  ListChecks,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  WalletCards,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import {
  type CreditAccount,
  type CreditInsight,
  type CreditIntelligence,
  formatCurrency,
  formatDate,
} from '@/lib/credit-intelligence/analytics';

type ReportHistory = {
  id: string;
  createdAt: string;
  score: number | null;
  accounts: number;
  currentBalance: number;
  overdueBalance: number;
};

type ReportPayload = {
  report: CreditIntelligence;
  history: ReportHistory[];
};

type Section =
  | 'dashboard'
  | 'report'
  | 'score'
  | 'loans'
  | 'cards'
  | 'repayment'
  | 'dpd'
  | 'enquiries'
  | 'mix'
  | 'debt'
  | 'accounts'
  | 'negative'
  | 'compare'
  | 'insights'
  | 'plan'
  | 'alerts'
  | 'documents'
  | 'settings';

type MetricTone = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan';

const navItems: Array<{ id: Section; label: string; icon: LucideIcon; badge?: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'report', label: 'Credit Report', icon: FileText },
  { id: 'score', label: 'Score Analysis', icon: Gauge },
  { id: 'loans', label: 'Loan Accounts', icon: Landmark },
  { id: 'cards', label: 'Credit Cards', icon: CreditCard },
  { id: 'repayment', label: 'Repayment History', icon: CalendarDays },
  { id: 'dpd', label: 'DPD Analysis', icon: SlidersHorizontal },
  { id: 'enquiries', label: 'Enquiries', icon: Search },
  { id: 'mix', label: 'Credit Mix', icon: LineChart },
  { id: 'debt', label: 'Debt & Capacity', icon: CircleDollarSign },
  { id: 'accounts', label: 'Account Details', icon: WalletCards },
  { id: 'negative', label: 'Negative Items', icon: AlertTriangle },
  { id: 'compare', label: 'Compare Reports', icon: TrendingUp },
  { id: 'insights', label: 'AI Insights', icon: BrainCircuit },
  { id: 'plan', label: 'Action Plan', icon: ListChecks },
  { id: 'alerts', label: 'Alerts & Monitoring', icon: Bell, badge: 'New' },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'settings', label: 'Settings', icon: ShieldCheck },
];

const toneClasses: Record<MetricTone, { card: string; icon: string; text: string; pill: string }> = {
  blue: {
    card: 'border-blue-200 bg-blue-50/50',
    icon: 'bg-blue-100 text-blue-700',
    text: 'text-blue-700',
    pill: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  green: {
    card: 'border-emerald-200 bg-emerald-50/50',
    icon: 'bg-emerald-100 text-emerald-700',
    text: 'text-emerald-700',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  amber: {
    card: 'border-amber-200 bg-amber-50/50',
    icon: 'bg-amber-100 text-amber-700',
    text: 'text-amber-700',
    pill: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  red: {
    card: 'border-rose-200 bg-rose-50/50',
    icon: 'bg-rose-100 text-rose-700',
    text: 'text-rose-700',
    pill: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  purple: {
    card: 'border-violet-200 bg-violet-50/50',
    icon: 'bg-violet-100 text-violet-700',
    text: 'text-violet-700',
    pill: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  cyan: {
    card: 'border-cyan-200 bg-cyan-50/50',
    icon: 'bg-cyan-100 text-cyan-700',
    text: 'text-cyan-700',
    pill: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
};

const monthLabels = ['Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26'];

function clamp(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function pct(value: number) {
  return `${clamp(Math.round(value))}%`;
}

function safeDate(value: string | null | undefined) {
  return formatDate(value);
}

function firstName(name: string) {
  return name.split(' ').filter(Boolean)[0] || 'Customer';
}

function scoreTone(score: number | null): MetricTone {
  if (!score) return 'amber';
  if (score >= 750) return 'green';
  if (score >= 700) return 'blue';
  if (score >= 650) return 'amber';
  return 'red';
}

function scoreLabel(score: number | null) {
  if (!score) return 'No Score';
  if (score >= 750) return 'Excellent';
  if (score >= 700) return 'Good';
  if (score >= 650) return 'Fair';
  return 'Needs Work';
}

function maskAccount(accountNumber: string) {
  if (!accountNumber) return 'Not available';
  if (accountNumber.length <= 4) return accountNumber;
  return `${accountNumber.slice(0, 3)}XXXX${accountNumber.slice(-4)}`;
}

function deriveReport(data: CreditIntelligence, history: ReportHistory[]) {
  const accounts = data.accounts || [];
  const loans = accounts.filter((account) => account.category === 'loan' || account.category === 'overdraft');
  const cards = accounts.filter((account) => account.category === 'credit_card');
  const activeAccounts = accounts.filter((account) => account.status === 'active');
  const cleanAccounts = accounts.filter((account) => account.overdue <= 0 && account.delayedPayments === 0 && account.severeDelays === 0);
  const criticalAccounts = accounts.filter(
    (account) => account.overdue > 0 || account.severeDelays > 0 || (account.utilization ?? 0) >= 80 || account.negativeFlags.length > 0
  );
  const watchlistAccounts = accounts.filter(
    (account) => !criticalAccounts.includes(account) && (account.delayedPayments > 0 || (account.utilization ?? 0) >= 60)
  );
  const cardLimit = cards.reduce((sum, account) => sum + (account.creditLimit || account.highCredit || 0), 0);
  const cardUsed = cards.reduce((sum, account) => sum + account.currentBalance, 0);
  const cardUtilization = cardLimit > 0 ? Math.round((cardUsed / cardLimit) * 100) : 0;
  const totalEmi = accounts.reduce((sum, account) => sum + account.emi, 0);
  const estimatedIncome = Math.max(totalEmi * 4, 150000);
  const debtToIncome = totalEmi > 0 ? Math.round((totalEmi / estimatedIncome) * 100) : 0;
  const score = data.score ?? 0;
  const scoreTrend = history.length
    ? history.slice(0, 6).reverse().map((item) => item.score ?? score)
    : [Math.max(score - 47, 300), Math.max(score - 34, 300), Math.max(score - 18, 300), Math.max(score - 8, 300), score];
  const projectedScore = clamp((data.score ?? 650) + 36, 300, 900);
  const enquiries = data.enquiries || [];
  const recentEnquiries = data.totals.recentEnquiries || enquiries.slice(0, 3).length;
  const dpdRows = accounts.slice(0, 6).map((account, accountIndex) => ({
    account,
    values: monthLabels.map((_, index) => {
      const raw = account.paymentHistory[index] || account.paymentHistory[index % Math.max(account.paymentHistory.length, 1)] || '000';
      if (raw === 'XXX' || raw === 'STD') return '000';
      if (accountIndex === 0 && index === 1 && account.delayedPayments > 0) return '030';
      if (accountIndex === 1 && index === 2 && account.severeDelays > 0) return '060+';
      return /^\d+$/.test(raw) ? raw.padStart(3, '0').slice(0, 3) : '000';
    }),
  }));
  const insightPool = data.insights || [];
  const positives = insightPool.filter((insight) => insight.tone === 'positive');
  const risks = insightPool.filter((insight) => insight.tone === 'warning' || insight.tone === 'critical');

  return {
    accounts,
    loans,
    cards,
    activeAccounts,
    cleanAccounts,
    criticalAccounts,
    watchlistAccounts,
    cardLimit,
    cardUsed,
    cardUtilization,
    totalEmi,
    estimatedIncome,
    debtToIncome,
    scoreTrend,
    projectedScore,
    enquiries,
    recentEnquiries,
    dpdRows,
    positives,
    risks,
    paymentDiscipline: clamp(100 - data.dpd.delayedPayments * 8 - data.dpd.severeDelays * 15),
    creditUsageScore: clamp(100 - cardUtilization + 20),
    creditAgeScore: accounts.length ? 76 : 50,
    creditMixScore: clamp(50 + data.mix.secured * 8 + data.mix.cards * 5),
    enquiryScore: clamp(100 - recentEnquiries * 15),
    approvalReadiness: clamp((score - 550) / 3.5),
    lenderConfidence: clamp(62 + (score - 650) / 5 - data.dpd.delayedPayments * 4),
    debtDiscipline: clamp(85 - debtToIncome - data.dpd.delayedPayments * 5),
  };
}

function CreditIntelligenceRoute() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <CreditIntelligenceApp />
    </Suspense>
  );
}

function CreditIntelligenceApp() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('request_id') || searchParams.get('report_id') || 'shakti-demo';
  const [payload, setPayload] = useState<ReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('dashboard');

  useEffect(() => {
    let mounted = true;

    async function loadReport() {
      setError(null);
      try {
        const response = await fetch(`/api/customer-report/intelligence?request_id=${encodeURIComponent(requestId)}`, {
          cache: 'no-store',
        });
        const json = await response.json().catch(() => null);
        if (!response.ok || !json?.report) {
          throw new Error(json?.message || 'Unable to open this report');
        }
        if (!mounted) return;
        setPayload({
          report: json.report,
          history: Array.isArray(json.history) ? json.history : [],
        });
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to open this report');
      }
    }

    loadReport();

    return () => {
      mounted = false;
    };
  }, [requestId]);

  const derived = useMemo(() => (payload ? deriveReport(payload.report, payload.history) : null), [payload]);

  if (error) {
    return <ErrorScreen message={error} />;
  }

  if (!payload || !derived) {
    return <LoadingScreen />;
  }

  const { report } = payload;
  const activeNav = navItems.find((item) => item.id === activeSection) || navItems[0];

  return (
    <main className="min-h-screen bg-[#f6f9fd] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white xl:flex xl:flex-col">
          <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} customerName={report.customerName} />
        </aside>

        <section className="min-w-0 flex-1 xl:pl-64">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-20 items-center gap-4 px-5 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 shadow-sm">
                <Search className="mr-3 h-5 w-5" />
                <span className="truncate text-sm font-semibold">Search reports, accounts, enquiries...</span>
              </div>
              <button className="relative rounded-full border border-slate-200 bg-white p-3 text-slate-700 shadow-sm">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">3</span>
              </button>
              <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {firstName(report.customerName).slice(0, 1)}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-bold">{report.customerName}</p>
                  <p className="text-xs text-slate-500">Updated {safeDate(report.generatedAt)}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </header>

          <div className="px-5 py-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{activeNav.label}</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
                  {sectionTitle(activeSection, report)}
                </h1>
                <p className="mt-2 text-base font-medium text-slate-500">{sectionSubtitle(activeSection, report)}</p>
              </div>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50">
                <FileDown className="h-4 w-4" />
                Download Report
              </button>
            </div>

            <SectionRenderer section={activeSection} report={report} history={payload.history} derived={derived} onSectionChange={setActiveSection} />
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar({
  activeSection,
  onSectionChange,
  customerName,
}: {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  customerName: string;
}) {
  return (
    <>
      <div className="border-b border-slate-200 px-7 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black leading-none text-blue-700">CreditTrust</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Deep Analysis</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeSection;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold transition ${
                active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badge ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">{item.badge}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pb-5">
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-blue-700">
            <Sparkles className="h-4 w-4" />
            Unlock full potential
          </div>
          <p className="mt-2 text-xs font-medium leading-5 text-slate-600">
            Get personalized insights and recommendations to improve your score faster.
          </p>
          <button className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-black text-white">Upgrade Now</button>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-950 p-3 text-white">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-sm font-black">{firstName(customerName).slice(0, 1)}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{customerName}</p>
            <p className="text-xs text-slate-300">Tap for account</p>
          </div>
        </div>
      </div>
    </>
  );
}

function SectionRenderer({
  section,
  report,
  history,
  derived,
  onSectionChange,
}: {
  section: Section;
  report: CreditIntelligence;
  history: ReportHistory[];
  derived: ReturnType<typeof deriveReport>;
  onSectionChange: (section: Section) => void;
}) {
  switch (section) {
    case 'dashboard':
      return <Dashboard report={report} derived={derived} onSectionChange={onSectionChange} />;
    case 'report':
      return <CreditReportSection report={report} derived={derived} />;
    case 'score':
      return <ScoreSection report={report} derived={derived} />;
    case 'loans':
      return <LoansSection derived={derived} />;
    case 'cards':
      return <CardsSection derived={derived} />;
    case 'repayment':
    case 'dpd':
      return <RepaymentSection derived={derived} />;
    case 'enquiries':
      return <EnquirySection report={report} derived={derived} />;
    case 'mix':
      return <MixSection report={report} derived={derived} />;
    case 'debt':
      return <DebtSection report={report} derived={derived} />;
    case 'accounts':
      return <AccountsSection accounts={derived.accounts} />;
    case 'negative':
      return <NegativeSection report={report} derived={derived} />;
    case 'compare':
      return <CompareSection history={history} report={report} />;
    case 'insights':
      return <InsightsSection report={report} derived={derived} />;
    case 'plan':
      return <ActionPlanSection report={report} derived={derived} />;
    case 'alerts':
      return <AlertsSection report={report} derived={derived} />;
    case 'documents':
      return <DocumentsSection report={report} />;
    case 'settings':
      return <SettingsSection report={report} />;
    default:
      return <Dashboard report={report} derived={derived} onSectionChange={onSectionChange} />;
  }
}

function Dashboard({
  report,
  derived,
  onSectionChange,
}: {
  report: CreditIntelligence;
  derived: ReturnType<typeof deriveReport>;
  onSectionChange: (section: Section) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="CIBIL Score" value={report.score ?? '-'} detail={scoreLabel(report.score)} tone={scoreTone(report.score)} icon={Gauge} />
        <MetricCard title="Credit Health" value={report.scoreBand || scoreLabel(report.score)} detail="Risk profile" tone={scoreTone(report.score)} icon={ShieldCheck} />
        <MetricCard title="Active Accounts" value={derived.activeAccounts.length} detail={`${derived.loans.length} loans - ${derived.cards.length} cards`} tone="blue" icon={CreditCard} />
        <MetricCard title="Total Outstanding" value={formatCurrency(report.totals.currentBalance)} detail="Current balance" tone="amber" icon={CircleDollarSign} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel title="Your Credit Score Trend" subtitle="Score movement from available reports">
          <TinyLineChart values={derived.scoreTrend} labels={['Jan 2026', 'Mar 2026', 'May 2026', 'Jul 2026', 'Sep 2026']} />
        </Panel>
        <Panel title="Quick Insights" subtitle="What needs attention right now">
          <InsightList insights={[...derived.risks, ...derived.positives].slice(0, 5)} fallback="No major risk flags found in this report." />
          <button onClick={() => onSectionChange('insights')} className="mt-4 text-sm font-black text-blue-700">
            View detailed analysis
          </button>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Accounts Snapshot" subtitle="Active, clean, watchlist and critical accounts">
          <div className="grid grid-cols-2 gap-3">
            <SmallStat label="Active" value={derived.activeAccounts.length} tone="blue" />
            <SmallStat label="Clean" value={derived.cleanAccounts.length} tone="green" />
            <SmallStat label="Watchlist" value={derived.watchlistAccounts.length} tone="amber" />
            <SmallStat label="Critical" value={derived.criticalAccounts.length} tone="red" />
          </div>
        </Panel>
        <Panel title="Debt Position" subtitle="Outstanding and repayment capacity">
          <div className="space-y-4">
            <Progress label="Debt to income" value={derived.debtToIncome} tone="amber" />
            <Progress label="Approval readiness" value={derived.approvalReadiness} tone="blue" />
            <Progress label="Lender confidence" value={derived.lenderConfidence} tone="green" />
          </div>
        </Panel>
        <Panel title="Recommended Next Step" subtitle="Highest impact action">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black text-slate-950">{report.actionPlan[0] || 'Keep all active accounts current and avoid fresh enquiries.'}</p>
            <p className="mt-2 text-sm font-medium text-slate-600">This is the fastest path to stronger lender confidence.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function CreditReportSection({ report, derived }: { report: CreditIntelligence; derived: ReturnType<typeof deriveReport> }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.36fr]">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Report ID" value={report.reportId.slice(0, 10)} detail="Internal reference" tone="blue" icon={FileText} />
          <MetricCard title="Score" value={report.score ?? '-'} detail={report.scoreBand} tone={scoreTone(report.score)} icon={Gauge} />
          <MetricCard title="Accounts" value={report.totals.accounts} detail={`${report.totals.activeAccounts} active`} tone="cyan" icon={WalletCards} />
          <MetricCard title="Enquiries" value={report.totals.enquiries} detail={`${derived.recentEnquiries} recent`} tone="amber" icon={Search} />
        </div>
        <Panel title="Consumer Information" subtitle="Identity and report metadata">
          <div className="grid gap-3 md:grid-cols-3">
            <InfoTile label="Customer" value={report.customerName} />
            <InfoTile label="PAN" value={report.profile.pan || 'Not available'} />
            <InfoTile label="Mobile" value={report.profile.mobile || 'Not available'} />
            <InfoTile label="Date of Birth" value={safeDate(report.profile.dob)} />
            <InfoTile label="Gender" value={report.profile.gender || 'Not available'} />
            <InfoTile label="Addresses" value={`${report.profile.addresses || 0} reported`} />
          </div>
        </Panel>
        <AccountsTable accounts={derived.accounts} />
      </div>
      <div className="space-y-5">
        <Panel title="Report Highlights" subtitle="Automatic reading of this file">
          <InsightList insights={[...derived.positives, ...derived.risks].slice(0, 6)} fallback="Report generated successfully." />
        </Panel>
        <Panel title="Risk Flags" subtitle="Items to monitor">
          <RiskPills derived={derived} />
        </Panel>
      </div>
    </div>
  );
}

function ScoreSection({ report, derived }: { report: CreditIntelligence; derived: ReturnType<typeof deriveReport> }) {
  const factors = [
    { label: 'Payment History', weight: '35%', value: derived.paymentDiscipline },
    { label: 'Credit Utilization', weight: '30%', value: derived.creditUsageScore },
    { label: 'Credit Age', weight: '15%', value: derived.creditAgeScore },
    { label: 'Credit Mix', weight: '10%', value: derived.creditMixScore },
    { label: 'New Credit', weight: '10%', value: derived.enquiryScore },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Score Analysis" subtitle="Understanding what impacts the score">
        <div className="flex flex-col items-center">
          <ScoreGauge score={report.score} />
          <p className="mt-3 text-center text-sm font-semibold text-emerald-600">+18 points from last report</p>
        </div>
      </Panel>
      <Panel title="Score Factors" subtitle="Weighted factors from account behavior">
        <div className="space-y-4">
          {factors.map((factor) => (
            <Progress key={factor.label} label={`${factor.label} ${factor.weight}`} value={factor.value} tone={factor.value >= 75 ? 'green' : factor.value >= 60 ? 'amber' : 'red'} />
          ))}
        </div>
      </Panel>
      <Panel title="What's Helping Your Score" subtitle="Positive behaviors">
        <InsightList insights={derived.positives.slice(0, 4)} fallback="No missed payments found in recent payment history." />
      </Panel>
      <Panel title="What's Pulling Your Score Down" subtitle="Risk behaviors">
        <InsightList insights={derived.risks.slice(0, 4)} fallback="No major pull-down factor detected." />
      </Panel>
    </div>
  );
}

function LoansSection({ derived }: { derived: ReturnType<typeof deriveReport> }) {
  const loans = derived.loans;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Loans" value={loans.length} detail="Reported loan accounts" tone="blue" icon={Landmark} />
        <MetricCard title="Active Loans" value={loans.filter((loan) => loan.status === 'active').length} detail="Currently open" tone="green" icon={CheckCircle2} />
        <MetricCard title="Closed Loans" value={loans.filter((loan) => loan.status === 'closed').length} detail="Successfully closed" tone="purple" icon={XCircle} />
        <MetricCard title="Outstanding" value={formatCurrency(loans.reduce((sum, loan) => sum + loan.currentBalance, 0))} detail="Loan balances" tone="amber" icon={CircleDollarSign} />
      </div>
      <AccountsTable accounts={loans} title="Loan Account Performance" />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Key Observations" subtitle="Loan behavior reading">
          <InsightList insights={derived.risks.concat(derived.positives).slice(0, 5)} fallback="Loan repayment behavior is stable." />
        </Panel>
        <Panel title="Loan Repayment Trend" subtitle="Last 12 months">
          <MiniBars values={monthLabels.map((_, index) => 18 + ((index * 7) % 29))} />
        </Panel>
      </div>
    </div>
  );
}

function CardsSection({ derived }: { derived: ReturnType<typeof deriveReport> }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Cards" value={derived.cards.length} detail="Credit card accounts" tone="blue" icon={CreditCard} />
        <MetricCard title="Total Limit" value={formatCurrency(derived.cardLimit)} detail="Available card limits" tone="green" icon={WalletCards} />
        <MetricCard title="Total Used" value={formatCurrency(derived.cardUsed)} detail="Current card balance" tone="amber" icon={CircleDollarSign} />
        <MetricCard title="Utilization" value={pct(derived.cardUtilization)} detail="Overall card usage" tone={derived.cardUtilization > 70 ? 'red' : 'green'} icon={Gauge} />
      </div>
      <AccountsTable accounts={derived.cards} title="Credit Card Utilization" />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Card Utilization Trend" subtitle="Indicative month-wise usage">
          <TinyLineChart values={[56, 68, 62, 76, 71, derived.cardUtilization || 65]} labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']} />
        </Panel>
        <Panel title="Card Usage Insights" subtitle="How card behavior is affecting score">
          <InsightList insights={derived.risks.concat(derived.positives).slice(0, 5)} fallback="Card usage is within acceptable range." />
        </Panel>
      </div>
    </div>
  );
}

function RepaymentSection({ derived }: { derived: ReturnType<typeof deriveReport> }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="On-Time Payments" value={pct(derived.paymentDiscipline)} detail="Estimated discipline" tone="green" icon={ShieldCheck} />
        <MetricCard title="Delayed Payments" value={derived.accounts.reduce((sum, account) => sum + account.delayedPayments, 0)} detail="Reported delays" tone="amber" icon={CalendarDays} />
        <MetricCard title="90+ DPD" value={derived.accounts.reduce((sum, account) => sum + account.severeDelays, 0)} detail="Severe delay records" tone="red" icon={AlertTriangle} />
        <MetricCard title="Behaviour" value={derived.paymentDiscipline > 80 ? 'Good' : 'Watch'} detail="Repayment health" tone={derived.paymentDiscipline > 80 ? 'green' : 'amber'} icon={CheckCircle2} />
      </div>
      <Panel title="DPD Trend (Last 12 Months)" subtitle="Green is clean, amber/red needs attention">
        <DpdMatrix rows={derived.dpdRows} />
      </Panel>
      <AccountsTable accounts={derived.accounts.filter((account) => account.delayedPayments > 0 || account.severeDelays > 0)} title="Detailed DPD History" />
    </div>
  );
}

function EnquirySection({ report, derived }: { report: CreditIntelligence; derived: ReturnType<typeof deriveReport> }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.36fr]">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Last 3 Months" value={derived.recentEnquiries} detail="Recent enquiries" tone="amber" icon={Search} />
          <MetricCard title="Last 6 Months" value={Math.max(derived.recentEnquiries, Math.ceil(report.totals.enquiries / 2))} detail="Medium-term activity" tone="red" icon={AlertTriangle} />
          <MetricCard title="Total" value={report.totals.enquiries} detail="All enquiries" tone="blue" icon={FileText} />
          <MetricCard title="Activity" value={derived.enquiryScore > 70 ? 'Low' : 'Moderate'} detail="Credit seeking risk" tone={derived.enquiryScore > 70 ? 'green' : 'amber'} icon={Gauge} />
        </div>
        <Panel title="Enquiry Details" subtitle="Credit enquiries made by lenders">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Lender</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {derived.enquiries.map((enquiry, index) => (
                  <tr key={`${enquiry.lender}-${index}`}>
                    <td className="px-4 py-3 font-semibold text-slate-700">{safeDate(enquiry.date)}</td>
                    <td className="px-4 py-3 font-bold">{enquiry.lender}</td>
                    <td className="px-4 py-3 text-slate-600">{enquiry.purpose}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(enquiry.amount)}</td>
                    <td className="px-4 py-3"><Pill tone={index < 2 ? 'amber' : 'green'}>{index < 2 ? 'Medium' : 'Low'}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      <Panel title="Enquiry Insights" subtitle="What this means">
        <ul className="space-y-3 text-sm font-medium text-slate-600">
          <li>Recent enquiries can reduce lender confidence for a short period.</li>
          <li>Avoid fresh applications until urgent credit requirements are clear.</li>
          <li>Keep enquiry count low for the next 90 days to improve score stability.</li>
        </ul>
      </Panel>
    </div>
  );
}

function MixSection({ report, derived }: { report: CreditIntelligence; derived: ReturnType<typeof deriveReport> }) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Panel title="Credit Mix" subtitle="Loan type distribution">
        <DonutLegend
          items={[
            { label: 'Secured Loans', value: report.mix.secured, color: 'bg-blue-500' },
            { label: 'Unsecured Loans', value: report.mix.unsecured, color: 'bg-amber-500' },
            { label: 'Credit Cards', value: report.mix.cards, color: 'bg-rose-500' },
          ]}
        />
      </Panel>
      <Panel title="Credit Age" subtitle="Portfolio age estimate">
        <div className="rounded-xl bg-slate-50 p-5 text-center">
          <p className="text-5xl font-black text-blue-700">7.2</p>
          <p className="mt-1 text-sm font-bold text-slate-500">years average age</p>
          <p className="mt-5 text-sm text-slate-600">Older accounts add stability and improve lender confidence.</p>
        </div>
      </Panel>
      <Panel title="Account Status" subtitle="Current portfolio status">
        <div className="space-y-3">
          <Progress label="Active" value={(report.totals.activeAccounts / Math.max(report.totals.accounts, 1)) * 100} tone="green" />
          <Progress label="Closed" value={(report.totals.closedAccounts / Math.max(report.totals.accounts, 1)) * 100} tone="blue" />
          <Progress label="Watchlist" value={(derived.watchlistAccounts.length / Math.max(report.totals.accounts, 1)) * 100} tone="amber" />
        </div>
      </Panel>
    </div>
  );
}

function DebtSection({ report, derived }: { report: CreditIntelligence; derived: ReturnType<typeof deriveReport> }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Outstanding" value={formatCurrency(report.totals.currentBalance)} detail="All active balances" tone="blue" icon={CircleDollarSign} />
        <MetricCard title="Monthly EMI" value={formatCurrency(derived.totalEmi)} detail="Reported obligations" tone="cyan" icon={CalendarDays} />
        <MetricCard title="EMI to Income" value={pct(derived.debtToIncome)} detail="Estimated ratio" tone={derived.debtToIncome > 40 ? 'red' : 'green'} icon={Gauge} />
        <MetricCard title="Income Estimate" value={formatCurrency(derived.estimatedIncome)} detail="Planning assumption" tone="purple" icon={TrendingUp} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Debt Distribution" subtitle="Outstanding by product">
          <DonutLegend
            items={[
              { label: 'Loans', value: derived.loans.reduce((sum, account) => sum + account.currentBalance, 0), color: 'bg-blue-500' },
              { label: 'Credit Cards', value: derived.cardUsed, color: 'bg-amber-500' },
              { label: 'Others', value: Math.max(report.totals.currentBalance - derived.cardUsed, 0), color: 'bg-purple-500' },
            ]}
            currency
          />
        </Panel>
        <Panel title="EMI vs Income" subtitle="Repayment capacity reading">
          <Progress label="Total EMI" value={derived.debtToIncome} tone={derived.debtToIncome > 40 ? 'red' : 'green'} />
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            Keep EMI burden below 30-35% to improve approval readiness.
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AccountsSection({ accounts }: { accounts: CreditAccount[] }) {
  return <AccountsTable accounts={accounts} title="Complete Account Details" />;
}

function NegativeSection({ report, derived }: { report: CreditIntelligence; derived: ReturnType<typeof deriveReport> }) {
  const items = report.negativeItems || [];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Negative Items" value={items.length} detail="Adverse records" tone={items.length ? 'red' : 'green'} icon={AlertTriangle} />
        <MetricCard title="Active Defaults" value={derived.criticalAccounts.length} detail="Critical accounts" tone={derived.criticalAccounts.length ? 'red' : 'green'} icon={XCircle} />
        <MetricCard title="Write-offs" value={items.filter((item) => item.issue.toLowerCase().includes('write')).length} detail="Reported write-offs" tone="amber" icon={FileText} />
        <MetricCard title="Status" value={items.length ? 'Review' : 'Resolved'} detail="Current assessment" tone={items.length ? 'amber' : 'green'} icon={CheckCircle2} />
      </div>
      <Panel title="Negative Items & Public Records" subtitle="Adverse information in this report">
        {items.length ? (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Lender</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={`${item.account}-${index}`}>
                    <td className="px-4 py-3 font-bold">{item.issue}</td>
                    <td className="px-4 py-3 text-slate-600">{item.lender}</td>
                    <td className="px-4 py-3 text-slate-600">{item.account}</td>
                    <td className="px-4 py-3"><Pill tone="red">High</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No major negative item found" detail="This report does not show write-off, settlement, or active severe negative flags." />
        )}
      </Panel>
    </div>
  );
}

function CompareSection({ history, report }: { history: ReportHistory[]; report: CreditIntelligence }) {
  const rows = history.length ? history : [{ id: report.reportId, createdAt: report.generatedAt, score: report.score, accounts: report.totals.accounts, currentBalance: report.totals.currentBalance, overdueBalance: report.totals.overdueBalance }];
  return (
    <Panel title="Compare Reports" subtitle="Track progress across report pulls">
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Report Date</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Accounts</th>
              <th className="px-4 py-3">Outstanding</th>
              <th className="px-4 py-3">Overdue</th>
              <th className="px-4 py-3">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-bold">{safeDate(row.createdAt)}</td>
                <td className="px-4 py-3 text-blue-700 font-black">{row.score ?? '-'}</td>
                <td className="px-4 py-3">{row.accounts}</td>
                <td className="px-4 py-3">{formatCurrency(row.currentBalance)}</td>
                <td className="px-4 py-3">{formatCurrency(row.overdueBalance)}</td>
                <td className="px-4 py-3"><Pill tone={row.overdueBalance > 0 ? 'amber' : 'green'}>{row.overdueBalance > 0 ? 'Needs attention' : 'Stable profile'}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function InsightsSection({ report, derived }: { report: CreditIntelligence; derived: ReturnType<typeof deriveReport> }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.35fr]">
      <Panel title="AI Credit Assessment" subtitle="Personalized analysis of this credit profile">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-800">
            {report.score && report.score >= 700
              ? 'You have a generally stable credit profile with some optimization opportunities.'
              : 'This profile needs focused repayment and enquiry control to improve lender confidence.'}
          </p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[...report.insights, ...fallbackInsights()].slice(0, 8).map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </Panel>
      <Panel title="Score Prediction" subtitle="Estimated improvement">
        <div className="space-y-3">
          {[report.score ?? 650, derived.projectedScore - 18, derived.projectedScore - 8, derived.projectedScore].map((value, index) => (
            <div key={index} className="flex items-end gap-3">
              <div className="w-16 text-sm font-black text-blue-700">{Math.round(value)}</div>
              <div className="h-3 flex-1 rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-blue-600" style={{ width: `${clamp(((value - 300) / 600) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ActionPlanSection({ report, derived }: { report: CreditIntelligence; derived: ReturnType<typeof deriveReport> }) {
  const actions = report.actionPlan.length ? report.actionPlan : ['Reduce credit card utilization', 'Avoid new loan applications for 90 days', 'Pay all EMIs before due date', 'Monitor report for errors'];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Immediate Priority" value={derived.risks.length ? 'High' : 'Medium'} detail="Needs focused action" tone={derived.risks.length ? 'red' : 'amber'} icon={AlertTriangle} />
        <MetricCard title="Expected Improvement" value="+35 to +55" detail="Possible score points" tone="green" icon={TrendingUp} />
        <MetricCard title="Timeline" value="90 to 180 Days" detail="For visible improvement" tone="blue" icon={CalendarDays} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_0.36fr]">
        <div className="space-y-5">
          <Panel title="What went wrong" subtitle="Issues detected from this report">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['High utilization', 'Card usage above ideal level', 'red'],
                ['Recent enquiries', 'Multiple credit applications', 'amber'],
                ['Delayed payment', 'One or more DPD records', 'amber'],
                ['Unsecured exposure', 'Higher unsecured loan dependency', 'purple'],
              ].map(([title, detail, tone]) => (
                <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-black">{title}</p>
                  <p className="mt-2 text-sm font-medium text-slate-600">{detail}</p>
                  <Pill tone={tone as MetricTone}>{tone === 'red' ? 'High' : 'Medium'}</Pill>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="What to do now" subtitle="Step-by-step recommendations">
            <ul className="space-y-3">
              {actions.map((action) => (
                <li key={action} className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {action}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Action Timeline" subtitle="A practical 90-day plan">
            <div className="grid gap-4 md:grid-cols-3">
              <TimelineCard title="Next 7 Days" items={['Check report for errors', 'Set bill reminders', 'Reduce urgent overdue']} tone="green" />
              <TimelineCard title="Next 30 Days" items={['Keep utilization below 30%', 'Avoid fresh enquiries', 'Pay all EMIs on time']} tone="blue" />
              <TimelineCard title="Next 90 Days" items={['Build clean history', 'Optimize credit mix', 'Review score again']} tone="purple" />
            </div>
          </Panel>
        </div>
        <div className="space-y-5">
          <Panel title="Estimated Benefit" subtitle="Target improvements">
            <Progress label="Approval readiness" value={derived.approvalReadiness} tone="blue" />
            <Progress label="Lender confidence" value={derived.lenderConfidence} tone="green" />
            <Progress label="Debt discipline" value={derived.debtDiscipline} tone="amber" />
          </Panel>
          <Panel title="Avoid These Mistakes" subtitle="Do not weaken the profile">
            <ul className="space-y-3 text-sm font-semibold text-slate-700">
              {['Multiple loan applications', 'Minimum due only payments', 'Closing old clean cards', 'Ignoring report errors'].map((item) => (
                <li key={item} className="flex items-center gap-2"><XCircle className="h-4 w-4 text-rose-500" /> {item}</li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function AlertsSection({ report, derived }: { report: CreditIntelligence; derived: ReturnType<typeof deriveReport> }) {
  return (
    <Panel title="Alerts & Monitoring" subtitle="Important report events">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { title: 'High utilization alert', detail: `${pct(derived.cardUtilization)} current card usage`, tone: derived.cardUtilization > 70 ? 'red' : 'green' },
          { title: 'New enquiry monitoring', detail: `${report.totals.enquiries} enquiries reported`, tone: derived.recentEnquiries > 2 ? 'amber' : 'green' },
          { title: 'DPD monitoring', detail: `${report.dpd.delayedPayments} delayed payment records`, tone: report.dpd.delayedPayments ? 'red' : 'green' },
          { title: 'Score watch', detail: `${report.score ?? 'No'} current score`, tone: scoreTone(report.score) },
        ].map((alert) => (
          <div key={alert.title} className="rounded-xl border border-slate-200 bg-white p-5">
            <Pill tone={alert.tone as MetricTone}>{alert.tone === 'green' ? 'Normal' : 'Watch'}</Pill>
            <p className="mt-3 text-lg font-black">{alert.title}</p>
            <p className="mt-1 text-sm font-medium text-slate-600">{alert.detail}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DocumentsSection({ report }: { report: CreditIntelligence }) {
  return (
    <Panel title="Documents" subtitle="Downloadable report files">
      <div className="grid gap-4 md:grid-cols-3">
        {['Credit intelligence PDF', 'Raw bureau JSON', 'Action plan summary'].map((name) => (
          <div key={name} className="rounded-xl border border-slate-200 bg-white p-5">
            <FileText className="h-8 w-8 text-blue-700" />
            <p className="mt-4 font-black">{name}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">Report ref: {report.reportId.slice(0, 10)}</p>
            <button className="mt-4 rounded-lg border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700">Download</button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SettingsSection({ report }: { report: CreditIntelligence }) {
  return (
    <Panel title="Settings" subtitle="Report access and privacy controls">
      <div className="grid gap-4 md:grid-cols-3">
        <InfoTile label="Customer" value={report.customerName} />
        <InfoTile label="Report ID" value={report.reportId} />
        <InfoTile label="Generated" value={safeDate(report.generatedAt)} />
        <InfoTile label="Data Security" value="Encrypted report access" />
        <InfoTile label="Report Source" value="CreditTrust analysis engine" />
        <InfoTile label="Status" value="Ready" />
      </div>
    </Panel>
  );
}

function MetricCard({ title, value, detail, tone, icon: Icon }: { title: string; value: string | number; detail: string; tone: MetricTone; icon: LucideIcon }) {
  const classes = toneClasses[tone];
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${classes.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{detail}</p>
        </div>
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${classes.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function SmallStat({ label, value, tone }: { label: string; value: string | number; tone: MetricTone }) {
  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone].card}`}>
      <p className="text-sm font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function Progress({ label, value, tone }: { label: string; value: number; tone: MetricTone }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span className="text-slate-700">{label}</span>
        <span className={toneClasses[tone].text}>{pct(value)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100">
        <div className={`h-2.5 rounded-full ${tone === 'red' ? 'bg-rose-500' : tone === 'amber' ? 'bg-amber-500' : tone === 'purple' ? 'bg-violet-500' : tone === 'green' ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: pct(value) }} />
      </div>
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: MetricTone }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${toneClasses[tone].pill}`}>{children}</span>;
}

function AccountsTable({ accounts, title = 'Account Performance' }: { accounts: CreditAccount[]; title?: string }) {
  return (
    <Panel title={title} subtitle="Account-level analysis from the bureau response">
      {accounts.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="rounded-xl bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Lender</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Opened</th>
                <th className="px-4 py-3">Limit / Loan</th>
                <th className="px-4 py-3">Current Balance</th>
                <th className="px-4 py-3">EMI</th>
                <th className="px-4 py-3">Overdue</th>
                <th className="px-4 py-3">Utilization</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((account) => {
                const utilization = account.utilization ?? (account.creditLimit ? (account.currentBalance / account.creditLimit) * 100 : 0);
                return (
                  <tr key={account.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-black">{account.lender}</p>
                      <p className="text-xs font-semibold text-slate-500">{maskAccount(account.accountNumber)}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">{account.product}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{safeDate(account.openedAt)}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{formatCurrency(account.creditLimit || account.highCredit)}</td>
                    <td className="px-4 py-4 font-bold text-slate-900">{formatCurrency(account.currentBalance)}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{account.emi ? formatCurrency(account.emi) : '-'}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{formatCurrency(account.overdue)}</td>
                    <td className="px-4 py-4">
                      <span className={utilization > 75 ? 'font-black text-rose-600' : utilization > 50 ? 'font-black text-amber-600' : 'font-black text-emerald-600'}>
                        {pct(utilization)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Pill tone={account.status === 'active' ? 'green' : account.status === 'closed' ? 'blue' : 'amber'}>{account.status}</Pill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No accounts found" detail="This section will populate when account-level records are available in the bureau response." />
      )}
    </Panel>
  );
}

function DpdMatrix({ rows }: { rows: ReturnType<typeof deriveReport>['dpdRows'] }) {
  if (!rows.length) {
    return <EmptyState title="No DPD data available" detail="Payment history data was not present in this report." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] text-left text-xs">
        <thead className="text-slate-500">
          <tr>
            <th className="w-48 px-3 py-2">Account</th>
            {monthLabels.map((month) => <th key={month} className="px-2 py-2 text-center">{month}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(({ account, values }) => (
            <tr key={account.id}>
              <td className="px-3 py-3">
                <p className="font-black text-slate-900">{account.lender}</p>
                <p className="text-slate-500">{account.product}</p>
              </td>
              {values.map((value, index) => (
                <td key={`${account.id}-${index}`} className="px-2 py-3 text-center">
                  <span className={`inline-flex min-w-10 justify-center rounded-md px-2 py-1 font-black ${
                    value === '000'
                      ? 'bg-emerald-50 text-emerald-700'
                      : value === '030'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                  }`}>
                    {value}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
        <span><Pill tone="green">000</Pill> Keep it up</span>
        <span><Pill tone="amber">030</Pill> Watch</span>
        <span><Pill tone="red">060+</Pill> High risk</span>
      </div>
    </div>
  );
}

function ScoreGauge({ score }: { score: number | null }) {
  const value = score ?? 0;
  const angle = clamp(((value - 300) / 600) * 180, 0, 180);
  return (
    <div className="relative h-48 w-72">
      <div className="absolute inset-x-4 top-6 h-32 rounded-t-full border-[16px] border-b-0 border-slate-200" />
      <div className="absolute inset-x-4 top-6 h-32 rounded-t-full border-[16px] border-b-0 border-transparent border-l-emerald-500 border-t-amber-400 border-r-emerald-500" />
      <div className="absolute bottom-10 left-1/2 h-1 w-28 origin-left rounded-full bg-slate-800" style={{ transform: `rotate(${angle + 180}deg)` }} />
      <div className="absolute bottom-5 left-0 right-0 text-center">
        <p className="text-5xl font-black text-emerald-700">{score ?? '-'}</p>
        <p className="text-sm font-black text-slate-700">Credit Score</p>
        <Pill tone={scoreTone(score)}>{scoreLabel(score)}</Pill>
      </div>
    </div>
  );
}

function TinyLineChart({ values, labels }: { values: number[]; labels: string[] }) {
  const min = Math.min(...values, 300);
  const max = Math.max(...values, 900);
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = 90 - ((value - min) / Math.max(max - min, 1)) * 72;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div>
      <svg viewBox="0 0 100 100" className="h-56 w-full overflow-visible">
        <defs>
          <linearGradient id="scoreFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,96 ${points} 100,96`} fill="url(#scoreFill)" stroke="none" />
        <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => {
          const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
          const y = 90 - ((value - min) / Math.max(max - min, 1)) * 72;
          return (
            <g key={`${value}-${index}`}>
              <circle cx={x} cy={y} r="2.4" fill="#14b8a6" stroke="#fff" strokeWidth="1.5" />
              <text x={x} y={y - 6} textAnchor="middle" className="fill-slate-700 text-[5px] font-black">{Math.round(value)}</text>
            </g>
          );
        })}
      </svg>
      <div className="grid grid-cols-5 text-xs font-bold text-slate-500">
        {labels.slice(0, 5).map((label) => <span key={label}>{label}</span>)}
      </div>
    </div>
  );
}

function MiniBars({ values }: { values: number[] }) {
  return (
    <div className="flex h-52 items-end gap-2">
      {values.map((value, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <div className="w-full rounded-t-lg bg-emerald-400" style={{ height: `${clamp(value, 8, 92)}%` }} />
          <span className="text-[10px] font-bold text-slate-400">{monthLabels[index]?.split(' ')[0]}</span>
        </div>
      ))}
    </div>
  );
}

function InsightList({ insights, fallback }: { insights: CreditInsight[]; fallback: string }) {
  const rows = insights.length ? insights : [{ id: 'fallback', tone: 'positive' as const, title: fallback, detail: 'No further action required right now.' }];
  return (
    <div className="space-y-3">
      {rows.map((insight) => (
        <div key={insight.id} className="flex gap-3">
          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${insight.tone === 'critical' ? 'bg-rose-500' : insight.tone === 'warning' ? 'bg-amber-500' : insight.tone === 'positive' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
          <div>
            <p className="text-sm font-black text-slate-900">{insight.title}</p>
            <p className="mt-1 text-sm font-medium leading-5 text-slate-600">{insight.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightCard({ insight }: { insight: CreditInsight }) {
  const tone = insight.tone === 'critical' ? 'red' : insight.tone === 'warning' ? 'amber' : insight.tone === 'positive' ? 'green' : 'blue';
  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone].card}`}>
      <Pill tone={tone}>{insight.tone}</Pill>
      <p className="mt-3 font-black">{insight.title}</p>
      <p className="mt-2 text-sm font-medium leading-5 text-slate-600">{insight.detail}</p>
    </div>
  );
}

function RiskPills({ derived }: { derived: ReturnType<typeof deriveReport> }) {
  const risks = [
    { label: 'High Utilization', active: derived.cardUtilization > 70, tone: 'red' as MetricTone },
    { label: 'Recent Delay', active: derived.dpdRows.some((row) => row.values.some((value) => value !== '000')), tone: 'amber' as MetricTone },
    { label: 'Unsecured Exposure', active: derived.accounts.some((account) => account.category === 'credit_card'), tone: 'amber' as MetricTone },
    { label: 'Good Loan Mix', active: true, tone: 'green' as MetricTone },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {risks.filter((risk) => risk.active).map((risk) => <Pill key={risk.label} tone={risk.tone}>{risk.label}</Pill>)}
    </div>
  );
}

function DonutLegend({ items, currency = false }: { items: Array<{ label: string; value: number; color: string }>; currency?: boolean }) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <div className="space-y-4">
      <div className="mx-auto grid h-36 w-36 place-items-center rounded-full border-[18px] border-blue-500 shadow-inner">
        <div className="text-center">
          <p className="text-2xl font-black">{currency ? formatCurrency(total) : total}</p>
          <p className="text-xs font-bold text-slate-500">Total</p>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm font-bold">
            <span className="flex items-center gap-2 text-slate-600"><span className={`h-3 w-3 rounded-full ${item.color}`} /> {item.label}</span>
            <span>{currency ? formatCurrency(item.value) : `${Math.round((item.value / total) * 100)}%`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineCard({ title, items, tone }: { title: string; items: string[]; tone: MetricTone }) {
  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone].card}`}>
      <p className={`font-black ${toneClasses[tone].text}`}>{title}</p>
      <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
        {items.map((item) => <li key={item}>- {item}</li>)}
      </ul>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <p className="font-black text-slate-900">{title}</p>
      <p className="mt-2 text-sm font-medium text-slate-500">{detail}</p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f9fd] text-slate-900">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="mt-4 font-black">Preparing credit intelligence...</p>
      </div>
    </main>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f9fd] p-6">
      <div className="max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-100 text-rose-600">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-slate-950">Unable to open this report</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">{message}</p>
        <Link href="/get-my-report" className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white">
          Get my report
        </Link>
      </div>
    </main>
  );
}

function sectionTitle(section: Section, report: CreditIntelligence) {
  const name = firstName(report.customerName);
  const titles: Record<Section, string> = {
    dashboard: `Welcome, ${name}!`,
    report: 'Credit Report',
    score: 'Score Analysis',
    loans: 'Loan Accounts',
    cards: 'Credit Cards',
    repayment: 'Payment History & DPD Analysis',
    dpd: 'Payment History & DPD Analysis',
    enquiries: 'Enquiries',
    mix: 'Credit Mix & Age',
    debt: 'Debt & Repayment Capacity',
    accounts: 'Account Details',
    negative: 'Negative Items & Public Records',
    compare: 'Compare Reports',
    insights: 'AI Insights',
    plan: 'Credit Mistakes & Action Plan',
    alerts: 'Alerts & Monitoring',
    documents: 'Documents',
    settings: 'Settings',
  };
  return titles[section];
}

function sectionSubtitle(section: Section, report: CreditIntelligence) {
  const name = report.customerName;
  const subtitles: Record<Section, string> = {
    dashboard: "Here's your complete credit health overview",
    report: `Complete bureau summary for ${name}`,
    score: 'Understand what is impacting the credit score',
    loans: 'Detailed analysis of loan accounts',
    cards: 'Credit card usage, limits and utilization',
    repayment: 'Detailed view of repayment behaviour',
    dpd: 'Month-wise repayment delay analysis',
    enquiries: 'Analysis of credit enquiries made by lenders',
    mix: 'Analysis of credit portfolio mix and history',
    debt: 'Overall debt position and repayment capability',
    accounts: 'All tradelines and account-level details',
    negative: 'Any adverse information in the credit report',
    compare: 'Track credit progress over time',
    insights: 'AI-powered personalized reading of the profile',
    plan: `Hello, ${firstName(name)} - here is the action plan`,
    alerts: 'Monitor score-impacting events',
    documents: 'Report files and generated documents',
    settings: 'Security and report access preferences',
  };
  return subtitles[section];
}

function fallbackInsights(): CreditInsight[] {
  return [
    {
      id: 'fallback-positive',
      tone: 'positive',
      title: 'Stable profile foundation',
      detail: 'Maintaining current accounts and timely repayment can keep the profile lender-friendly.',
    },
    {
      id: 'fallback-warning',
      tone: 'warning',
      title: 'Avoid new enquiries',
      detail: 'Fresh loan applications can temporarily reduce score strength and approval confidence.',
    },
  ];
}

export default CreditIntelligenceRoute;
