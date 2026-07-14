'use client';
import React, { useState } from 'react';

interface EMIResult {
  emi: number;
  totalPayable: number;
  totalInterest: number;
  schedule: { month: number; emi: number; principal: number; interest: number; balance: number }[];
}

function calcEMI(principal: number, annualRate: number, tenureMonths: number): EMIResult {
  const r = annualRate / 12 / 100;
  if (r === 0) {
    const emi = principal / tenureMonths;
    return { emi, totalPayable: principal, totalInterest: 0, schedule: [] };
  }
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  const totalPayable = emi * tenureMonths;
  const totalInterest = totalPayable - principal;
  const schedule: EMIResult['schedule'] = [];
  let balance = principal;
  for (let m = 1; m <= Math.min(tenureMonths, 12); m++) {
    const interest = balance * r;
    const principalPaid = emi - interest;
    balance -= principalPaid;
    schedule.push({
      month: m,
      emi,
      principal: principalPaid,
      interest,
      balance: Math.max(0, balance),
    });
  }
  return { emi, totalPayable, totalInterest, schedule };
}

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

export default function ToolsContent() {
  const [loanAmount, setLoanAmount] = useState('2500000');
  const [interestRate, setInterestRate] = useState('10.5');
  const [tenure, setTenure] = useState('60');
  const [tenureType, setTenureType] = useState<'months' | 'years'>('months');

  const tenureMonths = tenureType === 'years' ? Number(tenure) * 12 : Number(tenure);
  const principal = Number(loanAmount) || 0;
  const rate = Number(interestRate) || 0;
  const result =
    principal > 0 && rate > 0 && tenureMonths > 0 ? calcEMI(principal, rate, tenureMonths) : null;

  const principalPct = result ? Math.round((principal / result.totalPayable) * 100) : 0;
  const interestPct = result ? 100 - principalPct : 0;

  return (
    <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-700 text-foreground">EMI Calculator</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Financial calculators and utilities for CreditTrust teams
        </p>
      </div>

      {/* Tool tabs — only EMI for now */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-1.5 h-8 px-3 rounded-sm bg-primary/10 text-primary text-xs font-700 border border-primary/20">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="10" x2="16" y2="10" />
            <line x1="8" y1="14" x2="12" y2="14" />
          </svg>
          EMI Calculator
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border shadow-card p-5 space-y-5">
          <h2 className="text-base font-700 text-foreground">Loan Details</h2>

          <div className="space-y-1.5">
            <label className="block text-sm font-600 text-foreground">Loan Amount (₹)</label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="2500000"
              className="w-full h-10 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            {principal > 0 && (
              <p className="text-xs text-muted-foreground">{formatINR(principal)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-600 text-foreground">
              Annual Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="10.5"
              className="w-full h-10 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <input
              type="range"
              min="5"
              max="36"
              step="0.5"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>5%</span>
              <span>36%</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-600 text-foreground">Loan Tenure</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                placeholder="60"
                className="flex-1 h-10 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <div className="flex rounded-sm border border-border overflow-hidden">
                {(['months', 'years'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTenureType(t)}
                    className={[
                      'px-3 h-10 text-xs font-600 transition-colors',
                      tenureType === t
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-muted',
                    ].join(' ')}
                  >
                    {t === 'months' ? 'Mo' : 'Yr'}
                  </button>
                ))}
              </div>
            </div>
            {tenureMonths > 0 && (
              <p className="text-xs text-muted-foreground">
                {tenureType === 'years'
                  ? `${tenureMonths} months`
                  : `${(tenureMonths / 12).toFixed(1)} years`}
              </p>
            )}
          </div>

          {/* Quick presets */}
          <div>
            <p className="text-xs font-600 text-muted-foreground mb-2">Quick Presets</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                {
                  label: 'Home Loan',
                  amount: '5000000',
                  rate: '8.75',
                  tenure: '240',
                  type: 'months' as const,
                },
                {
                  label: 'Personal Loan',
                  amount: '500000',
                  rate: '14',
                  tenure: '48',
                  type: 'months' as const,
                },
                {
                  label: 'Business Loan',
                  amount: '2000000',
                  rate: '12',
                  tenure: '60',
                  type: 'months' as const,
                },
                {
                  label: 'Car Loan',
                  amount: '800000',
                  rate: '9.5',
                  tenure: '60',
                  type: 'months' as const,
                },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setLoanAmount(p.amount);
                    setInterestRate(p.rate);
                    setTenure(p.tenure);
                    setTenureType(p.type);
                  }}
                  className="px-2.5 py-1 rounded-sm border border-border text-[10px] font-600 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'Monthly EMI',
                    value: formatINR(result.emi),
                    color: 'text-primary',
                    bg: 'bg-primary/5 border-primary/20',
                  },
                  {
                    label: 'Total Payable',
                    value: formatINR(result.totalPayable),
                    color: 'text-foreground',
                    bg: 'bg-card border-border',
                  },
                  {
                    label: 'Total Interest',
                    value: formatINR(result.totalInterest),
                    color: 'text-warning',
                    bg: 'bg-warning/5 border-warning/20',
                  },
                ].map((m) => (
                  <div key={m.label} className={`rounded-lg border ${m.bg} p-4`}>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className={`text-lg font-700 mt-1 ${m.color} tabular-nums`}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Visual breakdown */}
              <div className="bg-card rounded-lg border border-border shadow-card p-5">
                <h3 className="text-sm font-700 text-foreground mb-4">Payment Breakdown</h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-28 h-28 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="3.5"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="3.5"
                        strokeDasharray={`${principalPct} ${100 - principalPct}`}
                        strokeLinecap="round"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="var(--warning)"
                        strokeWidth="3.5"
                        strokeDasharray={`${interestPct} ${100 - interestPct}`}
                        strokeDashoffset={`${-principalPct}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-muted-foreground">EMI</span>
                      <span className="text-xs font-700 text-foreground">
                        {formatINR(result.emi).replace('₹', '₹')}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-xs text-muted-foreground">Principal</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-700 text-foreground">{formatINR(principal)}</p>
                        <p className="text-[10px] text-muted-foreground">{principalPct}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-warning" />
                        <span className="text-xs text-muted-foreground">Interest</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-700 text-foreground">
                          {formatINR(result.totalInterest)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{interestPct}%</p>
                      </div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-700 text-foreground">Total Payable</span>
                      <p className="text-xs font-700 text-foreground">
                        {formatINR(result.totalPayable)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amortization table (first 12 months) */}
              {result.schedule.length > 0 && (
                <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-700 text-foreground">
                      Amortization Schedule{' '}
                      <span className="text-xs font-400 text-muted-foreground">
                        (First 12 months)
                      </span>
                    </h3>
                  </div>
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border">
                          {['Month', 'EMI', 'Principal', 'Interest', 'Balance'].map((col) => (
                            <th
                              key={col}
                              className="px-4 py-2.5 text-left text-[10px] font-600 uppercase tracking-wide text-muted-foreground"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {result.schedule.map((row) => (
                          <tr key={row.month} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-2 font-600 text-muted-foreground">
                              {row.month}
                            </td>
                            <td className="px-4 py-2 font-700 text-foreground tabular-nums">
                              {formatINR(row.emi)}
                            </td>
                            <td className="px-4 py-2 text-primary font-600 tabular-nums">
                              {formatINR(row.principal)}
                            </td>
                            <td className="px-4 py-2 text-warning font-600 tabular-nums">
                              {formatINR(row.interest)}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground tabular-nums">
                              {formatINR(row.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-card rounded-lg border border-border shadow-card p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <line x1="8" y1="6" x2="16" y2="6" />
                  <line x1="8" y1="10" x2="16" y2="10" />
                  <line x1="8" y1="14" x2="12" y2="14" />
                </svg>
              </div>
              <p className="text-sm font-600 text-foreground">
                Enter loan details to calculate EMI
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Fill in the loan amount, interest rate, and tenure on the left
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
