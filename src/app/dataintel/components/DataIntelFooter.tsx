import Link from 'next/link';
import Image from 'next/image';

export default function DataIntelFooter() {
  return (
    <footer className="border-t py-10 px-6" style={{ borderColor: '#1e293b' }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/dataintel" className="flex items-center gap-2.5 group">
          <Image src="/assets/images/credit-trust-mark.svg" alt="Credit Trust Logo" width={28} height={28} className="flex-shrink-0" />
          <span
            style={{ fontFamily: 'Fraunces, serif' }}
            className="text-base font-semibold text-[#94a3b8] group-hover:text-[#f1f5f9] transition-colors"
          >
            DataIntel
          </span>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-[#64748b]">
          <a href="#capabilities" className="hover:text-[#f1f5f9] transition-colors">Capabilities</a>
          <a href="#pipeline" className="hover:text-[#f1f5f9] transition-colors">How it works</a>
          <Link href="/dataintel/pricing" className="hover:text-[#f1f5f9] transition-colors">Pricing</Link>
          <Link href="/dataintel/dashboard" className="hover:text-[#f1f5f9] transition-colors">Dashboard</Link>
          <Link href="/dataintel/sign-up-login" className="hover:text-[#f1f5f9] transition-colors">Sign in</Link>
        </div>

        <div className="flex items-center gap-5">
          <a href="#" aria-label="Twitter" className="text-[#64748b] hover:text-[#f1f5f9] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </a>
          <a href="#" aria-label="LinkedIn" className="text-[#64748b] hover:text-[#f1f5f9] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          </a>
          <span className="text-[#64748b] text-xs">Privacy · Terms</span>
          <span className="text-[#64748b] text-xs">© 2026</span>
        </div>
      </div>
    </footer>
  );
}
