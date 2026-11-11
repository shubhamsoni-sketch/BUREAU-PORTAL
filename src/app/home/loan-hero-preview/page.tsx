import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Check, ChevronDown, ClipboardCheck, Handshake, Headphones, Layers3, Laptop2, LockKeyhole, MousePointer2, Send, ShieldCheck, Sparkles } from 'lucide-react';
import EmiPlanner from './EmiPlanner';
import FloatingApply from './FloatingApply';
import PreviewFooter from './PreviewFooter';
import PreviewHeader from './PreviewHeader';
import RevealOnScroll from './RevealOnScroll';
import SmoothScroll from './SmoothScroll';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Loan Website Preview | CreditTrust',
  robots: { index: false, follow: false },
};

const journey = [
  { icon: Laptop2, label: 'Simple digital journey' },
  { icon: Layers3, label: 'Explore your options' },
  { icon: Check, label: 'Clear next steps' },
];

const categories = [
  { title: 'Personal Loan', description: 'For the plans, milestones, and expenses that matter to you.', image: '/assets/images/loan-category-personal.png', tone: 'lavender' },
  { title: 'Business Loan', description: 'Explore a funding path for your next business move.', image: '/assets/images/loan-category-business.png', tone: 'cream' },
  { title: 'Emergency Expenses', description: 'Find a practical starting point when life moves unexpectedly.', image: '/assets/images/loan-category-emergency.png', tone: 'pink' },
];

const steps = [
  { number: '01', icon: MousePointer2, title: 'Choose your need', description: 'Tell us what you are looking for and where you want to begin.' },
  { number: '02', icon: Send, title: 'Share your details', description: 'Provide the information needed to continue, with your consent.' },
  { number: '03', icon: ClipboardCheck, title: 'Review the path', description: 'Understand the available next step for your request, where applicable.' },
  { number: '04', icon: Handshake, title: 'Continue with a provider', description: 'Any final verification, terms, and decision come from the relevant provider.' },
];

const benefits = [
  { icon: Laptop2, title: 'Digital from the start', description: 'Begin your enquiry without a complicated offline process.' },
  { icon: BadgeCheck, title: 'Clarity at each step', description: 'Know what information is needed and what comes next.' },
  { icon: LockKeyhole, title: 'Consent-led journey', description: 'Your information is requested for a defined purpose.' },
  { icon: Headphones, title: 'Support when needed', description: 'Reach the CreditTrust team when you need help navigating the process.' },
];

const faqs = [
  { question: 'Does an enquiry guarantee a loan?', answer: 'No. An enquiry or application does not guarantee approval. The relevant provider makes the final decision based on its policies and assessment.' },
  { question: 'What information will I need to share?', answer: 'The selected journey will show the details needed to proceed. Please review the consent notice before sharing personal information.' },
  { question: 'Will I know the final rate and charges?', answer: 'The relevant provider must disclose final rates, fees, and terms before you accept an offer. Figures in the EMI planner are illustrative only.' },
  { question: 'How will my information be used?', answer: 'Use of your information is governed by the CreditTrust Privacy Policy and the consent you provide for a specific journey.' },
  { question: 'Can I speak to someone for help?', answer: 'Yes. Email support@credittrust.in for help with the CreditTrust platform journey.' },
];

