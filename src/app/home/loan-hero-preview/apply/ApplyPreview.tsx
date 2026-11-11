'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronRight, LockKeyhole, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useJourney } from './JourneyContext';
import styles from './page.module.css';

const minAmount = 5000;
const maxAmount = 200000;
const demoOtp = '123456';
const formatAmount = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
type Step = 'start' | 'otp' | 'details';
type Details = { firstName: string; lastName: string; email: string; gender: string; pincode: string; pan: string; dob: string; jobType: string; income: string; purpose: string };
const emptyDetails: Details = { firstName: '', lastName: '', email: '', gender: '', pincode: '', pan: '', dob: '', jobType: '', income: '', purpose: '' };

export default function ApplyPreview() {
  const router = useRouter();
  const { setProfile } = useJourney();
  const [mobile, setMobile] = useState('');
  const [amount, setAmount] = useState(minAmount);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [contactAccepted, setContactAccepted] = useState(false);
  const [updatesAccepted, setUpdatesAccepted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [step, setStep] = useState<Step>('start');
  const [otp, setOtp] = useState('');
  const [details, setDetails] = useState<Details>(emptyDetails);
  const mobileValid = /^[6-9]\d{9}$/.test(mobile);
  const canContinue = mobileValid && legalAccepted && contactAccepted;
  const amountProgress = ((amount - minAmount) / (maxAmount - minAmount)) * 100;
  const stepNumber = { start: 1, otp: 2, details: 3 }[step];

  function updateDetail(field: keyof Details, value: string) {
    setDetails((current) => ({ ...current, [field]: value }));
    setAttempted(false);
  }

  function handleNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (canContinue) { setAttempted(false); setStep('otp'); }
  }

  function handleOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (otp === demoOtp) { setAttempted(false); setStep('details'); }
  }

  function handleDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    const [day, month, year] = details.dob.split('-').map(Number);
    const birthDate = new Date(Date.UTC(year, month - 1, day));
    const dobValid = /^\d{2}-\d{2}-\d{4}$/.test(details.dob) && birthDate.getUTCFullYear() === year &&
      birthDate.getUTCMonth() === month - 1 && birthDate.getUTCDate() === day && birthDate <= new Date();
    const valid = details.firstName.trim() && details.lastName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email) &&
      details.gender && /^\d{6}$/.test(details.pincode) && /^[A-Z]{5}\d{4}[A-Z]$/.test(details.pan) &&
      dobValid && details.jobType && Number(details.income) > 0 && details.purpose;
    if (valid) {
      setAttempted(false);
      setProfile({
        name: `${details.firstName.trim()} ${details.lastName.trim()}`,
        email: details.email.trim(),
        mobile: `${mobile.slice(0, 2)}****${mobile.slice(-4)}`,
        gender: details.gender,
        pincode: details.pincode,
        pan: `${details.pan.slice(0, 2)}******${details.pan.slice(-2)}`,
        dob: details.dob,
        jobType: details.jobType,
        income: details.income,
        purpose: details.purpose,
        amount,
      });
      router.push('/home/loan-hero-preview/apply/offers');
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" aria-label="CreditTrust home" className={styles.brand}>
            <Image src="/assets/brand-preview/credittrust-loop-gradient-concept.png" alt="CreditTrust" width={2172} height={724} priority sizes="(max-width: 600px) 180px, 230px" />
          </Link>
          <Link href="/" className={styles.back}><ArrowLeft size={16} /> Back to website</Link>
        </header>

        <div className={styles.layout}>
          <section className={styles.intro} aria-labelledby="apply-title">
            <p className={styles.eyebrow}><Sparkles size={15} /> A CLEARER WAY TO BEGIN</p>
            <h1 id="apply-title">Your next move <em>starts here.</em></h1>
            <p className={styles.lead}>Tell us where you would like to begin. A simple, consent-led enquiry helps you understand the next step before making a decision.</p>
            <div className={styles.pathCard} aria-label="Enquiry journey">
              <span><strong>01</strong> Choose an amount</span>
              <ChevronRight size={17} />
              <span><strong>02</strong> Verify your number</span>
              <ChevronRight size={17} />
              <span><strong>03</strong> Share your details</span>
            </div>
            <div className={styles.benefits}>
              <div><span><WalletCards size={20} /></span><p><strong>Start with your need</strong><small>Choose an indicative amount to explore.</small></p></div>
              <div><span><ShieldCheck size={20} /></span><p><strong>Your choice stays yours</strong><small>Review the information and consent before continuing.</small></p></div>
              <div><span><LockKeyhole size={20} /></span><p><strong>Clear expectations</strong><small>Any offer or approval depends on the relevant lender.</small></p></div>
            </div>
            <p className={styles.disclaimer}>CreditTrust does not guarantee approval, disbursal timing, rates, or credit-score outcomes.</p>
          </section>

          <section className={`${styles.formCard} ${step === 'details' ? styles.detailsCard : ''}`} aria-labelledby="form-title">
            <div className={styles.progressHead}><span>PERSONAL LOAN ENQUIRY</span><span>{String(stepNumber).padStart(2, '0')} / 03</span></div>
            <div className={styles.progressTrack}><span style={{ width: `${stepNumber * 100 / 3}%` }} /></div>
            {step === 'start' && (
              <form onSubmit={handleNext} noValidate>
                <p className={styles.formEyebrow}>STEP ONE / GET STARTED</p>
                <h2 id="form-title">Let&apos;s get started.</h2>
                <p className={styles.formIntro}>Enter your mobile number and choose an indicative loan amount.</p>

                <label className={styles.fieldLabel} htmlFor="apply-mobile">Mobile number</label>
                <div className={styles.phoneField}><span>+91</span><input id="apply-mobile" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number" value={mobile} maxLength={10} onChange={(event) => setMobile(event.target.value.replace(/\D/g, '').slice(0, 10))} aria-invalid={attempted && !mobileValid} aria-describedby={attempted && !mobileValid ? 'mobile-error' : undefined} /></div>
                {attempted && !mobileValid && <p className={styles.error} id="mobile-error">Enter a valid 10-digit Indian mobile number.</p>}

                <div className={styles.amountHeader}><label className={styles.fieldLabel} htmlFor="apply-amount">Indicative loan amount</label><strong>{formatAmount(amount)}</strong></div>
                <input id="apply-amount" type="range" min={minAmount} max={maxAmount} step={5000} value={amount} onChange={(event) => setAmount(Number(event.target.value))} className={styles.slider} style={{ background: `linear-gradient(to right, #FFD24D 0%, #FFD24D ${amountProgress}%, #ffffff58 ${amountProgress}%, #ffffff58 100%)` }} />
                <div className={styles.rangeEnds}><span>{formatAmount(minAmount)}</span><span>{formatAmount(maxAmount)}</span></div>
                <p className={styles.amountNote}>For enquiry planning only. This does not indicate eligibility or an available offer.</p>

                <div className={styles.consentList}>
                  <label><input type="checkbox" checked={legalAccepted} onChange={(event) => setLegalAccepted(event.target.checked)} /><span>I have read the <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</Link> and <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.</span></label>
                  <label><input type="checkbox" checked={contactAccepted} onChange={(event) => setContactAccepted(event.target.checked)} /><span>I consent to CreditTrust contacting me about this enquiry.</span></label>
                  <label><input type="checkbox" checked={updatesAccepted} onChange={(event) => setUpdatesAccepted(event.target.checked)} /><span>Send me optional product updates. I can opt out later.</span></label>
                </div>
                {attempted && (!legalAccepted || !contactAccepted) && <p className={styles.error}>Please accept the terms and enquiry contact consent to continue.</p>}
                <button className={styles.nextButton} type="submit">Continue <ArrowRight size={21} /></button>
                <p className={styles.previewNote}><LockKeyhole size={14} /> Design preview only. No details are saved or submitted.</p>
              </form>
            )}
            {step === 'otp' && <form onSubmit={handleOtp} noValidate className={styles.otpForm}>
              <span className={styles.reviewIcon}><ShieldCheck size={26} /></span>
              <p className={styles.formEyebrow}>STEP TWO / VERIFY NUMBER</p>
              <h2 id="form-title">Verify your mobile.</h2>
              <p className={styles.formIntro}>Enter the 6-digit code for +91 {mobile.slice(0, 2)}****{mobile.slice(-4)}.</p>
              <label className={styles.fieldLabel} htmlFor="apply-otp">One-time code</label>
              <input id="apply-otp" className={styles.textField} type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit OTP" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} aria-invalid={attempted && otp !== demoOtp} />
              <p className={styles.demoHint}>Preview only: no SMS is sent. Use <strong>{demoOtp}</strong> to view the next screen.</p>
              {attempted && otp !== demoOtp && <p className={styles.error}>Enter the preview code shown above.</p>}
              <button className={styles.nextButton} type="submit">Verify &amp; continue <ArrowRight size={20} /></button>
              <button className={styles.textButton} type="button" onClick={() => { setAttempted(false); setStep('start'); }}>Edit mobile number</button>
            </form>}
            {step === 'details' && <form onSubmit={handleDetails} noValidate className={styles.detailsForm}>
              <h2 id="form-title">Your details</h2>
              <div className={styles.detailsGrid}>
                <label>First name<input className={styles.textField} autoComplete="given-name" value={details.firstName} onChange={(event) => updateDetail('firstName', event.target.value)} /></label>
                <label>Last name<input className={styles.textField} autoComplete="family-name" value={details.lastName} onChange={(event) => updateDetail('lastName', event.target.value)} /></label>
                <label>Email<input className={styles.textField} type="email" autoComplete="email" placeholder="you@example.com" value={details.email} onChange={(event) => updateDetail('email', event.target.value)} /></label>
                <fieldset className={styles.choiceField}><legend>Gender</legend><div><button type="button" aria-pressed={details.gender === 'Male'} onClick={() => updateDetail('gender', 'Male')}>Male</button><button type="button" aria-pressed={details.gender === 'Female'} onClick={() => updateDetail('gender', 'Female')}>Female</button></div></fieldset>
                <label>Pincode<input className={styles.textField} inputMode="numeric" autoComplete="postal-code" placeholder="6-digit pincode" maxLength={6} value={details.pincode} onChange={(event) => updateDetail('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
                <label>PAN number<input className={styles.textField} autoCapitalize="characters" placeholder="ABCDE1234F" maxLength={10} value={details.pan} onChange={(event) => updateDetail('pan', event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} /></label>
                <label>Date of birth<input className={styles.textField} type="text" inputMode="numeric" autoComplete="bday" placeholder="DD-MM-YYYY" maxLength={10} value={details.dob} onChange={(event) => { const digits = event.target.value.replace(/\D/g, '').slice(0, 8); updateDetail('dob', [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('-')); }} /></label>
                <fieldset className={styles.choiceField}><legend>Job type</legend><div><button type="button" aria-pressed={details.jobType === 'Salaried'} onClick={() => updateDetail('jobType', 'Salaried')}>Salaried</button><button type="button" aria-pressed={details.jobType === 'Self-employed'} onClick={() => updateDetail('jobType', 'Self-employed')}>Self-employed</button></div></fieldset>
                <label>Monthly income<input className={styles.textField} type="number" min="1" inputMode="numeric" value={details.income} onChange={(event) => updateDetail('income', event.target.value)} /></label>
                <label>Loan purpose<select className={styles.textField} value={details.purpose} onChange={(event) => updateDetail('purpose', event.target.value)}><option value="">Select purpose</option><option value="Personal needs">Personal needs</option><option value="Medical expenses">Medical expenses</option><option value="Education">Education</option><option value="Home improvement">Home improvement</option><option value="Debt consolidation">Debt consolidation</option><option value="Other">Other</option></select></label>
              </div>
              {attempted && <p className={styles.error} role="alert">Please complete all fields correctly.</p>}
              <button className={styles.nextButton} type="submit">View sample options <ArrowRight size={20} /></button>
              <button className={styles.textButton} type="button" onClick={() => { setAttempted(false); setStep('otp'); }}>Back to verification</button>
            </form>}
          </section>
        </div>
        <footer className={styles.footer}><span>CreditTrust is owned and operated by Fin Coopers Tech India Private Limited.</span><span>Local design preview</span></footer>
      </div>
    </main>
  );
}
