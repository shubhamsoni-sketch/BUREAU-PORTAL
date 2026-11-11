'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CircleHelp, ClipboardList, Home, LayoutGrid, LogOut, UserRound } from 'lucide-react';
import { useJourney } from './JourneyContext';
import styles from './offers/page.module.css';

const offersPath = '/home/loan-hero-preview/apply/offers';
const profilePath = '/home/loan-hero-preview/apply/profile';

export default function CustomerSidebar({ active }: { active: 'offers' | 'profile' }) {
  const router = useRouter();
  const { customerName, clearProfile } = useJourney();

  function logout() {
    clearProfile();
    router.replace('/home/loan-hero-preview/apply');
  }

  return (
    <aside className={styles.sidebar} aria-label="Customer space">
      <Link className={styles.sidebarBrand} href="/" aria-label="CreditTrust home">
        <Image src="/assets/brand-preview/credittrust-loop-gradient-concept.png" alt="CreditTrust" width={2172} height={724} priority sizes="140px" />
      </Link>
      <p className={styles.sidebarLabel}>CUSTOMER SPACE</p>
      <nav className={styles.navigation} aria-label="Customer navigation">
        <Link className={active === 'offers' ? styles.activeNav : undefined} aria-label="Offers" aria-current={active === 'offers' ? 'page' : undefined} href={offersPath}>
          <span className={styles.navIcon}><Home size={18} /></span><span className={styles.navLabel}>Offers</span>
        </Link>
        <Link aria-label="My options" href={`${offersPath}#offers`}>
          <span className={styles.navIcon}><LayoutGrid size={18} /></span><span className={styles.navLabel}>My options</span>
        </Link>
        <span className={styles.disabledNav} aria-disabled="true" title="Applications will be available after integration">
          <span className={styles.navIcon}><ClipboardList size={18} /></span><span className={styles.navLabel}>Applications</span>
        </span>
        <Link className={active === 'profile' ? styles.activeNav : undefined} aria-label="Profile" aria-current={active === 'profile' ? 'page' : undefined} href={profilePath}>
          <span className={styles.navIcon}><UserRound size={18} /></span><span className={styles.navLabel}>Profile</span>
        </Link>
        <a aria-label="Help" href="mailto:support@credittrust.in">
          <span className={styles.navIcon}><CircleHelp size={18} /></span><span className={styles.navLabel}>Help</span>
        </a>
        <button className={styles.logout} type="button" aria-label="Logout" onClick={logout}>
          <span className={styles.navIcon}><LogOut size={18} /></span><span className={styles.navLabel}>Logout</span>
        </button>
      </nav>
      <div className={styles.sideBottom}>
        <div className={styles.sideHelp}>
          <span className={styles.helpIcon}><CircleHelp size={19} /></span>
          <div><strong>Need help?</strong><p>Our team is here when you need us.</p><a href="mailto:support@credittrust.in">support@credittrust.in</a></div>
        </div>
        <div className={styles.profileCard}><strong>{customerName || 'Guest customer'}</strong><span>Preview profile</span></div>
      </div>
    </aside>
  );
}
