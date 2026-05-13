'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import AppLogo from '@/components/ui/AppLogo';

const footerLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'For Partners', href: '/partner-program' },
  { label: 'Partner Login', href: '/partner-login' },
  { label: 'Become a Partner', href: '/become-a-partner' },
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Refunds', href: '/refund-policy' },
  { label: 'Usage', href: '/usage-policy' },
  { label: 'Terms', href: '/terms-and-conditions' },
];

export default function Footer() {
  const [year, setYear] = useState('');

  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="border-t border-white/5 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
            <AppLogo size={36} width={154} height={36} />
            <div className="sm:border-l sm:border-white/10 sm:pl-3">
              <p className="text-fg-subtle text-xs">
                Financial health reports for individuals and partners.
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                To know more, mail us at{' '}
                <a href="mailto:support@credittrust.in" className="text-primary hover:text-primary-light transition-colors">
                  support@credittrust.in
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 sm:gap-6 flex-wrap justify-center">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-fg-muted hover:text-fg transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-fg-subtle">
          <span>
            {year
              ? `(c) ${year} Credit Trust. All rights reserved. Powered by Fincoopers Tech India Private Limited.`
              : '(c) Credit Trust. All rights reserved. Powered by Fincoopers Tech India Private Limited.'}
          </span>
          <span className="text-center">Independent financial intelligence platform for credit health workflows.</span>
        </div>
      </div>
    </footer>
  );
}
