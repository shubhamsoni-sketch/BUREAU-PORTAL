'use client';
import React, { useEffect, useRef } from 'react';

export default function CreditsSystem() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    if (ref?.current) observer?.observe(ref?.current);
    return () => observer?.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center section-reveal">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3 px-3 py-1 bg-emerald-50 rounded-full">
              Eligibility Credits
            </span>
            <h2 className="text-section-title font-extrabold text-primary mb-5">
              Pay only for what you use.
            </h2>
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">
              Eligibility credits work like a prepaid balance. Your admin purchases credit packs, allocates them to agents, and every check deducts 1 credit. Usage is tracked in real time with full audit visibility.
            </p>
            <div className="space-y-4">
              {[
                {
                  title: 'Agent requests credits',
                  desc: 'When an agent needs more credits, they submit a request from their dashboard.',
                  icon: '📤',
                },
                {
                  title: 'Admin reviews and approves',
                  desc: 'The admin sees the request, reviews the invoice, and approves the credit top-up.',
                  icon: '✅',
                },
                {
                  title: 'Invoice is generated',
                  desc: 'A billing invoice is automatically created and attached to the approval record.',
                  icon: '📄',
                },
                {
                  title: 'Credits added after payment',
                  desc: 'Once payment is confirmed, credits are added to the agent\'s balance instantly.',
                  icon: '💳',
                },
              ]?.map((item) => (
                <div key={item?.title} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{item?.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{item?.title}</p>
                    <p className="text-sm text-muted-foreground">{item?.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Dashboard Visual */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-border p-5 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">Credit Overview</h3>
                <span className="text-xs text-muted-foreground">July 2026</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Total Balance', value: '142', color: 'text-emerald-600' },
                  { label: 'Used This Month', value: '58', color: 'text-primary' },
                  { label: 'Pending Requests', value: '2', color: 'text-amber-600' },
                ]?.map((s) => (
                  <div key={s?.label} className="bg-muted/60 rounded-lg p-3 text-center">
                    <p className={`text-xl font-extrabold ${s?.color}`}>{s?.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s?.label}</p>
                  </div>
                ))}
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '71%' }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>71% remaining of 200-credit pack</span>
                <span className="font-semibold text-emerald-600">142 left</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-hidden card-shadow">
              <div className="px-4 py-3 bg-muted/50 border-b border-border">
                <span className="text-xs font-bold text-foreground">Agent Credit Allocation</span>
              </div>
              {[
                { name: 'Rahul Sharma', used: 22, balance: 28, total: 50 },
                { name: 'Priya Malhotra', used: 18, balance: 32, total: 50 },
                { name: 'Sunita Rao', used: 14, balance: 36, total: 50 },
                { name: 'Amit Kumar', used: 4, balance: 46, total: 50 },
              ]?.map((agent) => (
                <div key={agent?.name} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {agent?.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{agent?.name}</p>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${(agent?.used / agent?.total) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-foreground">{agent?.balance}</p>
                    <p className="text-xs text-muted-foreground">left</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}