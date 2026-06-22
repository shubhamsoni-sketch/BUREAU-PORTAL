'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  Banknote,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  FolderKanban,
  Gauge,
  Landmark,
  PhoneCall,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from 'lucide-react';

type ModuleKey =
  | 'leads'
  | 'customers'
  | 'follow-ups'
  | 'applications'
  | 'eligibility-check'
  | 'eligibility-reports'
  | 'performance'
  | 'lenders'
  | 'tasks'
  | 'approvals'
  | 'setup/team'
  | 'setup/eligibility-credits'
  | 'setup/invoices'
  | 'setup/settings'
  | 'setup/lead-sources'
  | 'setup/loan-products';

const moduleMeta: Record<ModuleKey, { title: string; subtitle: string; action: string }> = {
  leads: {
    title: 'Leads',
    subtitle: 'DSA lead inbox, assignment, source tracking, and stage movement.',
    action: 'Add Lead',
  },
  customers: {
    title: 'Customers',
    subtitle: 'Borrower master with contact, product, owner, and last activity.',
    action: 'Add Customer',
  },
  'follow-ups': {
    title: 'Follow-ups',
    subtitle: 'Calling queue, overdue callbacks, next reminders, and notes.',
    action: 'Schedule Call',
  },
  applications: {
    title: 'Applications',
    subtitle: 'Loan file tracker from document collection to sanction and disbursal.',
    action: 'Create File',
  },
  'eligibility-check': {
    title: 'Eligibility Check',
    subtitle: 'Run bureau standard or advanced checks from the CRM workspace.',
    action: 'Run Check',
  },
  'eligibility-reports': {
    title: 'Eligibility Reports',
    subtitle: 'Bureau report history, no-hit reviews, consent status, and usage.',
    action: 'Export',
  },
  performance: {
    title: 'Performance',
    subtitle: 'Team productivity, conversion funnel, TAT, and disbursal pipeline.',
    action: 'View Metrics',
  },
  lenders: {
    title: 'Lender Desk',
    subtitle: 'Lender products, queries, policy notes, and file communication.',
    action: 'Add Lender',
  },
  tasks: {
    title: 'My Tasks',
    subtitle: 'Daily work queue for pending calls, documents, approvals, and files.',
    action: 'Add Task',
  },
  approvals: {
    title: 'My Approvals',
    subtitle: 'Approval queue for exceptions, setup requests, and commercial actions.',
    action: 'Review',
  },
  'setup/team': {
    title: 'Team Users',
    subtitle: 'Create CRM users, roles, branches, targets, and access levels.',
    action: 'Add User',
  },
  'setup/eligibility-credits': {
    title: 'Eligibility Credits',
    subtitle: 'Control eligibility credits, deductions, limits, and top-ups.',
    action: 'Add Credits',
  },
  'setup/invoices': {
    title: 'Invoices',
    subtitle: 'Commercial invoices and payment status for CRM billing.',
    action: 'Create Invoice',
  },
  'setup/settings': {
    title: 'Settings',
    subtitle: 'CRM defaults, stages, notifications, permissions, and branding.',
    action: 'Save Changes',
  },
  'setup/lead-sources': {
    title: 'Lead Sources',
    subtitle: 'Manage referral, campaign, digital, and field lead channels.',
    action: 'Add Source',
  },
  'setup/loan-products': {
    title: 'Loan Products',
    subtitle: 'Product catalogue, lender mapping, and basic eligibility rules.',
    action: 'Add Product',
  },
};

const allKeys = Object.keys(moduleMeta) as ModuleKey[];

function getModuleKey(pathname: string): ModuleKey {
  const key = pathname.replace('/crm/', '') as ModuleKey;
  return allKeys.includes(key) ? key : 'leads';
}

