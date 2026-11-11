import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CircleDashed, LockKeyhole } from 'lucide-react';
import { notFound } from 'next/navigation';
import { fintechSections } from '@/lib/fintech/workspace';

type Props = { params: Promise<{ section: string }> };

export function generateStaticParams() {
  return fintechSections.map(({ slug }) => ({ section: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section: slug } = await params;
  const section = fintechSections.find((item) => item.slug === slug);
  return { title: `${section?.title ?? 'Fintech'} | CreditTrust Admin`, robots: { index: false, follow: false } };
}

export default async function FintechAreaPage({ params }: Props) {
  const { section: slug } = await params;
  const section = fintechSections.find((item) => item.slug === slug);
  if (!section) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin-fintech" className="inline-flex items-center gap-2 text-xs font-bold text-teal-800 hover:text-teal-600">
        <ArrowLeft size={14} aria-hidden="true" /> Workspace overview
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">Fintech workspace</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{section.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
          <CircleDashed size={14} aria-hidden="true" /> Setup pending
        </span>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <section aria-labelledby="area-scope" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 id="area-scope" className="text-base font-bold text-slate-900">Workspace scope</h3>
              <p className="mt-1 text-sm text-slate-500">What this area will manage once connected.</p>
            </div>
            <span className="font-mono text-xs text-slate-400">0{section.items.length} modules</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {section.items.map((item, index) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="font-mono text-xs font-semibold text-teal-700">0{index + 1}</span>
                <p className="mt-3 text-sm font-semibold leading-5 text-slate-800">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-[#f8fafb] p-5">
            <LockKeyhole size={18} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-slate-800">No live records connected yet</p>
              <p className="mt-1 text-sm leading-5 text-slate-500">The Fintech backend and customer journey will be connected in the next phase. No lender or customer data is being shown here.</p>
            </div>
          </div>
        </section>

        <aside className="self-start rounded-2xl bg-[#0d1930] p-6 text-white shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-300">Connection status</p>
          <h3 className="mt-3 text-xl font-bold">Ready for backend setup</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">The navigation and workspace are in place. Data, permissions and lender workflows are not active yet.</p>
          <Link href="/admin-fintech" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-teal-200 hover:text-white">
            View all areas <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
