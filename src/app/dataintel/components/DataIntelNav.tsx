'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function DataIntelNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-500 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/dataintel" className="flex items-center gap-2.5 group">
          <Image
            src="/assets/images/app_logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="flex-shrink-0"
          />
          <span
            style={{ fontFamily: 'Fraunces, serif' }}
            className="text-lg font-semibold tracking-tight text-[#f1f5f9] group-hover:text-[#06b6d4] transition-colors"
          >
            DataIntel
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#capabilities" className="text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">Capabilities</a>
          <a href="#pipeline" className="text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">How it works</a>
          <Link href="/dataintel/pricing" className="text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dataintel/sign-up-login" className="hidden md:inline-flex text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">
            Sign in
          </Link>
          <Link
            href="/dataintel/sign-up-login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-[#06b6d4] text-[#080b14] hover:bg-[#22d3ee] transition-all duration-200"
            style={{ boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
          >
            Get access
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={14} height={14}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <button
            className="md:hidden p-2 text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={22} height={22}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 z-50" style={{ background: 'rgba(8,11,20,0.95)', backdropFilter: 'blur(20px)' }}>
          <div className="flex flex-col gap-4 px-6 py-6">
            <a href="#capabilities" className="text-sm font-medium text-[#94a3b8]" onClick={() => setMobileOpen(false)}>Capabilities</a>
            <a href="#pipeline" className="text-sm font-medium text-[#94a3b8]" onClick={() => setMobileOpen(false)}>How it works</a>
            <Link href="/dataintel/pricing" className="text-sm font-medium text-[#94a3b8]" onClick={() => setMobileOpen(false)}>Pricing</Link>
            <Link href="/dataintel/sign-up-login" className="text-sm font-medium text-[#94a3b8]" onClick={() => setMobileOpen(false)}>Sign in</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