export default function CrmModulePage() {
  const moduleKey = getModuleKey(usePathname());
  const meta = moduleMeta[moduleKey];

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
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">{meta.title}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex h-12 min-w-[260px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search size={18} className="text-slate-400" />
              <span className="truncate text-sm font-semibold text-slate-400">
                Search {meta.title}
              </span>
            </div>
            <button className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-900/10">
              <Plus size={17} />
              {meta.action}
            </button>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">{meta.subtitle}</p>
      </header>

      <section className="px-5 py-8 sm:px-10">{renderModule(moduleKey)}</section>
    </main>
  );
}

function renderModule(key: ModuleKey) {
  if (key === 'leads') return <LeadPipeline />;
  if (key === 'customers') return <CustomerMaster />;
  if (key === 'follow-ups') return <FollowUpDesk />;
  if (key === 'applications') return <ApplicationTracker />;
  if (key === 'eligibility-check') return <EligibilityCheck />;
  if (key === 'eligibility-reports') return <EligibilityReports />;
  if (key === 'performance') return <PerformanceBoard />;
  if (key === 'lenders') return <LenderDesk />;
  if (key === 'tasks') return <TaskQueue />;
  if (key === 'approvals') return <ApprovalQueue />;
  if (key === 'setup/team') return <TeamSetup />;
  if (key === 'setup/eligibility-credits') return <CreditSetup />;
  if (key === 'setup/invoices') return <InvoiceSetup />;
  if (key === 'setup/settings') return <SettingsSetup />;
  if (key === 'setup/lead-sources') return <LeadSourceSetup />;
  return <LoanProductSetup />;
}

function StatCards({
  items,
}: {
  items: Array<
    [string, string, React.ComponentType<{ size?: number; className?: string }>, string]
  >;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value, Icon, tone]) => (
        <article
          key={label}
          className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
            <Icon size={21} />
          </div>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">{label}</p>
        </article>
      ))}
    </div>
  );
}

