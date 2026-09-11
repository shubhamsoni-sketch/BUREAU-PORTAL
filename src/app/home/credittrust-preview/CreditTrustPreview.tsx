'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Ban,
  BarChart3,
  BookOpenCheck,
  Bot,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CreditCard,
  FileCheck2,
  FileSearch,
  FileText,
  Flag,
  Gauge,
  Globe2,
  Headphones,
  IndianRupee,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  Menu,
  MessageCircle,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  UserRoundCheck,
  WalletCards,
  X,
} from 'lucide-react';
import { useState } from 'react';
import styles from './credittrust-preview.module.css';

type Language = 'en' | 'hi';

const SAMPLE_REPORT_URL = '/credit-intelligence?request_id=shakti-demo';

const copy = {
  en: {
    nav: ['How It Works', "What You'll Learn", 'Sample Report', 'For Partners'],
    partner: 'Partner Login',
    headerCta: 'Get My Credit Analysis',
    eyebrow: 'GET CLARITY. MAKE BETTER MONEY DECISIONS.',
    heroLineOne: 'Loan Rejected?',
    heroLineTwo: 'Know Exactly Why.',
    heroCopy:
      'Get a deep analysis of your credit report, understand what is affecting your score and follow a clear plan for better credit decisions.',
    available: 'Available in English & Hindi',
    languageNote: 'Full website, payment journey, report and guidance in your chosen language.',
    heroCta: 'Get My Credit Analysis',
    sample: 'See Sample Report',
    assurances: ['Consent-based access', 'Secure payment', 'Private report', 'No guaranteed loan approval'],
    reportTitle: 'Your Credit Report Snapshot',
    asOf: 'Illustrative report preview',
    score: 'CIBIL Score',
    good: 'Good',
    readiness: 'Approval Readiness',
    moderate: 'Moderate',
    attention: 'Credit Health Needs Attention',
    attentionCopy: 'A few issues may be affecting your score and approval eligibility.',
    drivers: 'Top 3 Rejection Drivers',
    driverItems: ['Recent payment delays', 'High credit utilisation', 'Multiple recent enquiries'],
    noteOne: 'Clear reasons. Practical next steps.',
    questionsTitle: 'Your report should answer the questions that matter.',
    questionsSub: 'We turn complex bureau data into simple explanations and practical guidance.',
    questionCards: [
      {
        title: 'What is wrong in my current report?',
        text: 'Find overdue accounts, incorrect details, settlements and other red flags that may be hurting your credit profile.',
      },
      {
        title: 'Why may my approval be getting blocked?',
        text: 'Understand lender-visible risk factors that may be affecting your eligibility.',
      },
      {
        title: 'Why is my score being affected?',
        text: 'See how payment history, credit utilisation, enquiries and account behaviour influence your score.',
      },
      {
        title: 'What can I do to improve my credit health?',
        text: 'Get personalised, realistic actions to address issues and build a stronger profile.',
      },
      {
        title: 'How should I manage credit in the future?',
        text: 'Learn responsible utilisation, timely payments, enquiry discipline and ongoing review.',
      },
    ],
    deepTitle: 'More than a score. A complete credit understanding.',
    deepSub: 'Your report brings every important signal together, so you can see the big picture and take the right steps.',
    reportNav: ['Report Overview', 'Credit Health', 'Account Analysis', 'Score Factors', 'Correction Opportunities', 'Action Plan'],
    approvalBarriers: 'Approval Barriers',
    accountReview: 'Account-by-Account Review',
    impactFactors: 'Score Impact Factors',
    correction: 'Correction Opportunities',
    actionPlan: 'Next 30 / 60 / 90 Day Plan',
    viewDetails: 'See detailed analysis',
    viewAllAccounts: 'View all accounts',
    viewCorrectionDetails: 'View details',
    reportCreditHealth: 'Credit Health',
    positiveFactors: 'Positive factors',
    needsAttention: 'Needs attention',
    highPriority: 'High priority',
    accountTypes: ['Credit Cards', 'Personal Loan', 'Home Loan', 'Auto Loan'],
    factorNames: ['Payment History', 'Credit Utilisation', 'New Enquiries', 'Account Mix'],
    disputedIssues: 'issues may be disputed',
    actionPlanCopy: 'A practical plan to improve your credit health.',
    high: 'High',
    send: 'Send',
    planTitle: 'Everything you need. One simple plan.',
    planName: 'CreditTrust Complete Analysis',
    planLine: 'Deep insights. Clear explanations. A stronger financial tomorrow.',
    oneTime: 'One-time payment',
    planFeatures: [
      'Deep credit report analysis',
      'Current errors and risk flags',
      'Approval barrier explanation',
      'Personalised improvement roadmap',
      'Future credit management guidance',
      'English or Hindi report',
      'Report-aware AI Credit Advisor',
    ],
    planCta: 'Start My Credit Analysis',
    disclaimer:
      'Insights are based on available bureau data. No guaranteed score increase, correction or loan approval.',
    processTitle: 'From credit confusion to a clear plan.',
    process: [
      ['Analyse', 'We study your complete bureau report.'],
      ['Explain', 'We simplify the issues in your chosen language.'],
      ['Prioritise', 'We show what needs attention first.'],
      ['Guide', 'You receive a practical 30 / 60 / 90 day roadmap.'],
    ],
    bilingualTitle: 'Understand every insight in your language.',
    bilingualSub: 'Website, payment journey, report and guidance available in both languages.',
    englishQuestion: 'Why is my score affected?',
    englishAnswer: 'Get a clear explanation in simple language.',
    hindiQuestion: 'मेरा स्कोर क्यों प्रभावित हो रहा है?',
    hindiAnswer: 'अपनी क्रेडिट रिपोर्ट के प्रभावों को सरल भाषा में समझें।',
    advisorTitle: 'Ask Your Credit Advisor',
    advisorSub: 'Get instant, report-aware answers in English or Hindi.',
    advisorHello: "Hi! I'm your CreditTrust Advisor. Ask me anything about your credit report.",
    advisorQuestions: ['Why was my loan rejected?', 'What should I fix first?'],
    advisorPlaceholder: 'Type your question in English or Hindi...',
    noteTwo: 'Your report, explained simply.',
    trust: [
      ['Consent-based', 'You stay in control of your data.'],
      ['Secure & private', 'Your information stays safe.'],
      ['Transparent ₹999 pricing', 'No hidden fees.'],
      ['Educational guidance', 'Practical steps for a stronger financial future.'],
    ],
    finalTitle: 'Understand Today. Manage Better Tomorrow.',
    finalSub: 'Get clear answers from your report and a personalised path forward.',
    finalCta: 'Get My Credit Analysis',
    footerLine: 'Clear insights. A stronger financial tomorrow.',
    footerLinks: ['How It Works', "What You'll Learn", 'Sample Report', 'For Partners', 'FAQs', 'Contact Us'],
    legal: ['Privacy Policy', 'Terms of Use', 'Disclaimer'],
  },
  hi: {
    nav: ['यह कैसे काम करता है', 'आप क्या जानेंगे', 'सैंपल रिपोर्ट', 'पार्टनर्स के लिए'],
    partner: 'पार्टनर लॉगिन',
    headerCta: 'मेरा क्रेडिट विश्लेषण पाएं',
    eyebrow: 'स्पष्टता पाएं। बेहतर वित्तीय निर्णय लें।',
    heroLineOne: 'लोन रिजेक्ट हुआ?',
    heroLineTwo: 'सही कारण जानिए।',
    heroCopy:
      'अपनी क्रेडिट रिपोर्ट का गहरा विश्लेषण पाएं, समझें कि आपके स्कोर पर क्या असर पड़ रहा है और बेहतर क्रेडिट निर्णयों के लिए स्पष्ट योजना अपनाएं।',
    available: 'English और हिंदी में उपलब्ध',
    languageNote: 'वेबसाइट, पेमेंट, रिपोर्ट और मार्गदर्शन आपकी चुनी हुई भाषा में।',
    heroCta: 'मेरा क्रेडिट विश्लेषण पाएं',
    sample: 'सैंपल रिपोर्ट देखें',
    assurances: ['सहमति आधारित एक्सेस', 'सुरक्षित पेमेंट', 'निजी रिपोर्ट', 'लोन अप्रूवल की गारंटी नहीं'],
    reportTitle: 'आपकी क्रेडिट रिपोर्ट की झलक',
    asOf: 'उदाहरण रिपोर्ट प्रीव्यू',
    score: 'CIBIL स्कोर',
    good: 'अच्छा',
    readiness: 'अप्रूवल तैयारी',
    moderate: 'मध्यम',
    attention: 'क्रेडिट हेल्थ पर ध्यान जरूरी',
    attentionCopy: 'कुछ समस्याएं आपके स्कोर और अप्रूवल पात्रता को प्रभावित कर सकती हैं।',
    drivers: 'रिजेक्शन के 3 प्रमुख कारण',
    driverItems: ['हाल की पेमेंट देरी', 'ज्यादा क्रेडिट उपयोग', 'कई नई पूछताछ'],
    noteOne: 'स्पष्ट कारण। सही अगला कदम।',
    questionsTitle: 'आपकी रिपोर्ट जरूरी सवालों के जवाब देनी चाहिए।',
    questionsSub: 'हम जटिल ब्यूरो डेटा को सरल जानकारी और उपयोगी मार्गदर्शन में बदलते हैं।',
    questionCards: [
      {
        title: 'मेरी मौजूदा रिपोर्ट में क्या गलत है?',
        text: 'ओवरड्यू अकाउंट, गलत जानकारी, सेटलमेंट और दूसरी कमियां पहचानें जो आपकी प्रोफाइल को नुकसान पहुंचा सकती हैं।',
      },
      {
        title: 'मेरा अप्रूवल क्यों रुक सकता है?',
        text: 'लेंडर को दिखने वाले उन जोखिमों को समझें जो आपकी पात्रता को प्रभावित कर सकते हैं।',
      },
      {
        title: 'मेरे स्कोर पर असर क्यों पड़ रहा है?',
        text: 'जानें कि पेमेंट हिस्ट्री, क्रेडिट उपयोग, पूछताछ और अकाउंट व्यवहार स्कोर को कैसे प्रभावित करते हैं।',
      },
      {
        title: 'क्रेडिट हेल्थ बेहतर करने के लिए क्या करूं?',
        text: 'समस्याओं को हल करने और प्रोफाइल मजबूत बनाने के लिए व्यक्तिगत और व्यावहारिक कदम पाएं।',
      },
      {
        title: 'भविष्य में क्रेडिट कैसे मैनेज करूं?',
        text: 'सही उपयोग, समय पर पेमेंट, सीमित पूछताछ और नियमित समीक्षा की आदत सीखें।',
      },
    ],
    deepTitle: 'सिर्फ स्कोर नहीं। आपके क्रेडिट की पूरी समझ।',
    deepSub: 'आपकी रिपोर्ट सभी जरूरी संकेत एक जगह दिखाती है, ताकि आप सही तस्वीर देखकर सही कदम उठा सकें।',
    reportNav: ['रिपोर्ट ओवरव्यू', 'क्रेडिट हेल्थ', 'अकाउंट विश्लेषण', 'स्कोर फैक्टर', 'सुधार के अवसर', 'एक्शन प्लान'],
    approvalBarriers: 'अप्रूवल में रुकावट',
    accountReview: 'हर अकाउंट की समीक्षा',
    impactFactors: 'स्कोर को प्रभावित करने वाले फैक्टर',
    correction: 'सुधार के अवसर',
    actionPlan: 'अगले 30 / 60 / 90 दिन की योजना',
    viewDetails: 'विस्तृत विश्लेषण देखें',
    viewAllAccounts: 'सभी अकाउंट देखें',
    viewCorrectionDetails: 'विवरण देखें',
    reportCreditHealth: 'क्रेडिट हेल्थ',
    positiveFactors: 'सकारात्मक फैक्टर',
    needsAttention: 'ध्यान जरूरी',
    highPriority: 'उच्च प्राथमिकता',
    accountTypes: ['क्रेडिट कार्ड', 'पर्सनल लोन', 'होम लोन', 'ऑटो लोन'],
    factorNames: ['पेमेंट हिस्ट्री', 'क्रेडिट उपयोग', 'नई पूछताछ', 'अकाउंट मिक्स'],
    disputedIssues: 'समस्याओं पर विवाद संभव',
    actionPlanCopy: 'क्रेडिट हेल्थ के लिए एक व्यावहारिक योजना।',
    high: 'उच्च',
    send: 'भेजें',
    planTitle: 'आपकी जरूरत की हर चीज। एक सरल प्लान।',
    planName: 'CreditTrust Complete Analysis',
    planLine: 'गहरी जानकारी। स्पष्ट जवाब। बेहतर वित्तीय भविष्य।',
    oneTime: 'एक बार का पेमेंट',
    planFeatures: [
      'गहरा क्रेडिट रिपोर्ट विश्लेषण',
      'मौजूदा गलतियां और जोखिम',
      'अप्रूवल रुकने के कारण',
      'व्यक्तिगत सुधार रोडमैप',
      'भविष्य का क्रेडिट मैनेजमेंट',
      'English या हिंदी रिपोर्ट',
      'रिपोर्ट आधारित AI क्रेडिट एडवाइजर',
    ],
    planCta: 'मेरा क्रेडिट विश्लेषण शुरू करें',
    disclaimer: 'जानकारी उपलब्ध ब्यूरो डेटा पर आधारित है। स्कोर बढ़ने, सुधार या लोन अप्रूवल की कोई गारंटी नहीं।',
    processTitle: 'क्रेडिट की उलझन से एक स्पष्ट योजना तक।',
    process: [
      ['विश्लेषण', 'हम आपकी पूरी ब्यूरो रिपोर्ट का अध्ययन करते हैं।'],
      ['सरल जवाब', 'हम आपकी चुनी भाषा में समस्याएं समझाते हैं।'],
      ['प्राथमिकता', 'हम बताते हैं कि पहले किस पर ध्यान देना है।'],
      ['मार्गदर्शन', 'आपको 30 / 60 / 90 दिन का व्यावहारिक रोडमैप मिलता है।'],
    ],
    bilingualTitle: 'हर जानकारी अपनी भाषा में समझें।',
    bilingualSub: 'वेबसाइट, पेमेंट, रिपोर्ट और मार्गदर्शन दोनों भाषाओं में उपलब्ध।',
    englishQuestion: 'Why is my score affected?',
    englishAnswer: 'Get a clear explanation in simple language.',
    hindiQuestion: 'मेरा स्कोर क्यों प्रभावित हो रहा है?',
    hindiAnswer: 'अपनी क्रेडिट रिपोर्ट के प्रभावों को सरल भाषा में समझें।',
    advisorTitle: 'अपने क्रेडिट एडवाइजर से पूछें',
    advisorSub: 'English या हिंदी में अपनी रिपोर्ट पर तुरंत जवाब पाएं।',
    advisorHello: 'नमस्ते! मैं आपका CreditTrust एडवाइजर हूं। अपनी क्रेडिट रिपोर्ट के बारे में कुछ भी पूछें।',
    advisorQuestions: ['मेरा लोन क्यों रिजेक्ट हुआ?', 'मुझे पहले क्या सुधारना चाहिए?'],
    advisorPlaceholder: 'अपना सवाल English या हिंदी में लिखें...',
    noteTwo: 'आपकी रिपोर्ट, आसान भाषा में।',
    trust: [
      ['सहमति आधारित', 'आपके डेटा पर आपका नियंत्रण।'],
      ['सुरक्षित और निजी', 'आपकी जानकारी सुरक्षित रहती है।'],
      ['स्पष्ट ₹999 कीमत', 'कोई छिपी फीस नहीं।'],
      ['शैक्षणिक मार्गदर्शन', 'बेहतर वित्तीय भविष्य के व्यावहारिक कदम।'],
    ],
    finalTitle: 'आज समझें। कल बेहतर संभालें।',
    finalSub: 'अपनी रिपोर्ट के स्पष्ट जवाब और व्यक्तिगत आगे का रास्ता पाएं।',
    finalCta: 'मेरा क्रेडिट विश्लेषण पाएं',
    footerLine: 'स्पष्ट जानकारी। बेहतर वित्तीय भविष्य।',
    footerLinks: ['यह कैसे काम करता है', 'आप क्या जानेंगे', 'सैंपल रिपोर्ट', 'पार्टनर्स के लिए', 'सवाल', 'संपर्क'],
    legal: ['प्राइवेसी पॉलिसी', 'उपयोग की शर्तें', 'डिस्क्लेमर'],
  },
} as const;

