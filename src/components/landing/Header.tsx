'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface HeaderProps {
  onGetReport: () => void;
}

const navItems = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Financial Analysis', href: '#report-preview' },
  { label: 'Security', href: '#trust' },
];

export default function Header({ onGetReport }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-bg/90 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2.5"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Go to top"
          >
            <span className="h-9 w-9 rounded-2xl bg-primary text-bg flex items-center justify-center font-bold shadow-glow-sm">
              I
            </span>
            <span className="font-bold text-lg tracking-tight text-fg hidden sm:block">
              Insight<span className="gradient-text-primary">IQ</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-full text-sm font-medium text-fg-muted hover:text-fg hover:bg-white/10 transition-all duration-200"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-2">
            <Link href="/partner-login" className="btn-ghost px-4 py-2.5 text-sm">
              Partner Login
            </Link>
            <Link href="/admin" className="btn-ghost px-4 py-2.5 text-sm">
              Admin
            </Link>
            <button type="button" onClick={onGetReport} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
              Start Analysis
              <Icon name="ArrowRightIcon" size={16} variant="solid" />
            </button>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-fg-muted hover:text-fg transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            type="button"
          >
            <Icon name="Bars3Icon" size={22} />
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${mobileOpen ? 'visible' : 'hidden'}`}>
        <button
          className="absolute top-5 right-5 p-2 text-fg-muted hover:text-fg transition-colors"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          type="button"
        >
          <Icon name="XMarkIcon" size={26} />
        </button>

        <div className="flex flex-col items-center gap-6">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-2xl font-semibold text-fg hover:text-primary transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Link href="/partner-login" className="btn-ghost px-8 py-3 text-base">
            Partner Login
          </Link>
          <Link href="/admin" className="btn-ghost px-8 py-3 text-base">
            Admin Login
          </Link>
          <button
            type="button"
            onClick={() => {
              onGetReport();
              setMobileOpen(false);
            }}
            className="btn-primary mt-2 px-8 py-3.5 text-base flex items-center gap-2"
          >
            Start Analysis
            <Icon name="ArrowRightIcon" size={18} variant="solid" />
          </button>
        </div>
      </div>
    </>
  );
}
