import React from 'react';

export default function ContactInfo() {
  return (
    <div className="space-y-5">
      {/* What to expect */}
      <div className="bg-white border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">What happens after you submit?</h3>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Our team reviews your details within a few hours.' },
            { step: '2', text: 'We call you to understand your DSA workflow needs.' },
            { step: '3', text: 'We schedule a personalized 20-minute product demo.' },
            { step: '4', text: 'You get a custom pricing proposal for your team.' },
          ]?.map((item) => (
            <div key={item?.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-0.5">
                {item?.step}
              </div>
              <p className="text-sm text-muted-foreground">{item?.text}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Quick facts */}
      <div className="bg-accent/5 border border-accent/15 rounded-xl p-5">
        <h3 className="text-sm font-bold text-primary mb-3">Why CreditTrust?</h3>
        <div className="space-y-2">
          {[
            'Built specifically for Indian DSA workflows',
            'No bureau resale — eligibility intelligence only',
            'Consent-first customer checks',
            'Works for teams of 1 to 50+ agents',
          ]?.map((fact) => (
            <div key={fact} className="flex items-start gap-2 text-xs text-muted-foreground">
              <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5A0" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {fact}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
