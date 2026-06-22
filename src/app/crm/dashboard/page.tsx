import {
  AlertCircle,
  ArrowRight,
  BadgeIndianRupee,
  Banknote,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  FolderKanban,
  Gauge,
  Headphones,
  Home,
  Landmark,
  LayoutGrid,
  ListTodo,
  MessageSquareText,
  PhoneCall,
  PieChart,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';

const navGroups = [
  {
    title: '',
    items: [
      { label: 'Home', icon: Home, active: true },
      { label: 'Leads', icon: FolderKanban },
      { label: 'Customers', icon: UsersRound },
      { label: 'Follow-ups', icon: PhoneCall },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Eligibility Check', icon: ShieldCheck },
      { label: 'Applications', icon: BriefcaseBusiness },
      { label: 'Eligibility Reports', icon: FileCheck2 },
      { label: 'Performance', icon: PieChart },
    ],
  },
  {
    title: 'Setup',
    items: [
      { label: 'Team Users', icon: UserCheck },
      { label: 'Eligibility Credits', icon: WalletCards },
      { label: 'Invoices', icon: FileText },
      { label: 'Settings', icon: Settings },
    ],
  },
];

const kpis = [
  { label: 'Leads Today', value: '24', status: '+8 new', icon: FolderKanban, tone: 'indigo' },
  { label: 'Follow-ups Due', value: '17', status: '5 overdue', icon: PhoneCall, tone: 'amber' },
  {
    label: 'Eligibility Checks',
    value: '41',
    status: '12 advanced',
    icon: ShieldCheck,
    tone: 'emerald',
  },
  {
    label: 'Login Ready Files',
    value: '9',
    status: 'Docs complete',
    icon: ClipboardCheck,
    tone: 'sky',
  },
  {
    label: 'Sanction Pipeline',
    value: '₹38L',
    status: 'This month',
    icon: BadgeIndianRupee,
    tone: 'rose',
  },
  {
    label: 'Eligibility Credits',
    value: '126',
    status: 'Healthy',
    icon: WalletCards,
    tone: 'green',
  },
];

const modules = [
  {
    title: 'Sales Desk',
    text: 'Leads, customers, assignments',
    status: 'Open',
    icon: Headphones,
    tone: 'indigo',
  },
  {
    title: 'Calling Desk',
    text: 'Call queue, follow-ups, notes',
    status: 'Ready',
    icon: PhoneCall,
    tone: 'orange',
  },
  {
    title: 'DSA Team',
    text: 'Users, roles, permissions',
    status: 'Setup',
    icon: UsersRound,
    tone: 'violet',
  },
  {
    title: 'Eligibility Engine',
    text: 'Standard and advanced checks',
    status: 'Live',
    icon: ShieldCheck,
    tone: 'emerald',
  },
  {
    title: 'File Process',
    text: 'Applications, docs, lender status',
    status: 'Partial',
    icon: BriefcaseBusiness,
    tone: 'amber',
  },
  {
    title: 'Lender Desk',
    text: 'Banks, products, query tracking',
    status: 'Next',
    icon: Landmark,
    tone: 'sky',
  },
];

const priorities = [
  { label: 'Pending Follow-ups', icon: PhoneCall, tone: 'indigo', value: '17' },
  { label: 'Documents Pending', icon: FileText, tone: 'amber', value: '11' },
  { label: 'Eligibility No-hit Review', icon: AlertCircle, tone: 'rose', value: '4' },
  { label: 'Lender Queries', icon: MessageSquareText, tone: 'sky', value: '8' },
  { label: 'Files Awaiting Login', icon: ClipboardCheck, tone: 'emerald', value: '9' },
];

const exceptions = [
  'Overdue callback',
  'Lead untouched for 48h',
  'Sanction pending',
  'Low eligibility credits',
  'Document ageing',
];

const team = [
  { name: 'Amit Kumar', role: 'Owner', leads: 42, checks: 18, color: 'bg-indigo-600' },
  { name: 'Riya Sharma', role: 'Manager', leads: 31, checks: 11, color: 'bg-emerald-600' },
  { name: 'Karan Mehta', role: 'Sales Executive', leads: 26, checks: 7, color: 'bg-orange-500' },
  { name: 'Neha Jain', role: 'Telecaller', leads: 54, checks: 0, color: 'bg-sky-600' },
];

const setupItems: Array<{
  label: string;
  value: string;
  icon: LucideIcon;
  text: string;
  bg: string;
}> = [
  {
    label: 'Eligibility Credits',
    value: '126 available',
    icon: WalletCards,
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    label: 'Invoices',
    value: '3 unpaid',
    icon: FileText,
    text: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    label: 'Lead Sources',
    value: '8 configured',
    icon: Gauge,
    text: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    label: 'Loan Products',
    value: '12 active',
    icon: Banknote,
    text: 'text-sky-600',
    bg: 'bg-sky-50',
  },
];

const queueItems: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'My Tasks', icon: ListTodo },
  { label: 'My Approvals', icon: CheckCircle2 },
  { label: 'Calls Today', icon: PhoneCall },
  { label: 'Files Ageing', icon: Clock3 },
];

