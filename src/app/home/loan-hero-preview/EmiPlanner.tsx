'use client';

import { useMemo, useState } from 'react';
import { Calculator, IndianRupee } from 'lucide-react';
import styles from './page.module.css';

const rupees = (value: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value));

export default function EmiPlanner() {
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(12);
  const [months, setMonths] = useState(36);
  const { emi, totalInterest } = useMemo(() => {
    const monthlyRate = rate / 1200;
    const payment = monthlyRate === 0 ? amount / months : amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
    return { emi: payment, totalInterest: payment * months - amount };
  }, [amount, rate, months]);

  return (
    <section className={`${styles.section} ${styles.plannerSection}`} id="emi-planner" aria-labelledby="planner-title">
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeading}><p className={styles.kicker}>Plan with perspective</p><h2 id="planner-title">See the numbers <em>before the next step.</em></h2><p>Adjust the details to explore an illustrative monthly repayment.</p></div>
        <div className={styles.plannerCard}>
          <div className={styles.plannerControls}>
            <div className={styles.plannerIcon}><Calculator size={25} /></div>
            <label className={styles.sliderField}><span>Loan amount <strong>₹{rupees(amount)}</strong></span><input type="range" min="50000" max="3000000" step="10000" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /><small>₹50,000 <span>₹30,00,000</span></small></label>
            <label className={styles.sliderField}><span>Illustrative annual rate <strong>{rate.toFixed(1)}%</strong></span><input type="range" min="6" max="24" step="0.5" value={rate} onChange={(event) => setRate(Number(event.target.value))} /><small>6% <span>24%</span></small></label>
            <label className={styles.sliderField}><span>Repayment term <strong>{months} months</strong></span><input type="range" min="6" max="84" step="6" value={months} onChange={(event) => setMonths(Number(event.target.value))} /><small>6 months <span>84 months</span></small></label>
          </div>
          <div className={styles.plannerResult} aria-live="polite">
            <span className={styles.resultIcon}><IndianRupee size={25} /></span>
            <p>Estimated monthly EMI</p><strong>₹{rupees(emi)}</strong>
            <div className={styles.resultBreakdown}><span>Principal <b>₹{rupees(amount)}</b></span><span>Estimated interest <b>₹{rupees(totalInterest)}</b></span><span>Total repayment <b>₹{rupees(amount + totalInterest)}</b></span></div>
            <small>Illustration only, not a loan offer. Your actual rate, terms and EMI depend on the relevant provider.</small>
          </div>
        </div>
      </div>
    </section>
  );
}
