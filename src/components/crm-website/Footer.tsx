import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/crm-website/AppLogo';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Row 1 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
          <Link href="/" className="flex items-center gap-2.5">
            <AppLogo size={32} />
            <span className="font-bold text-base text-primary">CreditTrust</span>
          </Link>
          <nav className="flex flex-wrap gap-x-8 gap-y-2">
            <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">Features</Link>
            <Link href="/eligibility-checker" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">Eligibility</Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">Pricing</Link>
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">About</Link>
            <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">Contact</Link>
          </nav>
          <a
            href="https://credittrust.in/contact"
            className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-accent transition-colors duration-200"
          >
            Book Demo
          </a>
        </div>
        {/* Row 2 */}
        <div className="border-t border-border pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">© 2026 CreditTrust. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="https://credittrust.in/privacy-policy" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">Privacy Policy</a>
            <a href="https://credittrust.in/terms-and-conditions" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
