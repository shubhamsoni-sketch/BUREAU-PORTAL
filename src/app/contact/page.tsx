import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, FileText, Mail, MapPin, ShieldCheck } from 'lucide-react';
import PreviewFooter from '@/app/home/loan-hero-preview/PreviewFooter';
import PreviewHeader from '@/app/home/loan-hero-preview/PreviewHeader';
import shared from '@/app/home/loan-hero-preview/page.module.css';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Contact CreditTrust | Fin Coopers Tech India Private Limited',
  description:
    'Contact CreditTrust for customer support, privacy, payment and refund questions. CreditTrust is owned and operated by Fin Coopers Tech India Private Limited.',
};

export default function ContactPage() {
  return (
    <main className={`${shared.page} ${styles.page}`}>
      <PreviewHeader active="contact" />
      <section className={styles.hero} aria-labelledby="contact-title">
        <div className={styles.container}>
          <p className={styles.eyebrow}>CREDITTRUST SUPPORT</p>
          <h1 id="contact-title">We are here to <em>help you move forward.</em></h1>
          <p className={styles.lead}>
            Questions about your CreditTrust journey, a report, privacy, or a payment? Reach our team using the details below.
          </p>
          <div className={styles.cards}>
            <article className={styles.card}>
              <span className={styles.icon}><Mail size={23} /></span>
              <h2>Email support</h2>
              <p>Share your concern and any relevant request or payment reference. Please do not email passwords or OTPs.</p>
              <a href="mailto:support@credittrust.in">support@credittrust.in <ArrowUpRight size={17} /></a>
            </article>
            <article className={styles.card}>
              <span className={styles.icon}><MapPin size={23} /></span>
              <h2>Company address</h2>
              <p>Fin Coopers Tech India Private Limited</p>
              <address>201, Diamond Trade Centre, Near Janjeerwala Square, Indore (M.P) - 452001</address>
            </article>
          </div>
          <div className={styles.ownership}>
            <ShieldCheck size={24} />
            <p>CreditTrust is a brand/platform owned, operated, and managed by Fin Coopers Tech India Private Limited.</p>
          </div>
          <nav className={styles.policyLinks} aria-label="CreditTrust policies">
            <FileText size={18} />
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
            <Link href="/refund-policy">Refund Policy</Link>
          </nav>
        </div>
      </section>
      <PreviewFooter />
    </main>
  );
}
