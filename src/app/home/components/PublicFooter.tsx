import React from 'react';
import Link from 'next/link';

const footerLinks = {
  Product: [
    { label: 'For Individuals', href: '/for-individuals' },
    { label: 'For Partners', href: '/for-partners' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Get Analysis', href: '/get-analysis' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  Policies: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Refund Policy', href: '/refund-policy' },
    { label: 'Usage Policy', href: '/usage-policy' },
    { label: 'Terms & Conditions', href: '/terms-and-conditions' },
  ],
  Partners: [
    { label: 'Become a Partner', href: '/become-a-partner' },
    { label: 'Partner Login', href: '/partner-login' },
  ],
};

export default function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <Link href="/home" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">I</span>
              </div>
              <span className="text-slate-900 font-bold text-lg tracking-tight">InsightIQ</span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              Consent-based financial health reports for individuals and approved partner workflows.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-slate-900 text-sm font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-slate-500 hover:text-slate-900 text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            (c) {new Date().getFullYear()} InsightIQ. All rights reserved.
          </p>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <Link href="/privacy-policy" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
              Privacy
            </Link>
            <Link href="/refund-policy" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
              Refunds
            </Link>
            <Link href="/usage-policy" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
              Usage
            </Link>
            <Link href="/terms-and-conditions" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