export default function LoanHeroPreview() {
  return (
    <main className={styles.page} data-loan-preview>
      <RevealOnScroll />
      <SmoothScroll />
      <PreviewHeader active="home" />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.mesh} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.copy}>
            <h1 id="hero-title">Your next move <span>starts with the right loan.</span></h1>
            <p className={styles.intro}>Explore loan options through a simple digital journey designed around your needs. Know the path ahead before you take the next step.</p>
            <div className={styles.actions}>
              <a className={styles.primaryCta} href="mailto:support@credittrust.in?subject=Loan%20options%20enquiry">Explore Loan Options <ArrowRight size={21} strokeWidth={2.4} /></a>
              <a className={styles.secondaryCta} href="#how-it-works">How It Works <ChevronDown size={19} /></a>
            </div>
            <div className={styles.proof} aria-label="Journey highlights">
              {journey.map(({ icon: Icon, label }) => (
                <span key={label}><Icon size={19} strokeWidth={1.8} />{label}</span>
              ))}
            </div>
          </div>
          <div className={styles.visual}>
            <div className={styles.halo} aria-hidden="true" />
            <Image
              className={styles.person}
              src="/assets/images/loan-hero-person.png"
              alt="Customer using a phone to explore a digital loan journey"
              width={1672}
              height={941}
              priority
              sizes="(max-width: 700px) 100vw, (max-width: 1100px) 65vw, 900px"
            />
          </div>
        </div>
        <div className={styles.bottomLine} aria-hidden="true" />
      </section>

      <section className={styles.journey} id="journey" aria-label="How the journey works">
        <p>One clear path forward</p>
        <div><span>01 <b>Tell us your need</b></span><ArrowRight size={19} /><span>02 <b>Share details with consent</b></span><ArrowRight size={19} /><span>03 <b>Review the next step</b></span></div>
      </section>

      <section className={styles.section} id="loan-options" aria-labelledby="categories-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeading} data-reveal>
            <p className={styles.kicker}>Find your starting point</p>
            <h2 id="categories-title">A loan for every <em>next move.</em></h2>
            <p>Different goals deserve different paths. Explore what fits the moment you are planning for.</p>
          </div>
          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <article className={`${styles.categoryCard} ${styles[category.tone]}`} key={category.title} data-reveal>
                <div className={styles.categoryCopy}>
                  <span className={styles.categoryEyebrow}>Explore your options</span>
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                  <a href={`mailto:support@credittrust.in?subject=${encodeURIComponent(`${category.title} enquiry`)}`} aria-label={`Enquire about ${category.title}`} className={styles.cardArrow}><ArrowRight size={20} /></a>
                </div>
                <Image src={category.image} alt="" width={880} height={720} className={styles.categoryImage} sizes="(max-width: 700px) 50vw, 25vw" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.phoneSection} id="personal-loan-journey" aria-labelledby="phone-section-title">
        <div className={styles.sectionInner}>
          <div className={styles.phoneHeading} data-reveal>
            <p className={styles.kicker}>Personal loan journey</p>
            <h2 id="phone-section-title">Explore a personal loan <em>without the guesswork.</em></h2>
            <p>From your first enquiry to the next step, see a simpler way to move forward.</p>
          </div>
          <div className={styles.phoneLayout}>
            <div className={styles.phoneScene} aria-label="Illustration of the CreditTrust digital loan journey" role="img" data-reveal>
              <div className={styles.phoneOrbit} aria-hidden="true" />
              <div className={styles.phoneGlow} aria-hidden="true" />
              <div className={styles.phoneDevice} aria-hidden="true">
                <div className={styles.phoneScreen}>
                  <div className={styles.phoneStatus}><span>9:41</span><span>●●●</span></div>
                  <div className={styles.phoneBrand}><span className={styles.phoneBrandMark}>C</span><b>CreditTrust</b><span className={styles.phoneMenu}>☰</span></div>
                  <div className={styles.phoneWelcome}><small>YOUR JOURNEY</small><strong>Explore what fits your plans.</strong><span>A clear starting point, step by step.</span></div>
                  <div className={styles.phoneProgress}><span className={styles.phoneProgressActive} /><span /><span /></div>
                  <div className={styles.phoneChoice}><span className={styles.phoneChoiceIcon}><Layers3 size={18} /></span><div><b>Personal loan</b><small>For the plans ahead</small></div><ArrowRight size={15} /></div>
                  <div className={styles.phoneChoice}><span className={styles.phoneChoiceIcon}><ClipboardCheck size={18} /></span><div><b>Share your details</b><small>With your consent</small></div><ArrowRight size={15} /></div>
                  <div className={styles.phoneChoice}><span className={styles.phoneChoiceIcon}><BadgeCheck size={18} /></span><div><b>Review next steps</b><small>Know what comes next</small></div><ArrowRight size={15} /></div>
                  <div className={styles.phoneScreenButton}>Explore your options <ArrowRight size={14} /></div>
                  <p className={styles.phoneIllustrationNote}>Illustrative journey preview</p>
                </div>
              </div>
              <span className={`${styles.phoneSpark} ${styles.phoneSparkOne}`} aria-hidden="true">✦</span>
              <span className={`${styles.phoneSpark} ${styles.phoneSparkTwo}`} aria-hidden="true">✦</span>
            </div>
            <div className={styles.phoneFeatures}>
              <article className={styles.phoneFeature} data-reveal>
                <span className={styles.phoneFeatureIcon}><MousePointer2 size={22} /></span>
                <div><h3>Start in a few steps</h3><p>Tell us what you need through a simple digital enquiry.</p></div>
              </article>
              <article className={styles.phoneFeature} data-reveal>
                <span className={`${styles.phoneFeatureIcon} ${styles.phoneFeatureIconBlue}`}><ClipboardCheck size={22} /></span>
                <div><h3>Know the path ahead</h3><p>See what information is needed and what happens next.</p></div>
              </article>
              <article className={styles.phoneFeature} data-reveal>
                <span className={`${styles.phoneFeatureIcon} ${styles.phoneFeatureIconGold}`}><ShieldCheck size={22} /></span>
                <div><h3>Continue with confidence</h3><p>Any offer or approval is decided by the relevant provider.</p></div>
              </article>
            </div>
          </div>
          <div className={styles.phoneTrustStrip} data-reveal>
            <strong>Built around a clearer journey</strong>
            <span><Check size={18} /> Digital-first</span>
            <span><ShieldCheck size={18} /> Consent-led</span>
            <span><Headphones size={18} /> Support when needed</span>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.stepsSection}`} id="how-it-works" aria-labelledby="steps-title">
        <div className={styles.sectionInner}>
          <div className={styles.stepsLayout}>
            <div className={styles.stepsIntro} data-reveal>
              <p className={styles.kicker}>How it works</p>
              <h2 id="steps-title">From “what if” to <em>what&apos;s next.</em></h2>
              <p>Four straightforward steps to help you move from an idea to an informed next step.</p>
              <Image src="/assets/images/loan-how-it-works.png" alt="Illustration of a guided digital journey" width={1000} height={780} className={styles.stepsImage} sizes="(max-width: 860px) 80vw, 35vw" />
            </div>
            <div className={styles.stepsList}>
              {steps.map(({ number, icon: Icon, title, description }) => (
                <article className={styles.step} key={number} data-reveal>
                  <span className={styles.stepNumber}>{number}</span>
                  <span className={styles.stepIcon}><Icon size={23} strokeWidth={1.8} /></span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                </article>
              ))}
              <p className={styles.stepsFootnote}><ShieldCheck size={18} /> You stay informed at each stage of the journey.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.whySection}`} aria-labelledby="why-title">
        <div className={`${styles.sectionInner} ${styles.whyLayout}`}>
          <div className={styles.whyVisual} data-reveal>
            <Image src="/assets/images/loan-why-credittrust.png" alt="Customer reviewing the next steps in a financial journey" width={1100} height={850} className={styles.whyImage} sizes="(max-width: 860px) 90vw, 42vw" />
            <div className={styles.whyBadge}><Sparkles size={18} /> Your next step, clearer</div>
          </div>
          <div className={styles.whyCopy} data-reveal>
            <p className={styles.kicker}>Why CreditTrust</p>
            <h2 id="why-title">More clarity. <em>Less guesswork.</em></h2>
            <p className={styles.sectionLead}>A digital experience built around the questions you actually have, not a maze of forms and fine print.</p>
            <div className={styles.benefitGrid}>
              {benefits.map(({ icon: Icon, title, description }) => (
                <article className={styles.benefit} key={title}>
                  <span><Icon size={21} /></span><div><h3>{title}</h3><p>{description}</p></div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <EmiPlanner />

      <section className={`${styles.section} ${styles.partnerSection}`} aria-labelledby="partner-title">
        <div className={`${styles.sectionInner} ${styles.partnerLayout}`}>
          <div data-reveal>
            <p className={styles.kicker}>For partners</p>
            <h2 id="partner-title">A connected journey <em>for your team.</em></h2>
            <p>CreditTrust supports partner-led customer workflows through a dedicated workspace. Explore the tools designed to keep your team and customer journey in sync.</p>
            <Link href="/partner-program" className={styles.partnerLink}>Explore partner program <ArrowRight size={19} /></Link>
          </div>
          <Image src="/assets/images/loan-partners.png" alt="Partner team collaborating on a digital workflow" width={1100} height={850} className={styles.partnerImage} sizes="(max-width: 860px) 90vw, 42vw" data-reveal />
        </div>
      </section>

      <section className={`${styles.section} ${styles.faqSection}`} id="faq" aria-labelledby="faq-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeading} data-reveal><p className={styles.kicker}>Good to know</p><h2 id="faq-title">Questions? <em>Let&apos;s make it clear.</em></h2></div>
          <div className={styles.faqList}>
            {faqs.map(({ question, answer }) => <details key={question} className={styles.faqItem} data-reveal><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className={styles.closingSection} aria-labelledby="closing-title">
        <div className={styles.closingGlow} aria-hidden="true" />
        <div className={styles.sectionInner}>
          <p className={styles.closingKicker}>Start with a clearer path</p>
          <h2 id="closing-title">Your next chapter <em>starts here.</em></h2>
          <p>Tell us what you need. We&apos;ll help you find the right place to begin.</p>
          <a className={styles.primaryCta} href="mailto:support@credittrust.in?subject=Loan%20options%20enquiry">Explore Loan Options <ArrowRight size={21} /></a>
          <small>Loan availability, rates, fees, and final decisions depend on the relevant provider. No approval is guaranteed.</small>
        </div>
      </section>

      <PreviewFooter />
      <FloatingApply />
    </main>
  );
}
