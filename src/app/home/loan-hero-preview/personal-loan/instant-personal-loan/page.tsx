import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, CalendarDays, ChevronRight, FileCheck2, HeartPulse, Home, Plane, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import EmiPlanner from '../../EmiPlanner';
import FloatingApply from '../../FloatingApply';
import PreviewFooter from '../../PreviewFooter';
import PreviewHeader from '../../PreviewHeader';
import RevealOnScroll from '../../RevealOnScroll';
import SmoothScroll from '../../SmoothScroll';
import shared from '../../page.module.css';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Instant Personal Loan | CreditTrust Preview',
  description: 'Explore a clear, consent-led personal loan enquiry journey and plan illustrative EMIs with CreditTrust.',
  robots: { index: false, follow: false },
};

const home = '/';
const enquiry = 'mailto:support@credittrust.in?subject=Instant%20Personal%20Loan%20enquiry';

const benefits = [
  { icon: WalletCards, title: 'A clear starting point', description: 'Understand the information needed before you begin an enquiry.' },
  { icon: FileCheck2, title: 'Digital-first journey', description: 'Move through the initial steps online, without unnecessary confusion.' },
  { icon: ShieldCheck, title: 'Consent-led by design', description: 'Share details for a defined purpose and review the next step.' },
];

const steps = [
  { number: '01', title: 'Tell us what you need', description: 'Start with your requirement and a way for our team to reach you.' },
  { number: '02', title: 'Share details with consent', description: 'Provide only the information requested for the selected journey.' },
  { number: '03', title: 'Review available next steps', description: 'Learn what verification, documents or provider interaction may follow.' },
  { number: '04', title: 'Decide with full clarity', description: 'Review the lender’s final terms before choosing whether to proceed.' },
];

const uses = [
  { icon: HeartPulse, title: 'Medical needs', description: 'Plan for an unexpected health-related expense.' },
  { icon: Home, title: 'Home plans', description: 'Explore options for repairs or improvements.' },
  { icon: Plane, title: 'Travel plans', description: 'Make room for a trip that matters to you.' },
  { icon: CalendarDays, title: 'Life events', description: 'Prepare for a milestone or family occasion.' },
];

const faqs = [
  { question: 'Does an enquiry mean my loan is approved?', answer: 'No. The relevant lender decides eligibility, approval, amount and terms after its own assessment.' },
  { question: 'How soon will I receive the money?', answer: 'The timeline depends on the provider, verification and your completed application. CreditTrust does not guarantee approval or disbursal speed.' },
  { question: 'What documents might I need?', answer: 'The provider may request identity, address and income information. Exact requirements are shared during the relevant journey.' },
  { question: 'Is the EMI shown here a loan offer?', answer: 'No. The calculator is illustrative. Your actual EMI depends on the rate, tenure, fees and terms disclosed by the lender.' },
];

