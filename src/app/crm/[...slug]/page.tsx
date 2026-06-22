'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Search,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

const routeCopy: Record<string, { title: string; subtitle: string; action: string }> = {
  leads: {
    title: 'Leads',
    subtitle: 'Capture enquiries, assign owners, and move prospects into loan files.',
    action: 'Add Lead',
  },
  customers: {
    title: 'Customers',
    subtitle: 'A single view of borrowers, contact details, documents, and activity.',
    action: 'Add Customer',
  },
  'follow-ups': {
    title: 'Follow-ups',
    subtitle: 'Track callbacks, ageing leads, pending reminders, and calling outcomes.',
    action: 'Schedule Call',
  },
  applications: {
    title: 'Applications',
    subtitle: 'Monitor files from login readiness to sanction, disbursal, and closure.',
    action: 'Create File',
  },
  'eligibility-check': {
    title: 'Eligibility Check',
    subtitle: 'Run standard and advanced eligibility checks from the CRM workflow.',
    action: 'Run Check',
  },
  'eligibility-reports': {
    title: 'Eligibility Reports',
    subtitle: 'Review bureau responses, no-hit cases, consent trails, and report status.',
    action: 'View Reports',
  },
  performance: {
    title: 'Performance',
    subtitle: 'Track team productivity, lead conversion, TAT, and file movement.',
    action: 'View Metrics',
  },
  lenders: {
    title: 'Lender Desk',
    subtitle: 'Manage lender products, queries, policies, and file-level communication.',
    action: 'Add Lender',
  },
  tasks: {
    title: 'My Tasks',
    subtitle: 'Your assigned tasks, approvals, calls, and ageing work items.',
    action: 'Add Task',
  },
  approvals: {
    title: 'My Approvals',
    subtitle: 'Review pending approvals for files, exceptions, payouts, and setup changes.',
    action: 'Review Queue',
  },
  'setup/team': {
    title: 'Team Users',
    subtitle: 'Create users, assign roles, and control branch or team visibility.',
    action: 'Add User',
  },
  'setup/eligibility-credits': {
    title: 'Eligibility Credits',
    subtitle: 'Configure credit limits, deductions, and usage visibility for CRM checks.',
    action: 'Add Credits',
  },
  'setup/invoices': {
    title: 'Invoices',
    subtitle: 'Track commercial invoices and partner billing once the CRM goes live.',
    action: 'Create Invoice',
  },
  'setup/settings': {
    title: 'Settings',
    subtitle: 'Configure CRM preferences, permissions, notifications, and defaults.',
    action: 'Open Settings',
  },
  'setup/lead-sources': {
    title: 'Lead Sources',
    subtitle: 'Manage campaigns, channels, referrals, and source-level reporting.',
    action: 'Add Source',
  },
  'setup/loan-products': {
    title: 'Loan Products',
    subtitle: 'Maintain product types, lender mappings, and basic eligibility rules.',
    action: 'Add Product',
  },
};

const quickStats = [
  { label: 'Open Items', value: '24', icon: FolderKanban, tone: 'bg-indigo-50 text-indigo-600' },
  { label: 'Due Today', value: '9', icon: CalendarDays, tone: 'bg-amber-50 text-amber-600' },
  { label: 'Completed', value: '18', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
  { label: 'Reports', value: '7', icon: FileText, tone: 'bg-sky-50 text-sky-600' },
];

const rows = [
  ['Amit Kumar', 'Home Loan', 'Follow-up due', 'Today'],
  ['Riya Sharma', 'Business Loan', 'Documents pending', 'Tomorrow'],
  ['Karan Mehta', 'Personal Loan', 'Eligibility checked', '23 Jun'],
  ['Neha Jain', 'Loan Against Property', 'Lender query', '24 Jun'],
];

const nextSetupItems: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'Fields and stages', icon: ClipboardList },
  { label: 'Eligibility rules', icon: ShieldCheck },
  { label: 'Team permissions', icon: UsersRound },
  { label: 'Dashboard widgets', icon: LayoutDashboard },
];

function humanize(pathname: string) {
  const routeKey = pathname.replace('/crm/', '');
  return (
    routeCopy[routeKey] ?? {
      title: routeKey
        .split('/')
        .filter(Boolean)
        .map((part) => part.replace(/-/g, ' '))
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' / '),
      subtitle: 'This CRM module is ready for workflow wiring in the next development step.',
      action: 'Create Item',
    }
  );
}

export default function CrmModulePage() {
  const pathname = usePathname();
  const page = humanize(pathname);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/crm/dashboard"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600"
            >
              <ArrowLeft size={19} />
            </Link>
            <div>
              <p className="text-sm font-bold text-indigo-600">CreditTrust DSA CRM</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">{page.title}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex h-12 min-w-[260px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search size={18} className="text-slate-400" />
              <span className="truncate text-sm font-semibold text-slate-400">Search module</span>
            </div>
            <button className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-900/10">
              <Plus size={17} />
              {page.action}
            </button>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">{page.subtitle}</p>
      </header>

      <section className="space-y-7 px-5 py-8 sm:px-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.label}
                className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}
                >
                  <Icon size={21} />
                </div>
                <p className="text-3xl font-bold tracking-tight">{item.value}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">{item.label}</p>
              </article>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Recent Work</h2>
                <p className="mt-1 text-sm text-slate-500">Starter table for this CRM module.</p>
              </div>
              <Link href="/crm/dashboard" className="text-sm font-bold text-indigo-600">
                Dashboard
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              {rows.map(([owner, product, status, due]) => (
                <div
                  key={`${owner}-${status}`}
                  className="grid grid-cols-1 gap-3 border-b border-slate-100 p-4 last:border-b-0 md:grid-cols-[1fr_1fr_1fr_100px]"
                >
                  <p className="font-bold text-slate-900">{owner}</p>
                  <p className="text-sm font-semibold text-slate-500">{product}</p>
                  <p className="text-sm font-semibold text-slate-700">{status}</p>
                  <p className="text-sm font-bold text-indigo-600">{due}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Next Setup</h2>
            <div className="mt-5 space-y-3">
              {nextSetupItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-slate-50"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">
                      {item.label}
                    </span>
                    <ArrowRight size={16} className="text-slate-300" />
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
