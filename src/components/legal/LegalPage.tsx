import Link from 'next/link';
import { ArrowUpRight, FileText, ShieldCheck } from 'lucide-react';
import PreviewFooter from '@/app/home/loan-hero-preview/PreviewFooter';
import PreviewHeader from '@/app/home/loan-hero-preview/PreviewHeader';
import styles from './LegalPage.module.css';

export type LegalSection = {
  title: string;
  body?: string;
  bullets?: string[];
};

interface LegalPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
}

export default function LegalPage({ eyebrow, title, intro, updatedAt, sections }: LegalPageProps) {
  return (
    <main className={styles.page}>
      <PreviewHeader active="legal" />
      <div className={styles.hero}>
        <div className={styles.container}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>{eyebrow}</span></nav>
          <p className={styles.eyebrow}><FileText size={16} /> CREDITTRUST POLICIES</p>
          <h1>{title}</h1>
          <p className={styles.intro}>{intro}</p>
          <p className={styles.updated}>Last updated: {updatedAt}</p>
          <div className={styles.ownership}><ShieldCheck size={22} aria-hidden="true" /><p>CreditTrust is a brand/platform owned, operated, and managed by Fin Coopers Tech India Private Limited.</p></div>
        </div>
      </div>
      <div className={`${styles.container} ${styles.contentGrid}`}>
        <aside className={styles.sidebar}>
          <p>ON THIS PAGE</p>
          <nav aria-label={`${title} sections`}>{sections.map((section, index) => <a key={section.title} href={`#section-${index + 1}`}>{section.title}</a>)}</nav>
          <Link href="/contact" className={styles.supportLink}>Need help? Contact us <ArrowUpRight size={15} /></Link>
        </aside>
        <div className={styles.sections}>
          {sections.map((section, index) => (
            <section id={`section-${index + 1}`} key={section.title} className={styles.section}>
              <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
              <div><h2>{section.title}</h2>{section.body && <p>{section.body}</p>}{section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}</div>
            </section>
          ))}
          <div className={styles.contactCard}>
            <h2>Need help with your journey?</h2>
            <p>For loan enquiries, consent, privacy, payments or refunds, email us with your registered mobile number and application or payment reference if available. Never share an OTP or password.</p>
            <a href="mailto:support@credittrust.in">support@credittrust.in <ArrowUpRight size={16} /></a>
          </div>
        </div>
      </div>
      <PreviewFooter />
    </main>
  );
}