const toneClasses: Record<string, { icon: string; bg: string; text: string; pill: string }> = {
  indigo: {
    icon: 'text-indigo-600',
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    pill: 'bg-indigo-50 text-indigo-700',
  },
  amber: {
    icon: 'text-amber-600',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    pill: 'bg-amber-50 text-amber-700',
  },
  emerald: {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    pill: 'bg-emerald-50 text-emerald-700',
  },
  sky: {
    icon: 'text-sky-600',
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    pill: 'bg-sky-50 text-sky-700',
  },
  rose: {
    icon: 'text-rose-600',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    pill: 'bg-rose-50 text-rose-700',
  },
  green: {
    icon: 'text-green-600',
    bg: 'bg-green-50',
    text: 'text-green-600',
    pill: 'bg-green-50 text-green-700',
  },
  orange: {
    icon: 'text-orange-600',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    pill: 'bg-orange-50 text-orange-700',
  },
  violet: {
    icon: 'text-violet-600',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    pill: 'bg-violet-50 text-violet-700',
  },
};

export default function CrmDashboardPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden xl:flex w-[306px] shrink-0 flex-col bg-[#111827] text-white">
          <div className="flex h-[92px] items-center gap-4 px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold">
              C
            </div>
            <div>
              <p className="text-xl font-bold leading-tight">CreditTrust</p>
              <p className="text-sm text-slate-400">DSA CRM</p>
            </div>
          </div>
          <nav className="flex-1 space-y-7 overflow-y-auto px-3 pb-6">
            {navGroups.map((group) => (
              <div key={group.title || 'main'}>
                {group.title ? (
                  <p className="px-4 pb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                    {group.title}
                  </p>
                ) : null}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        className={`flex h-14 w-full items-center gap-4 rounded-2xl px-5 text-left text-[15px] font-semibold transition ${
                          item.active
                            ? 'bg-white/12 text-white shadow-inner'
                            : 'text-slate-400 hover:bg-white/8 hover:text-white'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-white/10 p-5">
            <div className="flex items-center gap-3 rounded-2xl bg-white/8 p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold">
                AK
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">Amit Kumar</p>
                <p className="truncate text-xs text-slate-400">Owner / Superadmin</p>
              </div>
              <ChevronRight size={18} className="text-slate-500" />
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-[92px] items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-8">
            <div className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 shadow-sm">
              <Search size={21} className="shrink-0 text-slate-400" />
              <span className="truncate text-base text-slate-400 sm:text-xl">
                Search customers, files, leads, eligibility reports...
              </span>
              <kbd className="ml-auto hidden rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-400 sm:block">
                ⌘K
              </kbd>
            </div>
            <button className="hidden h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-600 lg:flex">
              <CalendarDays size={17} />
              Tuesday, 23 Jun 2026
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            <button className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <Bell size={20} className="text-slate-600" />
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                8
              </span>
            </button>
            <button className="flex h-12 items-center gap-3 rounded-2xl bg-white pl-1 pr-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                AK
              </span>
              <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
            </button>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_430px]">
            <div className="min-w-0 overflow-hidden">
              <section className="border-b border-slate-200 bg-white px-5 py-8 sm:px-10">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
                      <Sparkles size={15} />
                      New CRM workspace
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                      Good Morning, Amit Kumar 👋
                    </h1>
                    <p className="mt-3 text-lg text-slate-500">
                      Manage leads, team users, eligibility checks and loan files in one place.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10">
                      Add Lead
                    </button>
                    <button className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700">
                      Run Eligibility
                    </button>
                  </div>
                </div>
              </section>

              <section className="space-y-8 overflow-y-auto px-5 py-8 sm:px-8 lg:px-10">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                  {kpis.map((item) => {
                    const Icon = item.icon;
                    const tone = toneClasses[item.tone];
                    return (
                      <article
                        key={item.label}
                        className="min-h-[164px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
                      >
                        <div
                          className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${tone.bg}`}
                        >
                          <Icon size={21} className={tone.icon} />
                        </div>
                        <p className="text-3xl font-bold tracking-tight text-slate-950">
                          {item.value}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-500">{item.label}</p>
                        <p className={`mt-2 text-sm font-bold ${tone.text}`}>{item.status}</p>
                      </article>
                    );
                  })}
                </div>

                <section>
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                        Business Modules
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Launch CRM workflows without disturbing the legacy partner portal.
                      </p>
                    </div>
                    <div className="inline-flex w-fit rounded-2xl bg-slate-100 p-1">
                      <button className="flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-950 shadow-sm">
                        <LayoutGrid size={16} />
                        Grid View
                      </button>
                      <button className="flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-slate-500">
                        <ListTodo size={16} />
                        List View
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                    {modules.map((item) => {
                      const Icon = item.icon;
                      const tone = toneClasses[item.tone];
                      return (
                        <article
                          key={item.title}
                          className="group min-h-[210px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                        >
                          <div
                            className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${tone.bg}`}
                          >
                            <Icon size={23} className={tone.icon} />
                          </div>
                          <h3 className="text-xl font-bold leading-tight text-slate-950">
                            {item.title}
                          </h3>
                          <p className="mt-3 min-h-[44px] text-sm leading-6 text-slate-500">
                            {item.text}
                          </p>
                          <div className="mt-5 flex items-center justify-between">
                            <span
                              className={`rounded-full px-3 py-1 text-sm font-bold ${tone.pill}`}
                            >
                              {item.status}
                            </span>
                            <ArrowRight
                              size={18}
                              className="text-slate-300 transition group-hover:text-indigo-600"
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.1fr_0.9fr]">
                  <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-950">Team Users</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Role-based access from day one.
                        </p>
                      </div>
                      <button className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">
                        Add User
                      </button>
                    </div>
                    <div className="space-y-3">
                      {team.map((member) => (
                        <div
                          key={member.name}
                          className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-full ${member.color} text-sm font-bold text-white`}
                          >
                            {member.name
                              .split(' ')
                              .map((part) => part[0])
                              .join('')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-slate-950">{member.name}</p>
                            <p className="truncate text-sm text-slate-500">{member.role}</p>
                          </div>
                          <div className="hidden grid-cols-2 gap-3 text-right sm:grid">
                            <div>
                              <p className="text-sm font-bold text-slate-950">{member.leads}</p>
                              <p className="text-xs text-slate-500">Leads</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-950">{member.checks}</p>
                              <p className="text-xs text-slate-500">Checks</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-950">Setup Snapshot</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Credits, invoices and commercials live under Setup.
                    </p>
                    <div className="mt-6 space-y-4">
                      {setupItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.label}
                            className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4"
                          >
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.bg}`}
                            >
                              <Icon size={20} className={item.text} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-950">{item.label}</p>
                              <p className="text-sm text-slate-500">{item.value}</p>
                            </div>
                            <ChevronRight size={18} className="text-slate-300" />
                          </div>
                        );
                      })}
                    </div>
                  </article>
                </section>
              </section>
            </div>

            <aside className="hidden border-l border-slate-200 bg-white xl:block">
              <div className="sticky top-0 h-screen overflow-y-auto px-8 py-8">
                <PanelHeader title="Today's Priorities" />
                <div className="mt-6 space-y-4">
                  {priorities.map((item) => {
                    const Icon = item.icon;
                    const tone = toneClasses[item.tone];
                    return (
                      <button
                        key={item.label}
                        className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition hover:bg-slate-50"
                      >
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone.bg}`}
                        >
                          <Icon size={18} className={tone.icon} />
                        </span>
                        <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">
                          {item.label}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                          {item.value}
                        </span>
                        <ChevronRight size={17} className="text-slate-300" />
                      </button>
                    );
                  })}
                </div>

                <div className="mt-9">
                  <PanelHeader title="Critical Exceptions" />
                  <div className="mt-5 space-y-3">
                    {exceptions.map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl p-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50">
                          <AlertCircle size={16} className="text-rose-500" />
                        </span>
                        <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">
                          {item}
                        </span>
                        <span className="text-slate-300">—</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-9">
                  <PanelHeader title="My Queue" />
                  <div className="mt-5 space-y-3">
                    {queueItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-slate-50"
                        >
                          <Icon size={18} className="text-slate-400" />
                          <span className="flex-1 font-semibold text-slate-700">{item.label}</span>
                          <ChevronRight size={17} className="text-slate-300" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function PanelHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <button className="text-sm font-bold text-indigo-600">View All</button>
    </div>
  );
}
