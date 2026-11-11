import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import styles from './page.module.css';

export default function FloatingApply() {
  return (
    <Link
      className={styles.floatingApply}
      href="/home/loan-hero-preview/apply"
      aria-label="Open demo loan enquiry journey"
    >
      <span className={styles.floatingApplyIcon} aria-hidden="true"><Sparkles size={19} /></span>
      <span className={styles.floatingApplyCopy}><small>PREVIEW JOURNEY</small><strong>Apply Demo</strong></span>
      <span className={styles.floatingApplyArrow} aria-hidden="true"><ArrowUpRight size={19} /></span>
    </Link>
  );
}
