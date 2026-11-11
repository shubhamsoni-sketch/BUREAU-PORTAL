import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import CustomerSidebar from '../CustomerSidebar';
import CustomerGreeting from './CustomerGreeting';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Your Options | CreditTrust Preview',
  description: 'Preview the CreditTrust loan options screen.',
  robots: { index: false, follow: false },
};

type ActiveLender = { id: string; display_name: string; product_type: string; description: string };

const apiOrigin = process.env.FINTECH_LENDER_API_ORIGIN || 'https://credittrust.in';

async function activeLenders(): Promise<{ lenders: ActiveLender[]; unavailable: boolean }> {
  try {
    const response = await fetch(`${apiOrigin}/api/fintech/lenders`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Lender list unavailable');
    const body: { lenders?: ActiveLender[] } = await response.json();
    return { lenders: Array.isArray(body.lenders) ? body.lenders : [], unavailable: false };
  } catch {
    return { lenders: [], unavailable: true };
  }
}

const productLabels: Record<string, string> = {
  personal_loan: 'Personal loan', business_loan: 'Business loan', gold_loan: 'Gold loan', other: 'Loan option',
};

export default async function OffersPreviewPage() {
  const { lenders, unavailable } = await activeLenders();
  return (
    <main className={styles.shell}>
      <CustomerSidebar active="offers" />

      <div className={styles.mainArea}>
        <div className={styles.content}>
          <section className={styles.journey} aria-labelledby="journey-title">
            <div className={styles.welcome}><CustomerGreeting /><p>Your personalised financial space.</p></div>
            <div className={styles.journeyCopy}><p className={styles.journeyEyebrow}>FINANCIAL JOURNEY</p><h1 id="journey-title">Your next financial move, <em>made clear.</em></h1></div>
          </section>

          <div className={styles.heading}><div><h2>Explore lending partners</h2><p>Choose a partner to continue to its own application journey.</p></div><span>{lenders.length} available</span></div>
          {lenders.length === 0 && <p className={styles.disclaimer}>{unavailable ? 'Lender options are temporarily unavailable. Please try again shortly.' : 'No lending partners are available right now.'}</p>}
          <section id="offers" className={styles.grid} aria-label="Available lending partners">
            {lenders.map((lender, index) => (
              <article className={styles.offer} key={lender.id} style={{ animationDelay: `${index * 80}ms` }}>
                <div className={styles.offerHeader}>
                  <span className={styles.offerMark} aria-hidden="true">{lender.display_name.charAt(0)}</span>
                  <div><h3>{lender.display_name}</h3><p>Lending partner</p></div>
                </div>
                <span className={styles.tag}>{productLabels[lender.product_type] || productLabels.other}</span>
                <h4 className={styles.offerHeadline}>Explore {lender.display_name}</h4>
                <p className={styles.offerDescription}>{lender.description || 'Continue to the lender to review its current eligibility and terms.'}</p>
                <dl className={styles.offerFacts}>
                  <div><dt>NEXT STEP</dt><dd>Lender application</dd></div>
                  <div><dt>RATES & TERMS</dt><dd>Shown by lender</dd></div>
                </dl>
                <div className={styles.offerFooter}>
                  <a className={styles.applyButton} href={`${apiOrigin}/api/fintech/lenders/${lender.id}/apply`} rel="noreferrer">Apply Now <ArrowRight size={16} /></a>
                </div>
              </article>
            ))}
          </section>
          <p className={styles.disclaimer}>CreditTrust does not guarantee loan approval, a particular rate, disbursal, or a lender decision.</p>
        </div>
      </div>
    </main>
  );
}
