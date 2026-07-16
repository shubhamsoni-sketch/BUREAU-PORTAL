'use client';
import React, { useEffect, useRef } from 'react';

export default function LeadFileSection() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    if (ref?.current) observer?.observe(ref?.current);
    return () => observer?.disconnect();
  }, []);

  const stages = [
    { label: 'Lead Captured', status: 'done', desc: 'Name, mobile, loan type, amount' },
    { label: 'Eligibility Checked', status: 'done', desc: 'Profile assessed, lenders shortlisted' },
    { label: 'File Prepared', status: 'done', desc: 'Documents collected, checklist complete' },
    { label: 'Sent to Lender', status: 'active', desc: 'HDFC Bank — Personal Loan' },
    { label: 'Login Pending', status: 'pending', desc: 'Awaiting bank login confirmation' },
    { label: 'Disbursed', status: 'pending', desc: 'Final step — payout confirmed' },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30" id="lead-management">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center section-reveal">
          {/* Left: Visual — Pipeline */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-xl border border-border p-5 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-foreground">Ananya Sharma</p>
                  <p className="text-xs text-muted-foreground">Home Loan · ₹45 Lakhs · Assigned: Rahul S.</p>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">In Progress</span>
              </div>
              <div className="space-y-3">
                {stages?.map((stage, i) => (
                  <div key={stage?.label} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        stage?.status === 'done' ? 'bg-accent text-white' :
                        stage?.status === 'active'? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {stage?.status === 'done' ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <span className="text-xs font-bold">{i + 1}</span>
                        )}
                      </div>
                      {i < stages?.length - 1 && (
                        <div className={`w-0.5 h-6 mt-1 ${stage?.status === 'done' ? 'bg-accent/40' : 'bg-border'}`} />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={`text-xs font-semibold ${stage?.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>{stage?.label}</p>
                      <p className="text-xs text-muted-foreground">{stage?.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="order-1 lg:order-2">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 px-3 py-1 bg-blue-50 rounded-full">Lead & File Management</span>
            <h2 className="text-section-title font-extrabold text-primary mb-4">
              Track every customer from first call to disbursal.
            </h2>
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">
              Every lead that enters CreditTrust is tracked through a clear pipeline. Agents see their tasks, owners see the full picture, and nothing falls through the cracks.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: '📋', label: 'Lead pipeline view' },
                { icon: '📝', label: 'Customer notes' },
                { icon: '⏰', label: 'Follow-up reminders' },
                { icon: '📁', label: 'File status tracking' },
                { icon: '📎', label: 'Document checklist' },
                { icon: '✅', label: 'Disbursal movement' },
              ]?.map((item) => (
                <div key={item?.label} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="text-base">{item?.icon}</span>
                  <span className="font-medium">{item?.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}