'use client';
import React, { useEffect, useRef } from 'react';

const agents = [
  { name: 'Rajesh Mehta', role: 'Owner', leads: 0, disbursed: 0, color: 'bg-primary', roleColor: 'text-primary bg-primary/10' },
  { name: 'Priya Malhotra', role: 'Manager', leads: 32, disbursed: 11, color: 'bg-accent', roleColor: 'text-accent bg-accent/10' },
  { name: 'Rahul Sharma', role: 'Agent', leads: 14, disbursed: 5, color: 'bg-blue-500', roleColor: 'text-blue-600 bg-blue-50' },
  { name: 'Sunita Rao', role: 'Agent', leads: 11, disbursed: 4, color: 'bg-amber-500', roleColor: 'text-amber-600 bg-amber-50' },
];

export default function TeamManagementSection() {
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
    <section className="py-16 md:py-24 bg-muted/30" id="team-management">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center section-reveal">
          {/* Left: Team Visual */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-xl border border-border overflow-hidden card-shadow">
              <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Team Performance — July 2026</span>
                <span className="text-xs text-muted-foreground">4 members</span>
              </div>
              <div className="divide-y divide-border">
                {agents?.map((agent) => (
                  <div key={agent?.name} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-9 h-9 rounded-full ${agent?.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                      {agent?.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{agent?.name}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${agent?.roleColor}`}>{agent?.role}</span>
                    </div>
                    {agent?.role !== 'Owner' && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{agent?.leads} leads</p>
                        <p className="text-xs text-muted-foreground">{agent?.disbursed} disbursed</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-muted/30 border-t border-border">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Total Leads', value: '57' },
                    { label: 'Disbursals', value: '20' },
                    { label: 'Conversion', value: '35%' },
                  ]?.map((s) => (
                    <div key={s?.label}>
                      <p className="text-sm font-extrabold text-primary">{s?.value}</p>
                      <p className="text-xs text-muted-foreground">{s?.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="order-1 lg:order-2">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-purple-600 mb-3 px-3 py-1 bg-purple-50 rounded-full">Team Management</span>
            <h2 className="text-section-title font-extrabold text-primary mb-4">
              Give every agent the right access and track performance.
            </h2>
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">
              Whether you run a 2-person team or a 20-agent loan team, CreditTrust gives every member the right level of access — and gives owners full visibility.
            </p>
            <div className="space-y-3 mb-6">
              {[
                'Owner/admin dashboard with full visibility',
                'Manager and agent role separation',
                'Lead assignment to specific agents',
                'Agent-wise productivity and disbursal tracking',
                'Role-based access — agents see only their leads',
                'Team-wise performance reports',
              ]?.map((b) => (
                <div key={b} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <svg className="flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}