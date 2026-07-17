'use client';
import React, { useEffect, useState } from 'react';

const loanProducts = [
  'Personal Loan',
  'Business Loan',
  'Home Loan',
  'Loan Against Property',
  'Used Car Loan',
  'Other',
];

const teamSizes = ['Just me', '2–5 agents', '6–15 agents', '16–30 agents', '30+ agents'];
const leadVolumes = ['< 20 leads/month', '20–50 leads/month', '50–100 leads/month', '100–200 leads/month', '200+ leads/month'];
const emptyForm = {
  fullName: '', email: '', mobile: '', businessName: '', city: '',
  teamSize: '', leadVolume: '', message: '',
};

export default function ContactForm() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!submitted) return undefined;

    const timer = window.setTimeout(() => {
      setSubmitted(false);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [submitted]);

  const toggleProduct = (p: string) => {
    setSelectedProducts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/crm-demo-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          loanProducts: selectedProducts,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Unable to submit demo request.');
      }

      setSubmitted(true);
      setForm(emptyForm);
      setSelectedProducts([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit demo request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-xl p-6 md:p-8 card-shadow">
      <h2 className="text-xl font-extrabold text-primary mb-1">Book My Demo</h2>
      <p className="text-sm text-muted-foreground mb-6">Tell us about your business and we will set up a personalized walkthrough.</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Full Name *</label>
            <input
              type="text"
              name="fullName"
              required
              value={form.fullName}
              onChange={handleChange}
              placeholder="Rajesh Mehta"
              className="w-full h-11 px-3.5 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Email ID *</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full h-11 px-3.5 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Mobile Number *</label>
            <input
              type="tel"
              name="mobile"
              required
              value={form.mobile}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full h-11 px-3.5 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Business Name *</label>
            <input
              type="text"
              name="businessName"
              required
              value={form.businessName}
              onChange={handleChange}
              placeholder="Mehta Finance Solutions"
              className="w-full h-11 px-3.5 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">City *</label>
            <input
              type="text"
              name="city"
              required
              value={form.city}
              onChange={handleChange}
              placeholder="Mumbai"
              className="w-full h-11 px-3.5 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Team Size</label>
            <select
              name="teamSize"
              value={form.teamSize}
              onChange={handleChange}
              className="w-full h-11 px-3.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            >
              <option value="">Select team size</option>
              {teamSizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Monthly Lead Volume</label>
            <select
              name="leadVolume"
              value={form.leadVolume}
              onChange={handleChange}
              className="w-full h-11 px-3.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            >
              <option value="">Select volume</option>
              {leadVolumes.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-2">Loan Products Handled</label>
          <div className="flex flex-wrap gap-2">
            {loanProducts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => toggleProduct(p)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  selectedProducts.includes(p)
                    ? 'bg-primary text-white border-primary' :'bg-white text-foreground border-border hover:border-accent hover:text-accent'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Message (optional)</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={3}
            placeholder="Tell us about your current workflow or any specific questions..."
            className="w-full px-3.5 py-3 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 bg-primary text-white font-bold text-base rounded-lg hover:bg-accent transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {submitting ? 'Sending Request...' : 'Book My Demo'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>

        {error && (
          <p className="text-sm font-semibold text-red-600 text-center">{error}</p>
        )}

        <p className="text-xs text-center text-muted-foreground">
          By submitting, you agree to our{' '}
          <button
            type="button"
            onClick={() => setShowPrivacyPolicy(true)}
            className="font-semibold text-accent hover:underline"
          >
            Privacy Policy
          </button>.
          We will never share your data with third parties.
        </p>
      </form>

      {submitted && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/35 px-4"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-sm rounded-xl border border-accent/20 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0EA5A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-lg font-extrabold text-primary">
              Demo request placed successfully
            </p>
          </div>
        </div>
      )}

      {showPrivacyPolicy && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-privacy-policy-title"
        >
          <div className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 id="demo-privacy-policy-title" className="text-lg font-extrabold text-primary">
                  Privacy Policy
                </h3>
                <p className="text-xs text-muted-foreground">Last updated: 12 May 2026</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyPolicy(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-accent hover:text-accent"
                aria-label="Close privacy policy"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto px-5 py-5 text-sm leading-relaxed text-muted-foreground">
              <p className="mb-4">
                CreditTrust collects only the information required to respond to demo enquiries, provide CRM and financial utility services, run partner onboarding, process payments, support customers, and maintain platform security.
              </p>

              <h4 className="mb-2 font-bold text-foreground">Information we collect</h4>
              <ul className="mb-4 list-disc space-y-1.5 pl-5">
                <li>Name, email, mobile number, city, business name, team size, lead volume, and selected loan products submitted in this demo form.</li>
                <li>Technical details such as IP address, browser/device information, timestamps, and basic request logs for security and support.</li>
                <li>Partner, payment, wallet, invoice, consent, and report-related details only when you use those platform services.</li>
              </ul>

              <h4 className="mb-2 font-bold text-foreground">How we use this data</h4>
              <ul className="mb-4 list-disc space-y-1.5 pl-5">
                <li>To contact you about your demo request and understand your business requirements.</li>
                <li>To provide access to CreditTrust CRM, partner portal, eligibility workflows, support, billing, and compliance operations where applicable.</li>
                <li>To prevent misuse, detect suspicious activity, maintain audit records, and improve platform reliability.</li>
              </ul>

              <h4 className="mb-2 font-bold text-foreground">Data sharing</h4>
              <p className="mb-4">
                We do not sell personal data. We share data only with trusted service providers when required for email delivery, hosting, analytics, payment processing, customer support, legal compliance, fraud prevention, or the service requested by you.
              </p>

              <h4 className="mb-2 font-bold text-foreground">Consent and control</h4>
              <p className="mb-4">
                You may contact us to request correction, support, or deletion review of your information, subject to legal, payment, audit, fraud-prevention, and contractual retention requirements.
              </p>

              <div className="rounded-lg border border-border bg-background p-4">
                <p className="font-semibold text-foreground">Contact</p>
                <a href="mailto:support@credittrust.in" className="font-bold text-accent hover:underline">
                  support@credittrust.in
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
