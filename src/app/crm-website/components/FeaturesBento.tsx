'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function FeaturesBento() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    if (titleRef.current) observer.observe(titleRef.current);
    cardRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={titleRef} className="text-center mb-12 section-reveal">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-3 px-3 py-1 bg-accent/10 rounded-full">
            Platform Features
          </span>
          <h2 className="text-section-title font-extrabold text-primary mb-4">
            Everything your DSA business needs, in one place.
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            From first lead to final disbursal — CreditTrust handles every step of the loan distribution workflow.
          </p>
        </div>

        {/* BENTO GRID — 6 cards
          Row 1: [col-1 to col-3: EligibilityIntelligence cs-3] [col-4 to col-6: LeadFileManagement cs-3]
          Row 2: [col-1 to col-2: LenderWorkflow cs-2] [col-3 to col-4: TeamManagement cs-2] [col-5 to col-6: CreditsAccounting cs-2]
          Row 3: [col-1 to col-6: ReportsPerformance cs-6]
          Placed 6/6 ✓
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">

          {/* Card 1: Eligibility Intelligence — lg:col-span-3 */}
          <div
            ref={(el) => { cardRefs.current[0] = el; }}
            className="stagger-child lg:col-span-3 bg-white border border-border rounded-xl p-6 feature-card-hover overflow-hidden relative"
            style={{ transitionDelay: '0ms' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 blob-accent pointer-events-none" />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-accent mb-2 block">Eligibility Intelligence</span>
              <h3 className="text-lg font-extrabold text-primary mb-2">Qualify customers before sending files to lenders.</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Run consent-based customer checks, understand profile strength, and make faster decisions before spending time on the wrong lender.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['Faster qualification', 'Better lender fit', 'Reduced rejections', 'Usage-based credits'].map((b) => (
                  <div key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0EA5A0" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {b}
                  </div>
                ))}
              </div>
              {/* Mini eligibility widget */}
              <div className="bg-muted/60 rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground">Rajesh Kumar · Personal Loan</span>
                  <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">High Fit</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-accent rounded-full" style={{ width: '82%' }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Profile Strength</span><span className="font-semibold text-foreground">82 / 100</span>
                </div>
              </div>
              <Link href="/eligibility-checker" className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent mt-3 hover:text-primary transition-colors">
                See how it works →
              </Link>
            </div>
          </div>

          {/* Card 2: Lead & File Management — lg:col-span-3 */}
          <div
            ref={(el) => { cardRefs.current[1] = el; }}
            className="stagger-child lg:col-span-3 bg-primary rounded-xl p-6 feature-card-hover overflow-hidden relative"
            style={{ transitionDelay: '80ms' }}
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-accent mb-2 block">Lead & File Management</span>
            <h3 className="text-lg font-extrabold text-white mb-2">Track every customer from first call to disbursal.</h3>
            <p className="text-sm text-white/70 mb-4 leading-relaxed">
              Capture leads, add notes, set follow-up reminders, manage document checklists, and track file status at every stage.
            </p>
            <div className="space-y-2">
              {[
                { stage: 'New Lead', name: 'Ananya Sharma', product: 'Home Loan ₹45L', status: 'bg-blue-400' },
                { stage: 'Eligibility Done', name: 'Mohammed Rafi', product: 'Business Loan ₹15L', status: 'bg-accent' },
                { stage: 'File Sent', name: 'Sunita Verma', product: 'LAP ₹30L', status: 'bg-amber-400' },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-3 bg-white/10 rounded-lg px-3 py-2">
                  <div className={`w-2 h-2 rounded-full ${item.status} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                    <p className="text-xs text-white/60">{item.product}</p>
                  </div>
                  <span className="text-xs text-white/60 flex-shrink-0">{item.stage}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Lender Workflow — lg:col-span-2 */}
          <div
            ref={(el) => { cardRefs.current[2] = el; }}
            className="stagger-child lg:col-span-2 bg-white border border-border rounded-xl p-6 feature-card-hover"
            style={{ transitionDelay: '160ms' }}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 block">Lender Workflow</span>
            <h3 className="text-base font-extrabold text-primary mb-2">Route files to the right lender.</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Track every file movement across lenders with clear status labels.</p>
            <div className="space-y-2">
              {[
                { label: 'File Sent', color: 'bg-blue-100 text-blue-600' },
                { label: 'Login Pending', color: 'bg-amber-100 text-amber-600' },
                { label: 'Approved', color: 'bg-emerald-100 text-emerald-600' },
                { label: 'Disbursed', color: 'bg-primary/10 text-primary' },
              ].map((s) => (
                <div key={s.label} className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg ${s.color} inline-block mr-1`}>
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Team Management — lg:col-span-2 */}
          <div
            ref={(el) => { cardRefs.current[3] = el; }}
            className="stagger-child lg:col-span-2 bg-white border border-border rounded-xl p-6 feature-card-hover"
            style={{ transitionDelay: '240ms' }}
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-2 block">Team Management</span>
            <h3 className="text-base font-extrabold text-primary mb-2">Give every agent the right access.</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Owner, manager, and agent roles with lead assignment and productivity tracking.</p>
            <div className="flex -space-x-2">
              {['Owner', 'Mgr', 'Agt', 'Agt'].map((role, i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white ${['bg-primary', 'bg-accent', 'bg-blue-500', 'bg-amber-500'][i]}`}>
                  {role[0]}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">+</div>
            </div>
          </div>

          {/* Card 5: Credits & Accounting — lg:col-span-2 */}
          <div
            ref={(el) => { cardRefs.current[4] = el; }}
            className="stagger-child lg:col-span-2 bg-white border border-border rounded-xl p-6 feature-card-hover"
            style={{ transitionDelay: '320ms' }}
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2 block">Credits & Accounting</span>
            <h3 className="text-base font-extrabold text-primary mb-2">Simple credit and invoice tracking.</h3>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">Request credits, admin approval, invoice generation, and usage statements.</p>
            <div className="bg-muted/60 rounded-lg p-3 border border-border">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Credit Balance</span>
                <span className="font-extrabold text-emerald-600">142 credits</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '58%' }} />
              </div>
            </div>
          </div>

          {/* Card 6: Reports & Performance — lg:col-span-6 */}
          <div
            ref={(el) => { cardRefs.current[5] = el; }}
            className="stagger-child lg:col-span-6 bg-gradient-to-r from-primary to-primary/90 rounded-xl p-6 md:p-8 feature-card-hover overflow-hidden relative"
            style={{ transitionDelay: '400ms' }}
          >
            <div className="absolute right-0 top-0 h-full w-1/3 bg-accent/5 pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-accent mb-2 block">Reports & Performance</span>
                <h3 className="text-xl font-extrabold text-white mb-3">Clean reports for smarter business decisions.</h3>
                <p className="text-sm text-white/70 mb-4 leading-relaxed">
                  Monthly disbursal summaries, agent-wise productivity, lender conversion rates, and credit usage — all in one dashboard view.
                </p>
                <Link href="/features" className="inline-flex items-center gap-2 bg-accent text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-white hover:text-primary transition-colors">
                  See All Features
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Disbursed MTD', value: '₹1.2Cr', trend: '+18%' },
                  { label: 'Conversion Rate', value: '34%', trend: '+5%' },
                  { label: 'Active Files', value: '47', trend: '+8' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-white/60 mb-1">{stat.label}</p>
                    <p className="text-xl font-extrabold text-white">{stat.value}</p>
                    <p className="text-xs font-semibold text-accent">{stat.trend}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}