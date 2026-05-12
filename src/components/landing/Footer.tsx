'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const footerLinks = [
  { label: 'For Partners', href: '/partner-program' },
  { label: 'Partner Login', href: '/partner-login' },
  { label: 'Become a Partner', href: '/become-a-partner' },
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Refunds', href: '/refund-policy' },
  { label: 'Usage', href: '/usage-policy' },
  { label: 'Terms', href: '/terms-and-conditions' },
  { label: 'Contact', href: '/contact' },
];

export default function Footer() {
  const [year, setYear] = useState('');

  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="border-t border-white/5 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-xl bg-primary text-bg flex items-center justify-center text-sm font-bold">
              I
            </span>
            <span className="font-bold text-sm tracking-tight text-fg">
              Insight<span className="gradient-text-primary">IQ</span>
            </span>
            <span className="hidden md:block text-fg-subtle text-xs ml-2 border-l border-white/10 pl-3">
              Financial health reports for individuals and partners.
            </span>
          </div>

          <div className="flex items-center gap-5 sm:gap-6 flex-wrap justify-center">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-fg-muted hover:text-fg transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {['linkedin', 'x', 'mail'].map((item) => (
              <a
                key={item}
                href="#"
                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-fg-muted hover:text-primary hover:border-primary/40 transition-all"
                aria-label={item}
              >
                <Icon name="GlobeAltIcon" size={15} />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-fg-subtle">
          <span>{year ? `(c) ${year} InsightIQ. All rights reserved.` : '(c) InsightIQ. All rights reserved.'}</span>
          <span className="text-center">Independent financial intelligence platform for credit health workflows.</span>
        </div>
      </div>
    </footer>
  );
}
