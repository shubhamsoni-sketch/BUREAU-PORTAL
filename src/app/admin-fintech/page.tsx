import type { Metadata } from 'next';
import { Building2, ClipboardList, FileCheck2, LayoutGrid, Plug, ShieldCheck } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

export const metadata: Metadata = {
  title: 'Fintech | CreditTrust Admin',
  description: 'CreditTrust Fintech administration workspace.',
  robots: { index: false, follow: false },
};

const areas = [
  {
    title: 'Lender onboarding',
    description: 'Manage lender identity, agreements, contacts and activation approvals.',
    icon: Building2,
    items: ['Lender profile', 'Agreement and approval status', 'Test and live environments'],
  },
  {
    title: 'Loan products',
    description: 'Configure products and the terms that are permitted to appear to customers.',
    icon: LayoutGrid,
    items: ['Product eligibility rules', 'Amount and tenure limits', 'Customer-facing disclosures'],
  },
  {
    title: 'Customer enquiries',
    description: 'Track verified, consented enquiries from the CreditTrust customer journey.',
    icon: ClipboardList,
    items: ['Enquiry status', 'Consent reference', 'Lender sharing history'],
  },
  {
    title: 'Offers and applications',
    description: 'Review lender responses and follow each application through its status changes.',
    icon: FileCheck2,
    items: ['Lender response', 'Offer comparison', 'Application and callback status'],
  },
  {
    title: 'Lender integrations',
    description: 'Keep lender API settings isolated from the existing bureau and partner integrations.',
    icon: Plug,
    items: ['Credential configuration', 'UAT connectivity', 'Signed callbacks'],
  },
  {
    title: 'Consent and audit',
    description: 'Record customer permission, disclosures, access and operational changes.',
    icon: ShieldCheck,
    items: ['Consent version and timestamp', 'Admin change log', 'Data-sharing audit'],
  },
];

export default function AdminFintechPage() {
  return (
    <AdminLayout title="Fintech">
      <div className="mx-auto max-w-7xl space-y-7 p-5 md:p-8">
        <header className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">CreditTrust admin / Fintech</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Fintech workspace</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">One place to set up lenders, products, customer enquiries and the offer journey. This workspace is separate from the existing CIBIL, API Hub and partner modules.</p>
            </div>
            <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-200">Foundation ready</span>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-amber-950">Backend setup pending</h2>
            <p className="mt-1 text-xs leading-5 text-amber-900">No lender records, customer enquiries or live offers are connected to this screen yet. The customer journey remains a design preview.</p>
          </div>
        </div>

        <section aria-labelledby="workspace-areas">
          <div className="mb-4">
            <h2 id="workspace-areas" className="text-xl font-bold text-slate-900">Workspace areas</h2>
            <p className="mt-1 text-sm text-slate-500">These are the modules we will connect to the Fintech backend.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {areas.map(({ title, description, icon: Icon, items }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon size={19} /></span>
                  <div><h3 className="text-base font-bold text-slate-900">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
                </div>
                <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                  {items.map((item) => <li key={item} className="flex items-center gap-2 text-xs text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />{item}</li>)}
                </ul>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">To be connected</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
