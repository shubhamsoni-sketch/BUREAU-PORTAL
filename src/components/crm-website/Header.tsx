'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/crm-website/AppLogo';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/features' },
  { label: 'Eligibility', href: '/eligibility-checker' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-nav shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <AppLogo size={36} />
          <span className="font-bold text-lg tracking-tight text-primary hidden sm:block">
            CreditTrust
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks?.map((link) => (
            <Link
              key={link?.href}
              href={link?.href}
              className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors duration-200"
            >
              {link?.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://crm.credittrust.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary hover:text-accent transition-colors px-4 py-2"
          >
            Login
          </a>
          <Link
            href="/contact"
            className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-accent transition-colors duration-200"
          >
            Book Demo
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <a
            href="https://crm.credittrust.in"
            className="rounded-lg border border-primary/15 px-3 py-2 text-sm font-bold text-primary"
          >
            Login
          </a>
          <button
            className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {/* Mobile Overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-white/95 backdrop-blur-md flex flex-col px-6 pt-8 gap-2">
          {navLinks?.map((link) => (
            <Link
              key={link?.href}
              href={link?.href}
              onClick={() => setMenuOpen(false)}
              className="text-base font-semibold text-foreground hover:text-accent py-3 border-b border-border transition-colors"
            >
              {link?.label}
            </Link>
          ))}
          <div className="pt-6 flex flex-col gap-3">
            <a
              href="https://crm.credittrust.in"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center text-base font-bold border border-primary/20 text-primary px-6 py-3.5 rounded-lg hover:bg-primary/5 transition-colors"
            >
              Login
            </a>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center text-base font-bold bg-primary text-primary-foreground px-6 py-3.5 rounded-lg hover:bg-accent transition-colors"
            >
              Book Demo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