function Board({ columns }: { columns: Array<{ title: string; count: string; cards: string[] }> }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {columns.map((column) => (
        <section
          key={column.title}
          className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">{column.title}</h2>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
              {column.count}
            </span>
          </div>
          <div className="space-y-3">
            {column.cards.map((card) => (
              <div key={card} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-bold text-slate-900">{card}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Owner, product, next action, and priority.
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-100 bg-slate-50 p-4 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid-cols-4">
        {headers.map((header) => (
          <span key={header}>{header}</span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={row.join('-')}
          className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 md:grid-cols-4"
        >
          {row.map((cell, index) => (
            <span
              key={`${cell}-${index}`}
              className={
                index === 0 ? 'font-bold text-slate-900' : 'text-sm font-semibold text-slate-600'
              }
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
    </section>
  );
}

function LeadPipeline() {
  return (
    <div className="space-y-6">
      <StatCards
        items={[
          ['New Leads', '24', FolderKanban, 'bg-indigo-50 text-indigo-600'],
          ['Assigned', '18', UserCheck, 'bg-emerald-50 text-emerald-600'],
          ['Hot Leads', '7', BellRing, 'bg-rose-50 text-rose-600'],
          ['Converted', '5', CheckCircle2, 'bg-sky-50 text-sky-600'],
        ]}
      />
      <Board
        columns={[
          {
            title: 'New Enquiries',
            count: '8',
            cards: ['Rohit Sharma - Home Loan', 'Priya Jain - LAP', 'Ankit Mehta - Personal Loan'],
          },
          {
            title: 'In Discussion',
            count: '11',
            cards: [
              'Nisha Gupta - Balance Transfer',
              'Ketan Patel - Business Loan',
              'Harshal Pawar - Home Loan',
            ],
          },
          {
            title: 'Login Ready',
            count: '5',
            cards: [
              'Ishika Soni - Docs complete',
              'Amit Verma - Eligibility clear',
              'Neha Jain - Bank shortlisted',
            ],
          },
        ]}
      />
    </div>
  );
}

function CustomerMaster() {
  return (
    <DataTable
      headers={['Customer', 'Product', 'Owner', 'Last Activity']}
      rows={[
        ['Shubham Soni', 'Home Loan', 'Amit Kumar', 'Eligibility checked'],
        ['Ishika Soni', 'Personal Loan', 'Riya Sharma', 'Documents pending'],
        ['Ketan Patel', 'Business Loan', 'Karan Mehta', 'Follow-up today'],
        ['Harshal Pawar', 'LAP', 'Neha Jain', 'Application created'],
      ]}
    />
  );
}

function FollowUpDesk() {
  return (
    <Board
      columns={[
        {
          title: 'Overdue',
          count: '5',
          cards: ['Call Shubham for PAN', 'Collect bank statement', 'Discuss sanction terms'],
        },
        {
          title: 'Today',
          count: '12',
          cards: ['Eligibility consent call', 'Document reminder', 'Lender query update'],
        },
        {
          title: 'Upcoming',
          count: '20',
          cards: ['EMI discussion', 'Rate confirmation', 'Branch visit'],
        },
      ]}
    />
  );
}

function ApplicationTracker() {
  return (
    <DataTable
      headers={['File', 'Stage', 'Lender', 'TAT']}
      rows={[
        ['CT-HL-1021', 'Docs Pending', 'HDFC Bank', '2d'],
        ['CT-BL-1007', 'Logged In', 'Axis Bank', '1d'],
        ['CT-LAP-991', 'Sanction Pending', 'ICICI Bank', '4d'],
        ['CT-PL-887', 'Disbursal Ready', 'Bajaj Finance', '0d'],
      ]}
    />
  );
}

function EligibilityCheck() {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Run Eligibility</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            'Mobile Number',
            'PAN Number',
            'Customer Name',
            'Loan Product',
            'Monthly Income',
            'Consent Status',
          ].map((label) => (
            <label key={label} className="space-y-2">
              <span className="text-sm font-bold text-slate-600">{label}</span>
              <div className="h-12 rounded-2xl border border-slate-200 bg-slate-50" />
            </label>
          ))}
        </div>
      </section>
      <aside className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Check Types</h2>
        {['Bureau Standard', 'Bureau Advanced', 'Mobile Prefill'].map((item) => (
          <div key={item} className="mt-4 rounded-2xl border border-slate-100 p-4">
            <p className="font-bold">{item}</p>
            <p className="mt-1 text-sm text-slate-500">Configured for reseller workflow.</p>
          </div>
        ))}
      </aside>
    </div>
  );
}

function EligibilityReports() {
  return (
    <DataTable
      headers={['Report ID', 'Customer', 'Result', 'Date']}
      rows={[
        ['RPT-2048', 'Shubham Soni', 'No hit', '23 Jun'],
        ['RPT-2047', 'Ishika Soni', 'Score pulled', '23 Jun'],
        ['RPT-2046', 'Ketan Patel', 'Consent missing', '22 Jun'],
        ['RPT-2045', 'Harshal Pawar', 'Score pulled', '22 Jun'],
      ]}
    />
  );
}

function PerformanceBoard() {
  return (
    <StatCards
      items={[
        ['Lead Conversion', '21%', Gauge, 'bg-indigo-50 text-indigo-600'],
        ['Files Logged', '14', ClipboardCheck, 'bg-emerald-50 text-emerald-600'],
        ['Sanction Value', '38L', BadgeIndianRupee, 'bg-amber-50 text-amber-600'],
        ['Avg TAT', '2.4d', Clock3, 'bg-sky-50 text-sky-600'],
      ]}
    />
  );
}

function LenderDesk() {
  return (
    <DataTable
      headers={['Lender', 'Products', 'Queries', 'Status']}
      rows={[
        ['HDFC Bank', 'HL, LAP', '2 open', 'Active'],
        ['Axis Bank', 'BL, PL', '1 open', 'Active'],
        ['ICICI Bank', 'HL, BT', '4 open', 'Policy review'],
        ['Bajaj Finance', 'PL', '0 open', 'Active'],
      ]}
    />
  );
}

function TaskQueue() {
  return (
    <DataTable
      headers={['Task', 'Owner', 'Priority', 'Due']}
      rows={[
        ['Collect PAN', 'Amit Kumar', 'High', 'Today'],
        ['Call back lead', 'Riya Sharma', 'Medium', 'Today'],
        ['Upload sanction letter', 'Karan Mehta', 'High', 'Tomorrow'],
        ['Verify address', 'Neha Jain', 'Low', '24 Jun'],
      ]}
    />
  );
}

function ApprovalQueue() {
  return (
    <DataTable
      headers={['Approval', 'Requested By', 'Type', 'Status']}
      rows={[
        ['Credit top-up', 'Amit Kumar', 'Eligibility', 'Pending'],
        ['Rate exception', 'Riya Sharma', 'Commercial', 'Pending'],
        ['User access', 'Karan Mehta', 'Setup', 'Approved'],
        ['Payout hold', 'Neha Jain', 'Finance', 'Pending'],
      ]}
    />
  );
}

function TeamSetup() {
  return (
    <DataTable
      headers={['User', 'Role', 'Branch', 'Status']}
      rows={[
        ['Amit Kumar', 'Owner', 'Indore', 'Active'],
        ['Riya Sharma', 'Manager', 'Indore', 'Active'],
        ['Karan Mehta', 'Sales Executive', 'Bhopal', 'Active'],
        ['Neha Jain', 'Telecaller', 'Remote', 'Invited'],
      ]}
    />
  );
}

function CreditSetup() {
  return (
    <StatCards
      items={[
        ['Available Credits', '126', ShieldCheck, 'bg-emerald-50 text-emerald-600'],
        ['Used Today', '41', Clock3, 'bg-indigo-50 text-indigo-600'],
        ['Advanced Checks', '12', PhoneCall, 'bg-sky-50 text-sky-600'],
        ['Low Credit Alert', '50', BellRing, 'bg-rose-50 text-rose-600'],
      ]}
    />
  );
}

function InvoiceSetup() {
  return (
    <DataTable
      headers={['Invoice', 'Client', 'Amount', 'Status']}
      rows={[
        ['INV-102', 'Ketav Finance', 'Rs 18,500', 'Unpaid'],
        ['INV-101', 'CreditTrust', 'Rs 42,000', 'Paid'],
        ['INV-100', 'Demo Client', 'Rs 7,500', 'Draft'],
        ['INV-099', 'Partner Desk', 'Rs 12,000', 'Paid'],
      ]}
    />
  );
}

function SettingsSetup() {
  return (
    <Board
      columns={[
        {
          title: 'CRM Defaults',
          count: '6',
          cards: ['Lead stages', 'Default owner', 'Branch rules'],
        },
        {
          title: 'Notifications',
          count: '4',
          cards: ['Follow-up alerts', 'Credit alerts', 'Query reminders'],
        },
        { title: 'Permissions', count: '5', cards: ['Owner', 'Manager', 'Telecaller'] },
      ]}
    />
  );
}

function LeadSourceSetup() {
  return (
    <DataTable
      headers={['Source', 'Owner', 'Leads MTD', 'Status']}
      rows={[
        ['Referral', 'Amit Kumar', '42', 'Active'],
        ['Google Ads', 'Riya Sharma', '31', 'Active'],
        ['Field Visit', 'Karan Mehta', '19', 'Active'],
        ['Partner API', 'Neha Jain', '8', 'Testing'],
      ]}
    />
  );
}

function LoanProductSetup() {
  return (
    <DataTable
      headers={['Product', 'Lenders', 'Min Ticket', 'Status']}
      rows={[
        ['Home Loan', '8 lenders', 'Rs 10L', 'Active'],
        ['Personal Loan', '5 lenders', 'Rs 50K', 'Active'],
        ['Business Loan', '6 lenders', 'Rs 2L', 'Active'],
        ['Loan Against Property', '4 lenders', 'Rs 15L', 'Draft'],
      ]}
    />
  );
}
