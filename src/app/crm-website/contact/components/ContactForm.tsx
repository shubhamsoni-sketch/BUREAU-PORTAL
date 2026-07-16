'use client';
import React, { useState } from 'react';

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

export default function ContactForm() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: '', mobile: '', businessName: '', city: '',
    teamSize: '', leadVolume: '', message: '',
  });

  const toggleProduct = (p: string) => {
    setSelectedProducts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white border border-border rounded-xl p-8 text-center card-shadow">
        <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0EA5A0" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 className="text-xl font-extrabold text-primary mb-2">Demo Request Submitted!</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Thank you, <strong>{form.fullName}</strong>. Our team will call you at <strong>{form.mobile}</strong> within 24 hours to schedule yourpersonalized CreditTrust demo.
        </p>
        <a
          href="mailto:support@credittrust.in?subject=CreditTrust%20DSA%20CRM%20Demo%20Request"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold text-sm px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Email CreditTrust
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl p-6 md:p-8 card-shadow">
      <h2 className="text-xl font-extrabold text-primary mb-1">Book My Demo</h2>
      <p className="text-sm text-muted-foreground mb-6">Tell us about your DSA business and we will set up a personalized walkthrough.</p>
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Business / DSA Name *</label>
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
          className="w-full h-12 bg-primary text-white font-bold text-base rounded-lg hover:bg-accent transition-colors duration-200 flex items-center justify-center gap-2"
        >
          Book My Demo
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>

        <p className="text-xs text-center text-muted-foreground">
          By submitting, you agree to our{' '}
          <a href="https://credittrust.in/privacy-policy" className="text-accent hover:underline">Privacy Policy</a>.
          We will never share your data with third parties.
        </p>
      </form>
    </div>
  );
}