export default function InstantPersonalLoanPreview() {
  return (
    <main className={`${shared.page} ${styles.detailPage}`} data-loan-preview>
      <RevealOnScroll />
      <SmoothScroll />
      <PreviewHeader active="personal-loan" />

      <section className={styles.hero} aria-labelledby="instant-title">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy} data-reveal>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href={home}>Home</Link><ChevronRight size={14} /><span>Personal Loan</span><ChevronRight size={14} /><span>Instant Personal Loan</span></nav>
            <p className={styles.eyebrow}><Sparkles size={15} /> PERSONAL LOAN, MADE CLEARER</p>
            <h1 id="instant-title">A faster start for <em>what matters now.</em></h1>
            <p>Explore personal loan options through a simple digital enquiry. See what comes next before you make a decision.</p>
            <div className={styles.heroActions}><a className={styles.primaryButton} href={enquiry}>Start an enquiry <ArrowRight size={18} /></a><a className={styles.textLink} href="#emi-planner">Plan an EMI <ArrowRight size={16} /></a></div>
            <div className={styles.heroNote}><ShieldCheck size={18} /><span>Any offer, approval, amount and timing depend on the relevant lender.</span></div>
          </div>
          <div className={styles.heroVisual} data-reveal>
            <span className={styles.visualGlow} aria-hidden="true" />
            <Image src="/assets/images/loan-how-it-works.png" alt="Illustration of a guided digital personal loan journey" width={1000} height={780} className={styles.heroImage} priority sizes="(max-width: 840px) 90vw, 44vw" />
            <span className={styles.visualTag}><BadgeCheck size={17} /> Clear next steps</span>
          </div>
        </div>
      </section>

      <section className={styles.introSection} aria-labelledby="what-is-title">
        <div className={styles.contentWidth}>
          <div className={styles.sectionIntro} data-reveal><p className={styles.kicker}>THE ESSENTIALS</p><h2 id="what-is-title">What is an <em>instant personal loan?</em></h2></div>
          <div className={styles.introGrid} data-reveal><p>It is a personal loan journey that begins digitally, so you can enquire and understand the next steps without starting with a branch visit. The provider still evaluates your application and confirms whether an offer is available.</p><div className={styles.introCallout}><span>Good to know</span><strong>Compare the full cost, not just the monthly EMI.</strong><p>Review the disclosed rate, fees, tenure and total repayment before accepting any lender offer.</p></div></div>
        </div>
      </section>

      <section className={styles.benefitsSection} aria-labelledby="benefits-title">
        <div className={styles.contentWidth}><div className={styles.centerHeading} data-reveal><p className={styles.kicker}>WHY START HERE</p><h2 id="benefits-title">Built for a <em>clearer borrowing journey.</em></h2><p>Less guesswork at the start. More context before the next decision.</p></div><div className={styles.benefitGrid}>{benefits.map(({ icon: Icon, title, description }) => <article className={styles.benefitCard} key={title} data-reveal><span className={styles.benefitIcon}><Icon size={24} /></span><h3>{title}</h3><p>{description}</p></article>)}</div></div>
      </section>

      <section className={styles.processSection} aria-labelledby="process-title">
        <div className={styles.contentWidth}><div className={styles.processHeading} data-reveal><p className={styles.kicker}>HOW IT WORKS</p><h2 id="process-title">From first question to <em>informed next step.</em></h2><p>A straightforward path, with each stage explained as you go.</p></div><div className={styles.processGrid}>{steps.map(({ number, title, description }) => <article className={styles.processCard} key={number} data-reveal><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></div>
      </section>

      <EmiPlanner />

      <section className={styles.usesSection} aria-labelledby="uses-title">
        <div className={styles.contentWidth}><div className={styles.centerHeading} data-reveal><p className={styles.kicker}>FOR THE PLANS AHEAD</p><h2 id="uses-title">One need can look <em>many different ways.</em></h2><p>These are common reasons people explore personal loans. Permitted use is subject to the lender’s terms.</p></div><div className={styles.usesGrid}>{uses.map(({ icon: Icon, title, description }) => <article className={styles.useCard} key={title} data-reveal><Icon size={23} /><div><h3>{title}</h3><p>{description}</p></div></article>)}</div></div>
      </section>

      <section className={styles.documentsSection} aria-labelledby="documents-title">
        <div className={styles.contentWidth}><div className={styles.documentLayout}><div data-reveal><p className={styles.kicker}>BE READY</p><h2 id="documents-title">A little preparation can make the next step easier.</h2><p>Document needs vary by lender and applicant profile. Keep your information accurate and only share it through the requested, consented process.</p><a className={styles.textLink} href={enquiry}>Ask about the journey <ArrowRight size={16} /></a></div><div className={styles.documentCards}><article data-reveal><FileCheck2 size={24} /><div><h3>Identity and address</h3><p>A provider may ask for PAN, identity and current address details for verification.</p></div></article><article data-reveal><WalletCards size={24} /><div><h3>Income and repayment capacity</h3><p>Salary, bank or business records may be requested depending on the provider’s assessment.</p></div></article></div></div></div>
      </section>

      <section className={styles.faqSection} aria-labelledby="instant-faq-title"><div className={styles.contentWidth}><div className={styles.centerHeading} data-reveal><p className={styles.kicker}>GOOD TO KNOW</p><h2 id="instant-faq-title">Questions before <em>you begin?</em></h2></div><div className={styles.faqList}>{faqs.map(({ question, answer }) => <details key={question} data-reveal><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>

      <section className={styles.closingSection}><div className={styles.contentWidth} data-reveal><p className={styles.kicker}>START WITH CLARITY</p><h2>Explore the next step, <em>on your terms.</em></h2><p>Tell us what you are looking for. We will help you understand where to begin.</p><a className={styles.primaryButton} href={enquiry}>Start an enquiry <ArrowRight size={18} /></a><small>CreditTrust does not guarantee loan approval, disbursal, rates or credit-score outcomes.</small></div></section>

      <PreviewFooter />
      <FloatingApply />
    </main>
  );
}
