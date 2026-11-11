'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  LayoutGrid,
  Plug,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { fintechSections } from '@/lib/fintech/workspace';

const sectionIcons: Record<(typeof fintechSections)[number]['slug'], LucideIcon> = {
  lenders: Building2,
  products: LayoutGrid,
  enquiries: ClipboardList,
  offers: FileCheck2,
  integrations: Plug,
  audit: ShieldCheck,
};

const navigation = [
  { label: 'Dashboard', href: '/admin-fintech', icon: LayoutDashboard },
  ...fintechSections.map((section) => ({
    label: section.navLabel,
    href: `/admin-fintech/${section.slug}`,
    icon: sectionIcons[section.slug],
  })),
];

export default function FintechShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const current = navigation.find((item) => item.href === pathname) ?? navigation[0];

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f3f6fa] text-slate-900">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#0d1930] text-white lg:flex">
        <Link href="/admin-fintech" className="flex h-20 items-center gap-3 border-b border-white/10 px-6" aria-label="Fintech dashboard">
          <AppLogo variant="light" width={135} height={40} />
        </Link>
        <div className="px-6 pb-4 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">Fintech control</p>
          <p className="mt-1 text-sm text-slate-400">Independent workspace</p>
        </div>
        <nav aria-label="Fintech workspace" className="flex-1 overflow-y-auto px-3 pb-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-teal-400/15 text-teal-200 ring-1 ring-inset ring-teal-400/25' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <Link href="/admin-dashboard" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
            <ArrowLeft size={16} aria-hidden="true" /> Back to main admin
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-7">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">CreditTrust / Fintech</p>
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">{current.label}</h1>
          </div>
          <Link href="/admin-dashboard" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800 lg:hidden">
            <ArrowLeft size={14} aria-hidden="true" /> Admin
          </Link>
          <span className="hidden rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 lg:inline-flex">Fintech workspace</span>
        </header>

        <nav aria-label="Fintech workspace" className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {navigation.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${active ? 'bg-[#0d1930] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {label}
              </Link>
            );
          })}
        </nav>

        <main id="fintech-main" className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-7 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
