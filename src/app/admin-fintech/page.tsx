import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowUpRight,
  Building2,
  ClipboardList,
  FileCheck2,
  LayoutGrid,
  Plug,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { fintechSections } from '@/lib/fintech/workspace';

export const metadata: Metadata = {
  title: 'Fintech Dashboard | CreditTrust Admin',
  description: 'CreditTrust Fintech administration workspace.',
  robots: { index: false, follow: false },
};

const icons: Record<(typeof fintechSections)[number]['slug'], LucideIcon> = {
  lenders: Building2,
  products: LayoutGrid,
  enquiries: ClipboardList,
  offers: FileCheck2,
  integrations: Plug,
  audit: ShieldCheck,
};

export default function AdminFintechPage() {
  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[28px] bg-[#0d1930] px-6 py-7 text-white sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-teal-300/20 bg-teal-300/5" />
        <div className="pointer-events-none absolute -bottom-40 right-28 h-72 w-72 rounded-full border border-sky-300/10" />
        <div className="relative max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-300">Fintech dashboard</p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">One workspace for the lending journey.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Set up lenders and products, then manage customer enquiries, offers, integrations and consent in a dedicated area separate from the main admin portal.</p>
          <span className="mt-5 inline-flex rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-200">Workspace structure ready | Backend connection pending</span>
        </div>
      </section>

      <section aria-labelledby="fintech-areas">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="fintech-areas" className="text-xl font-bold tracking-tight text-slate-900">Explore the workspace</h2>
            <p className="mt-1 text-sm text-slate-500">Each area has its own page and will connect to the Fintech backend next.</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">06 work areas</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fintechSections.map((section, index) => {
            const Icon = icons[section.slug];
            return (
              <Link key={section.slug} href={`/admin-fintech/${section.slug}`} className="group flex min-h-[210px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-800"><Icon size={21} aria-hidden="true" /></span>
                  <span className="font-mono text-xs text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">{section.title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">{section.description}</p>
                <span className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-bold text-teal-800 group-hover:text-teal-600">Open area <ArrowUpRight size={14} aria-hidden="true" /></span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
