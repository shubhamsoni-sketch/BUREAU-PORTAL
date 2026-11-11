import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Menu } from 'lucide-react';
import styles from './page.module.css';

const home = '/';
const about = '/about';
const instantLoan = '/personal-loan/instant-personal-loan';

export default function PreviewHeader({ active }: { active: 'home' | 'about' | 'personal-loan' }) {
  return (
    <header className={styles.header}>
      <div className={styles.navInner}>
        <Link href={home} className={styles.brand} aria-label="CreditTrust home">
          <Image src="/assets/brand-preview/credittrust-loop-gradient-concept.png" alt="CreditTrust" width={2172} height={724} className={styles.brandLogo} priority sizes="(max-width: 600px) 188px, 224px" />
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          {active === 'home' ? <span className={styles.activeNav}>Home</span> : <Link href={home}>Home</Link>}
          {active === 'about' ? <span className={styles.activeNav}>About us</span> : <Link href={about}>About us</Link>}
          <details className={styles.navDropdown}>
            <summary className={active === 'personal-loan' ? styles.activeNav : undefined}>Personal Loan <ChevronDown size={14} /></summary>
            <div className={styles.navDropdownMenu}><Link href={instantLoan}>Instant Personal Loan</Link></div>
          </details>
          <Link href={`${home}#how-it-works`}>How it works</Link>
          <Link href="/partner-program">Partners</Link>
        </nav>
        <div className={styles.navActions}>
          <details className={styles.mobileMenu}>
            <summary aria-label="Open navigation menu"><Menu size={21} /></summary>
            <nav className={styles.mobileMenuPanel} aria-label="Mobile navigation">
              <Link href={home}>Home</Link>
              <Link href={about} aria-current={active === 'about' ? 'page' : undefined}>About us</Link>
              <Link href={instantLoan}>Instant Personal Loan</Link>
              <Link href={`${home}#how-it-works`}>How it works</Link>
              <Link href="/partner-program">Partners</Link>
            </nav>
          </details>
          <a className={styles.navCta} href="mailto:support@credittrust.in?subject=Loan%20options%20enquiry">Enquire now <ArrowRight size={16} /></a>
        </div>
      </div>
    </header>
  );
}
