import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, ChevronRight, Compass, HeartHandshake, MoveUpRight, ShieldCheck, Sparkles } from 'lucide-react';
import FloatingApply from '../FloatingApply';
import PreviewFooter from '../PreviewFooter';
import PreviewHeader from '../PreviewHeader';
import RevealOnScroll from '../RevealOnScroll';
import shared from '../page.module.css';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'About Us | CreditTrust Preview',
  description: 'Learn about CreditTrust, our mission, and our vision for clearer financial journeys.',
  robots: { index: false, follow: false },
};

export default function AboutPreview() {
  return (
    <main className={`${shared.page} ${styles.aboutPage}`} data-loan-preview>
      <RevealOnScroll />
      <PreviewHeader active="about" />

      <section className={styles.hero} aria-labelledby="about-title">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy} data-reveal>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={14} /><span>About us</span></nav>
            <p className={styles.kicker}><Sparkles size={15} /> THE STORY BEHIND CREDITTRUST</p>
            <h1 id="about-title">Finance moves forward when <em>people feel informed.</em></h1>
            <p>We are building digital journeys that make it easier to explore financial options, understand the next step, and move ahead with clarity.</p>
          </div>
          <div className={styles.heroArt} aria-hidden="true" data-reveal>
            <span className={styles.orbitOne} /><span className={styles.orbitTwo} />
            <span className={styles.artCore}><span className={styles.artMark}>C</span><span>Clarity for<br />what comes next.</span><MoveUpRight size={26} /></span>
            <span className={styles.artChip}><ShieldCheck size={18} /> Consent-led journeys</span>
            <span className={styles.artSpark}><Sparkles size={29} /></span>
          </div>
        </div>
      </section>

      <section className={styles.aboutSection} aria-labelledby="who-title">
        <div className={styles.sectionGrid}>
          <div data-reveal><p className={styles.sectionIndex}>01 / ABOUT US</p><h2 id="who-title">Built around <em>better understanding.</em></h2></div>
          <div className={styles.aboutCopy} data-reveal>
            <p>CreditTrust brings financial information and digital enquiry journeys into a simpler, more approachable experience. We focus on helping people understand their options and what a responsible next step looks like.</p>
            <p>CreditTrust is a customer-facing brand/platform owned, operated, and managed by Fin Coopers Tech India Private Limited. Fin Coopers Tech India Private Limited owns the CreditTrust website, platform, brand assets, reports, and related workflows.</p>
            <p>CreditTrust provides credit report analysis and financial health insights. It does not guarantee loan approval, credit score improvement, or lender decisions.</p>
            <div className={styles.truthNote}><ShieldCheck size={20} /><span>CreditTrust does not guarantee loan approval, credit score improvement, or lender decisions.</span></div>
          </div>
        </div>
      </section>

      <section className={styles.purposeSection} aria-label="Our mission and vision">
        <div className={styles.purposeGrid}>
          <article className={styles.purposeCard} data-reveal>
            <span className={styles.purposeIcon}><HeartHandshake size={26} /></span>
            <span className={styles.cardIndex}>02 / OUR MISSION</span>
            <h2>Make the next step <em>feel clearer.</em></h2>
            <p>To create accessible, consent-led digital experiences that help people explore financial possibilities with useful information and transparent next steps.</p>
            <span className={styles.cardAccent} aria-hidden="true"><ArrowUpRight size={22} /></span>
          </article>
          <article className={`${styles.purposeCard} ${styles.visionCard}`} data-reveal>
            <span className={styles.purposeIcon}><Compass size={26} /></span>
            <span className={styles.cardIndex}>03 / OUR VISION</span>
            <h2>A more confident <em>financial journey.</em></h2>
            <p>A future where people can understand their financial choices, share information with confidence, and connect to the right opportunities without confusion.</p>
            <span className={styles.cardAccent} aria-hidden="true"><ArrowUpRight size={22} /></span>
          </article>
        </div>
      </section>

      <PreviewFooter />
      <FloatingApply />
    </main>
  );
}
