import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export default function PreviewFooter() {
  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.sectionInner}>
          <div className={styles.footerTop}><Image src="/assets/brand-preview/credittrust-loop-gradient-concept.png" alt="CreditTrust" width={2172} height={724} className={styles.footerLogo} sizes="210px" /><p>Digital journeys for financial possibilities.</p><div><Link href="/about">About</Link><Link href="/partner-program">Partners</Link><Link href="/privacy-policy">Privacy</Link><Link href="/terms-and-conditions">Terms</Link><a href="mailto:support@credittrust.in">Contact</a></div></div>
          <div className={styles.footerBottom}><p>CreditTrust is a brand/platform owned, operated, and managed by Fin Coopers Tech India Private Limited.</p><p>© 2026 CreditTrust. A brand/platform owned and operated by Fin Coopers Tech India Private Limited. All rights reserved.</p></div>
        </div>
      </footer>
      <p className={styles.previewNote}>The Apply journey is a demo only. No SMS is sent, no application is submitted, and no loan offer is guaranteed.</p>
    </>
  );
}
