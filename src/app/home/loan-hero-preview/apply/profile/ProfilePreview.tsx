'use client';

import Link from 'next/link';
import { ArrowLeft, CircleUserRound, LockKeyhole, Mail, MapPin, WalletCards } from 'lucide-react';
import CustomerSidebar from '../CustomerSidebar';
import { useJourney } from '../JourneyContext';
import shellStyles from '../offers/page.module.css';
import styles from './page.module.css';

const formatAmount = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export default function ProfilePreview() {
  const { profile } = useJourney();

  return (
    <main className={shellStyles.shell}>
      <CustomerSidebar active="profile" />
      <div className={shellStyles.mainArea}>
        <div className={styles.content}>
          <Link href="/home/loan-hero-preview/apply/offers" className={styles.back}><ArrowLeft size={15} /> Back to offers</Link>
          <div className={styles.hero}>
            <span className={styles.avatar}><CircleUserRound size={30} /></span>
            <div><p>CUSTOMER PROFILE</p><h1>{profile?.name || 'Your profile'}</h1><span>Details shared during your enquiry</span></div>
          </div>

          {!profile ? (
            <section className={styles.empty}>
              <CircleUserRound size={32} />
              <h2>No profile details in this preview yet</h2>
              <p>Complete the enquiry form to see the details you entered here. Preview data is cleared when you leave or refresh the journey.</p>
              <Link href="/home/loan-hero-preview/apply">Start enquiry</Link>
            </section>
          ) : (
            <div className={styles.grid}>
              <section className={styles.card} aria-labelledby="contact-title">
                <div className={styles.cardHead}><span><Mail size={18} /></span><div><h2 id="contact-title">Contact</h2><p>How we can reach you</p></div></div>
                <dl><div><dt>Full name</dt><dd>{profile.name}</dd></div><div><dt>Mobile number</dt><dd>+91 {profile.mobile}</dd></div><div><dt>Email address</dt><dd>{profile.email}</dd></div></dl>
              </section>
              <section className={styles.card} aria-labelledby="personal-title">
                <div className={styles.cardHead}><span><MapPin size={18} /></span><div><h2 id="personal-title">Personal details</h2><p>Your basic information</p></div></div>
                <dl><div><dt>Date of birth</dt><dd>{profile.dob}</dd></div><div><dt>Gender</dt><dd>{profile.gender}</dd></div><div><dt>Pincode</dt><dd>{profile.pincode}</dd></div><div><dt>PAN number</dt><dd>{profile.pan}</dd></div></dl>
              </section>
              <section className={styles.card} aria-labelledby="enquiry-title">
                <div className={styles.cardHead}><span><WalletCards size={18} /></span><div><h2 id="enquiry-title">Enquiry details</h2><p>Your selected preferences</p></div></div>
                <dl><div><dt>Indicative amount</dt><dd>{formatAmount(profile.amount)}</dd></div><div><dt>Job type</dt><dd>{profile.jobType}</dd></div><div><dt>Monthly income</dt><dd>{formatAmount(Number(profile.income))}</dd></div><div><dt>Loan purpose</dt><dd>{profile.purpose}</dd></div></dl>
              </section>
            </div>
          )}
          <p className={styles.note}><LockKeyhole size={14} /> Local design preview only. No profile details are saved or submitted.</p>
        </div>
      </div>
    </main>
  );
}