const questionIcons = [FileSearch, LockKeyhole, BarChart3, Lightbulb, CalendarCheck];
const processIcons = [FileText, SearchCheck, ListChecks, Flag];
const trustIcons = [ShieldCheck, LockKeyhole, IndianRupee, BookOpenCheck];

export default function CreditTrustPreview() {
  const [language, setLanguage] = useState<Language>('en');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const t = copy[language];

  const switchLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setMobileOpen(false);
  };

  const openDemo = () => {
    setDemoStep(0);
    setDemoOpen(true);
    setMobileOpen(false);
  };

  return (
    <div className={styles.site} lang={language === 'hi' ? 'hi' : 'en'}>
      <header className={styles.header}>
        <div className={styles.navShell}>
          <Link href="#top" className={styles.logo} aria-label="CreditTrust home">
            <Image src="/assets/images/credit-trust-mark.svg" alt="" width={30} height={30} priority />
            <span>Credit<span>Trust</span></span>
          </Link>

          <nav className={styles.desktopNav} aria-label="Main navigation">
            <Link href="#how-it-works">{t.nav[0]}</Link>
            <Link href="#learn">{t.nav[1]}</Link>
            <Link href={SAMPLE_REPORT_URL}>{t.nav[2]}</Link>
            <Link href="/partner-program">{t.nav[3]}</Link>
          </nav>

          <div className={styles.navActions}>
            <div className={styles.languageToggle} aria-label="Select language">
              <button className={language === 'en' ? styles.languageActive : ''} onClick={() => switchLanguage('en')} type="button">English</button>
              <span>|</span>
              <button className={language === 'hi' ? styles.languageActive : ''} onClick={() => switchLanguage('hi')} type="button">हिंदी</button>
            </div>
            <Link href="/partner-login" className={styles.partnerButton}>{t.partner}</Link>
            <button type="button" className={styles.primarySmall} onClick={openDemo}>{t.headerCta}<ArrowRight size={16} /></button>
          </div>

          <button className={styles.menuButton} type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
        {mobileOpen && (
          <div className={styles.mobileNav}>
            {t.nav.map((item, index) => <Link key={item} href={index === 0 ? '#how-it-works' : index === 1 ? '#learn' : index === 2 ? SAMPLE_REPORT_URL : '/partner-program'} onClick={() => setMobileOpen(false)}>{item}</Link>)}
            <div className={styles.mobileLanguage}>
              <button onClick={() => switchLanguage('en')} type="button">English</button>
              <button onClick={() => switchLanguage('hi')} type="button">हिंदी</button>
            </div>
            <button type="button" className={styles.primaryButton} onClick={openDemo}>{t.headerCta}<ArrowRight size={18} /></button>
          </div>
        )}
      </header>

      <main id="top">
        <section className={styles.hero}>
          <div className={styles.orbOne} />
          <div className={styles.orbTwo} />
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>{t.eyebrow}</p>
                <h1>{t.heroLineOne}<br /><span>{t.heroLineTwo}</span></h1>
                <p className={styles.lead}>{t.heroCopy}</p>
                <div className={styles.availability}>
                  <Globe2 size={20} />
                  <strong>{t.available}</strong>
                  <span>{t.languageNote}</span>
                </div>
                <div className={styles.heroButtons}>
                  <button type="button" className={styles.primaryButton} onClick={openDemo}>{t.heroCta} <b>— ₹999</b><ArrowRight size={19} /></button>
                  <Link href={SAMPLE_REPORT_URL} className={styles.secondaryButton}>{t.sample}</Link>
                </div>
                <div className={styles.assurances}>
                  {[ShieldCheck, CreditCard, FileCheck2, Ban].map((Icon, index) => (
                    <div key={t.assurances[index]}><Icon size={21} /><span>{t.assurances[index]}</span></div>
                  ))}
                </div>
              </div>

              <div className={styles.heroVisual}>
                <ReportSnapshot t={t} />
                <div className={styles.handNote}>{t.noteOne}<span className={styles.noteArrow}>↙</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.questions} id="learn">
          <div className={styles.container}>
            <SectionHeading title={t.questionsTitle} subtitle={t.questionsSub} centered />
            <div className={styles.questionGrid}>
              {t.questionCards.map((card, index) => {
                const Icon = questionIcons[index];
                return (
                  <article key={card.title} className={`${styles.questionCard} ${index === 0 ? styles.questionFeatured : ''}`}>
                    <div className={styles.iconBubble}><Icon size={index === 0 ? 34 : 25} /></div>
                    <div><h3>{card.title}</h3><p>{card.text}</p></div>
                    <button type="button" aria-label={card.title}><ChevronRight size={20} /></button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.reportSection} id="report">
          <div className={styles.container}>
            <SectionHeading title={t.deepTitle} subtitle={t.deepSub} centered />
            <DeepReport t={t} />
          </div>
        </section>

        <section className={styles.planSection}>
          <div className={styles.container}>
            <SectionHeading title={t.planTitle} centered />
            <div className={styles.planCard}>
              <div className={styles.planIntro}>
                <div className={styles.planIcon}><Sparkles size={28} /></div>
                <div><h3>{t.planName}</h3><p>{t.planLine}</p></div>
                <div className={styles.price}><strong>₹999</strong><span>{t.oneTime}</span></div>
              </div>
              <div className={styles.planFeatures}>
                {t.planFeatures.map((feature) => <div key={feature}><CheckCircle2 size={17} /><span>{feature}</span></div>)}
              </div>
              <div className={styles.planAction}>
                <button type="button" className={styles.primaryButton} onClick={openDemo}>{t.planCta}<ArrowRight size={18} /></button>
                <p>{t.disclaimer}</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.processSection} id="how-it-works">
          <div className={styles.container}>
            <SectionHeading title={t.processTitle} centered />
            <div className={styles.processGrid}>
              {t.process.map(([title, text], index) => {
                const Icon = processIcons[index];
                return (
                  <div className={styles.processStep} key={title}>
                    <span className={styles.stepNumber}>{index + 1}</span>
                    <div className={styles.stepIcon}><Icon size={24} /></div>
                    <div><h3>{title}</h3><p>{text}</p></div>
                    {index < t.process.length - 1 && <ArrowRight className={styles.stepArrow} size={22} />}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.languageSection}>
          <div className={styles.container}>
            <div className={styles.languageGrid}>
              <div className={styles.languageCard}>
                <h2>{t.bilingualTitle}</h2>
                <p>{t.bilingualSub}</p>
                <div className={styles.inlineTabs}>
                  <button type="button" className={language === 'en' ? styles.tabActive : ''} onClick={() => switchLanguage('en')}>English</button>
                  <button type="button" className={language === 'hi' ? styles.tabActive : ''} onClick={() => switchLanguage('hi')}>हिंदी</button>
                </div>
                <div className={styles.languageExamples}>
                  <div><span>English</span><strong>{t.englishQuestion}</strong><p>{t.englishAnswer}</p></div>
                  <div><span>हिंदी</span><strong>{t.hindiQuestion}</strong><p>{t.hindiAnswer}</p></div>
                </div>
              </div>

              <div className={styles.advisorCard}>
                <div className={styles.advisorTitle}><div><h2>{t.advisorTitle}</h2><p>{t.advisorSub}</p></div><Bot size={27} /></div>
                <div className={styles.chatMessage}><span><Bot size={19} /></span><p>{t.advisorHello}</p></div>
                <div className={styles.quickQuestions}>{t.advisorQuestions.map((q) => <button type="button" key={q}>{q}</button>)}</div>
                <div className={styles.chatInput}><span>{t.advisorPlaceholder}</span><button type="button" aria-label={t.send}><ArrowRight size={19} /></button></div>
                <div className={styles.advisorNote}>{t.noteTwo}<span>↙</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.trustSection}>
          <div className={styles.container}>
            <div className={styles.trustGrid}>
              {t.trust.map(([title, text], index) => {
                const Icon = trustIcons[index];
                return <div key={title} className={styles.trustItem}><Icon size={25} /><div><strong>{title}</strong><span>{text}</span></div></div>;
              })}
            </div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.leafDecoration}>◜</div>
          <div className={styles.container}>
            <div className={styles.finalInner}>
              <div><h2>{t.finalTitle}</h2><p>{t.finalSub}</p></div>
              <button type="button" className={styles.primaryButton} onClick={openDemo}>{t.finalCta} <b>— ₹999</b><ArrowRight size={19} /></button>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}><Image src="/assets/images/credit-trust-mark.svg" alt="" width={28} height={28} /><span>Credit<span>Trust</span></span></div>
              <p>{t.footerLine}</p>
            </div>
            <div className={styles.footerLinks}>{t.footerLinks.map((item, index) => <Link href={index === 2 ? SAMPLE_REPORT_URL : index === 3 ? '/partner-program' : '#top'} key={item}>{item}</Link>)}</div>
            <div className={styles.footerLanguage}><Globe2 size={16} /><button onClick={() => switchLanguage('en')} type="button">English</button><span>|</span><button onClick={() => switchLanguage('hi')} type="button">हिंदी</button></div>
          </div>
          <div className={styles.footerBottom}><span>© 2026 CreditTrust. All rights reserved.</span><div>{t.legal.map((item) => <Link href="#top" key={item}>{item}</Link>)}</div></div>
        </div>
      </footer>

      {demoOpen && (
        <div className={styles.demoOverlay} role="dialog" aria-modal="true" aria-labelledby="demo-title">
          <button className={styles.demoBackdrop} type="button" onClick={() => setDemoOpen(false)} aria-label="Close demo" />
          <div className={styles.demoModal}>
            <div className={styles.demoHeader}>
              <div><span className={styles.demoBadge}>{language === 'en' ? 'DEMO ONLY' : 'केवल डेमो'}</span><h2 id="demo-title">{language === 'en' ? 'Credit analysis preview' : 'क्रेडिट विश्लेषण प्रीव्यू'}</h2></div>
              <button type="button" onClick={() => setDemoOpen(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <div className={styles.demoProgress}>
              {(language === 'en' ? ['Mobile', 'OTP', 'Payment', 'Ready'] : ['मोबाइल', 'OTP', 'पेमेंट', 'तैयार']).map((label, index) => <div className={index <= demoStep ? styles.demoProgressActive : ''} key={label}><span>{index + 1}</span><b>{label}</b></div>)}
            </div>

            {demoStep === 0 && (
              <div className={styles.demoBody}>
                <div className={styles.demoIcon}><MessageCircle size={28} /></div>
                <h3>{language === 'en' ? 'Verify your mobile' : 'अपना मोबाइल सत्यापित करें'}</h3>
                <p>{language === 'en' ? 'This preview does not send a real OTP or save your number.' : 'यह प्रीव्यू असली OTP नहीं भेजता और आपका नंबर सेव नहीं करता।'}</p>
                <label>{language === 'en' ? 'Demo mobile number' : 'डेमो मोबाइल नंबर'}</label>
                <div className={styles.demoInput}><span>+91</span><input value="98XXXXXX10" readOnly aria-label="Demo mobile number" /></div>
                <button type="button" className={styles.demoAction} onClick={() => setDemoStep(1)}>{language === 'en' ? 'Continue with demo' : 'डेमो जारी रखें'}<ArrowRight size={18} /></button>
              </div>
            )}

            {demoStep === 1 && (
              <div className={styles.demoBody}>
                <div className={styles.demoIcon}><ShieldCheck size={28} /></div>
                <h3>{language === 'en' ? 'Enter demo OTP' : 'डेमो OTP दर्ज करें'}</h3>
                <p>{language === 'en' ? 'No WhatsApp or SMS message has been sent.' : 'कोई WhatsApp या SMS संदेश नहीं भेजा गया है।'}</p>
                <div className={styles.otpBoxes}>{['1', '2', '3', '4', '5', '6'].map((digit, index) => <span key={`${digit}-${index}`}>{digit}</span>)}</div>
                <button type="button" className={styles.demoAction} onClick={() => setDemoStep(2)}>{language === 'en' ? 'Verify demo OTP' : 'डेमो OTP सत्यापित करें'}<ArrowRight size={18} /></button>
              </div>
            )}

            {demoStep === 2 && (
              <div className={styles.demoBody}>
                <div className={styles.demoIcon}><CreditCard size={28} /></div>
                <h3>{language === 'en' ? 'Demo payment' : 'डेमो पेमेंट'}</h3>
                <p>{language === 'en' ? 'This simulates a successful ₹999 payment. No gateway opens and no money is charged.' : 'यह ₹999 के सफल पेमेंट का डेमो है। कोई गेटवे नहीं खुलेगा और कोई पैसा नहीं कटेगा।'}</p>
                <div className={styles.demoAmount}><span>CreditTrust Complete Analysis</span><strong>₹999</strong></div>
                <button type="button" className={styles.demoAction} onClick={() => setDemoStep(3)}>{language === 'en' ? 'Simulate successful payment' : 'सफल पेमेंट का डेमो देखें'}<ArrowRight size={18} /></button>
              </div>
            )}

            {demoStep === 3 && (
              <div className={styles.demoBody}>
                <div className={styles.demoSuccess}><Check size={34} /></div>
                <h3>{language === 'en' ? 'Demo report is ready' : 'डेमो रिपोर्ट तैयार है'}</h3>
                <p>{language === 'en' ? 'The complete live journey will be connected only after design approval.' : 'डिजाइन अप्रूवल के बाद ही पूरी लाइव जर्नी जोड़ी जाएगी।'}</p>
                <button type="button" className={styles.demoAction} onClick={() => { setDemoOpen(false); document.getElementById('report')?.scrollIntoView({ behavior: 'smooth' }); }}>{language === 'en' ? 'View demo report' : 'डेमो रिपोर्ट देखें'}<ArrowRight size={18} /></button>
              </div>
            )}
            <p className={styles.demoSafety}>{language === 'en' ? 'No API call · No OTP sent · No payment charged · No data stored' : 'कोई API कॉल नहीं · कोई OTP नहीं · कोई पेमेंट नहीं · कोई डेटा सेव नहीं'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ title, subtitle, centered = false }: { title: string; subtitle?: string; centered?: boolean }) {
  return <div className={`${styles.sectionHeading} ${centered ? styles.centered : ''}`}><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>;
}

function ReportSnapshot({ t }: { t: (typeof copy)[Language] }) {
  return (
    <div className={styles.snapshot}>
      <div className={styles.snapshotHeader}><div className={styles.miniLogo}><Image src="/assets/images/credit-trust-mark.svg" alt="" width={20} height={20} /><b>Credit<span>Trust</span></b></div><div><strong>{t.reportTitle}</strong><span>{t.asOf}</span></div></div>
      <div className={styles.snapshotGrid}>
        <div className={styles.scoreCard}><span>{t.score}</span><div className={styles.scoreGauge}><div><strong>742</strong><b>{t.good}</b></div></div><div className={styles.scoreScale}><i /><span>300</span><span>550</span><span>700</span><span>900</span></div></div>
        <div className={styles.snapshotRight}>
          <div className={styles.readinessCard}><span>{t.readiness}</span><strong>68%</strong><div><i /></div><b>{t.moderate}</b></div>
          <div className={styles.attentionCard}><CircleAlert size={23} /><div><strong>{t.attention}</strong><p>{t.attentionCopy}</p></div></div>
          <div className={styles.driverCard}><h3>{t.drivers}</h3>{t.driverItems.map((item, index) => <div key={item}><span>{index + 1}</span><p>{item}</p><b>{index === 2 ? t.moderate : t.high}</b></div>)}</div>
        </div>
      </div>
    </div>
  );
}

function DeepReport({ t }: { t: (typeof copy)[Language] }) {
  return (
    <div className={styles.deepReport}>
      <aside className={styles.reportSidebar}>
        <div className={styles.miniLogoLight}><Image src="/assets/images/credit-trust-mark.svg" alt="" width={22} height={22} /><b>CreditTrust</b></div>
        {t.reportNav.map((item, index) => <div className={index === 0 ? styles.reportNavActive : ''} key={item}>{[FileText, Gauge, WalletCards, BarChart3, SearchCheck, ListChecks].map((Icon, iconIndex) => iconIndex === index ? <Icon key={item} size={15} /> : null)}<span>{item}</span></div>)}
      </aside>
      <div className={styles.deepScore}><span>{t.reportCreditHealth}</span><div className={styles.compactGauge}><strong>742</strong><b>{t.good}</b></div><ul><li><i className={styles.dotGood} />{t.positiveFactors} <b>6</b></li><li><i className={styles.dotWarn} />{t.needsAttention} <b>3</b></li><li><i className={styles.dotBad} />{t.highPriority} <b>2</b></li></ul></div>
      <div className={styles.deepPanel}><h3><CircleAlert size={18} />{t.approvalBarriers}</h3>{t.driverItems.map((item) => <p key={item}><span>!</span>{item}</p>)}<button type="button">{t.viewDetails}<ChevronRight size={15} /></button></div>
      <div className={styles.deepPanel}><h3><WalletCards size={18} />{t.accountReview}</h3>{t.accountTypes.map((item, i) => <p key={item}>{item}{i === 2 ? <CircleAlert size={15} /> : <CheckCircle2 size={15} />}</p>)}<button type="button">{t.viewAllAccounts}<ChevronRight size={15} /></button></div>
      <div className={styles.deepPanel}><h3><TrendingUp size={18} />{t.impactFactors}</h3>{t.factorNames.map((item, index) => <div className={styles.factor} key={item}><span>{item}</span><div><i style={{ width: `${[82, 74, 52, 35][index]}%` }} /></div></div>)}</div>
      <div className={styles.deepPanel}><h3><SearchCheck size={18} />{t.correction}</h3><div className={styles.correctionCount}><strong>3</strong><span>{t.disputedIssues}</span></div><button type="button">{t.viewCorrectionDetails}<ChevronRight size={15} /></button><h3 className={styles.actionTitle}><Target size={18} />{t.actionPlan}</h3><p>{t.actionPlanCopy}</p></div>
    </div>
  );
}
