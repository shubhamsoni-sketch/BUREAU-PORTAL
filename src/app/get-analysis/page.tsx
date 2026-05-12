'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import PublicNav from '../home/components/PublicNav';
import PublicFooter from '../home/components/PublicFooter';
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle,
  Lock,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Activity,
  BarChart3,
  FileText,
  User,
  Phone,
  Calendar,
  Hash,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingDown,
  Zap,
  Target,
  AlertCircle,
  Star,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Step = 'details' | 'otp' | 'processing' | 'result';

interface UserDetails {
  fullName: string;
  pan: string;
  dob: string;
  phone: string;
  email: string;
  state: string;
}

interface CreditResult {
  score: number | null;
  reportUrl: string | null;
  insights: Record<string, unknown>;
  accounts: Record<string, unknown>[];
  enquiries: Record<string, unknown>[];
  summary: Record<string, unknown>;
}

// ─── Indian States ──────────────────────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
];

// ─── Processing Steps ───────────────────────────────────────────────────────────
const PROCESSING_STEPS = [
  { label: 'Validating identity', icon: 'shield', duration: 700 },
  { label: 'Fetching financial data', icon: 'database', duration: 800 },
  { label: 'Analyzing profile', icon: 'chart', duration: 750 },
  { label: 'Generating insights', icon: 'sparkle', duration: 650 },
];

// ─── Score Helpers ──────────────────────────────────────────────────────────────
function getScoreGrade(score: number | null): { label: string; color: string; bg: string; border: string } {
  if (score === null) return { label: 'N/A', color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/25' };
  if (score >= 750) return { label: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/25' };
  if (score >= 700) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/25' };
  if (score >= 650) return { label: 'Fair', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/25' };
  return { label: 'Poor', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/25' };
}

function getScoreArcColor(score: number | null): string {
  if (score === null) return '#64748b';
  if (score >= 750) return '#22c55e';
  if (score >= 700) return '#3b82f6';
  if (score >= 650) return '#f59e0b';
  return '#ef4444';
}

function formatCurrency(val: unknown): string {
  const num = Number(val);
  if (isNaN(num)) return String(val ?? '—');
  return `₹${num.toLocaleString('en-IN')}`;
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

// ─── Intelligence helpers ───────────────────────────────────────────────────────
function buildProfileSummary(result: CreditResult): string {
  const score = result.score ?? 0;
  const insights = result.insights as Record<string, unknown>;
  const utilization = Number(insights?.creditUtilization ?? 0);
  const overdueAccounts = Number(insights?.overdueAccounts ?? 0);
  const recentEnquiries = Number(insights?.recentEnquiries ?? 0);
  const paymentHistory = String(insights?.paymentHistory ?? '');

  const parts: string[] = [];

  if (score >= 750) {
    parts.push('This profile reflects a strong credit standing with a well-maintained repayment track record.');
  } else if (score >= 700) {
    parts.push('This profile shows a generally healthy credit history with room for improvement in a few areas.');
  } else if (score >= 650) {
    parts.push('This profile indicates moderate credit health — some positive signals exist alongside areas that need attention.');
  } else {
    parts.push('This profile reflects credit stress with multiple risk indicators that require immediate attention.');
  }

  const flags: string[] = [];
  if (utilization > 50) flags.push('elevated credit utilization');
  if (recentEnquiries > 3) flags.push('recent enquiry activity');
  if (overdueAccounts > 0) flags.push('overdue account presence');
  if (paymentHistory && paymentHistory.toLowerCase().includes('good')) flags.push('consistent repayment behavior');

  if (flags.length > 0) {
    parts.push(`Key observations include ${flags.join(', ')}.`);
  }

  return parts.join(' ');
}

function buildKeySignals(result: CreditResult): { type: 'positive' | 'warning' | 'negative'; label: string }[] {
  const insights = result.insights as Record<string, unknown>;
  const score = result.score ?? 0;
  const utilization = Number(insights?.creditUtilization ?? 0);
  const overdueAccounts = Number(insights?.overdueAccounts ?? 0);
  const recentEnquiries = Number(insights?.recentEnquiries ?? 0);
  const activeAccounts = Number(insights?.activeAccounts ?? 0);
  const closedAccounts = Number(insights?.closedAccounts ?? 0);
  const paymentHistory = String(insights?.paymentHistory ?? '');

  const signals: { type: 'positive' | 'warning' | 'negative'; label: string }[] = [];

  if (score >= 700) signals.push({ type: 'positive', label: 'Credit score in healthy range' });
  else if (score >= 650) signals.push({ type: 'warning', label: 'Credit score below optimal threshold' });
  else if (score > 0) signals.push({ type: 'negative', label: 'Low credit score — needs improvement' });

  if (paymentHistory && (paymentHistory.toLowerCase().includes('good') || paymentHistory.toLowerCase().includes('excellent'))) {
    signals.push({ type: 'positive', label: 'Strong repayment history' });
  } else if (overdueAccounts === 0 && result.accounts.length > 0) {
    signals.push({ type: 'positive', label: 'No overdue accounts detected' });
  }

  if (utilization > 70) signals.push({ type: 'negative', label: 'Very high credit utilization (above 70%)' });
  else if (utilization > 40) signals.push({ type: 'warning', label: 'Credit utilization above recommended 30–40% threshold' });
  else if (utilization > 0) signals.push({ type: 'positive', label: 'Credit utilization within safe range' });

  if (recentEnquiries > 5) signals.push({ type: 'negative', label: 'High number of recent credit enquiries' });
  else if (recentEnquiries > 2) signals.push({ type: 'warning', label: 'Multiple recent enquiries noted' });
  else if (recentEnquiries > 0) signals.push({ type: 'warning', label: 'Recent credit enquiry activity' });

  if (overdueAccounts > 0) signals.push({ type: 'negative', label: `${overdueAccounts} overdue account${overdueAccounts > 1 ? 's' : ''} on record` });

  if (activeAccounts > 0 && closedAccounts > 0) signals.push({ type: 'positive', label: 'Balanced mix of active and closed accounts' });
  else if (activeAccounts > 0) signals.push({ type: 'positive', label: 'Active credit accounts in good standing' });

  return signals.slice(0, 5);
}

function buildBehaviorAnalysis(result: CreditResult): { title: string; text: string }[] {
  const insights = result.insights as Record<string, unknown>;
  const utilization = Number(insights?.creditUtilization ?? 0);
  const recentEnquiries = Number(insights?.recentEnquiries ?? 0);
  const overdueAccounts = Number(insights?.overdueAccounts ?? 0);
  const activeAccounts = Number(insights?.activeAccounts ?? 0);
  const totalOutstanding = Number(insights?.totalOutstanding ?? 0);
  const paymentHistory = typeof insights?.paymentHistory === 'string' ? insights.paymentHistory : '';

  const behaviors: { title: string; text: string }[] = [];

  // Repayment behavior
  if (overdueAccounts === 0 && activeAccounts > 0) {
    behaviors.push({
      title: 'Repayment Behavior',
      text: 'Repayments appear to be consistently on time with no overdue balances detected. This is one of the strongest positive signals in a credit profile and suggests disciplined financial management.',
    });
  } else if (overdueAccounts > 0) {
    behaviors.push({
      title: 'Repayment Behavior',
      text: `There are ${overdueAccounts} account${overdueAccounts > 1 ? 's' : ''} with overdue balances, which negatively impacts the credit score. Missed or delayed payments are the single largest factor in credit score deterioration.`,
    });
  } else if (paymentHistory) {
    behaviors.push({
      title: 'Repayment Behavior',
      text: `Payment history is recorded as "${paymentHistory}". Consistent on-time payments are the foundation of a healthy credit profile.`,
    });
  }

  // Credit usage trend
  if (utilization > 0) {
    const usageText =
      utilization > 70
        ? `Credit utilization is critically high at ${utilization}%. This signals to lenders that the borrower may be over-reliant on credit, which significantly reduces the score.`
        : utilization > 40
        ? `Credit utilization stands at ${utilization}%, which is above the recommended 30% threshold. Reducing outstanding balances would have a direct positive impact on the score.`
        : `Credit utilization is at a healthy ${utilization}%, well within the recommended range. This reflects responsible credit usage and positively influences the score.`;
    behaviors.push({ title: 'Credit Usage Trend', text: usageText });
  }

  // Enquiry frequency
  if (recentEnquiries > 0) {
    const enqText =
      recentEnquiries > 5
        ? `${recentEnquiries} recent credit enquiries have been recorded. A high enquiry count suggests active credit-seeking behavior, which lenders interpret as financial stress or credit dependency.`
        : recentEnquiries > 2
        ? `${recentEnquiries} recent enquiries are on record. While not alarming, multiple enquiries in a short window can temporarily lower the score and signal increased credit appetite.`
        : `${recentEnquiries} recent enquir${recentEnquiries > 1 ? 'ies' : 'y'} noted. This is within normal range and unlikely to have a significant impact on the score.`;
    behaviors.push({ title: 'Enquiry Frequency', text: enqText });
  }

  return behaviors;
}

function buildRiskIndicators(result: CreditResult): string[] {
  const insights = result.insights as Record<string, unknown>;
  const score = result.score ?? 0;
  const utilization = Number(insights?.creditUtilization ?? 0);
  const overdueAccounts = Number(insights?.overdueAccounts ?? 0);
  const recentEnquiries = Number(insights?.recentEnquiries ?? 0);
  const activeAccounts = Number(insights?.activeAccounts ?? 0);
  const totalOutstanding = Number(insights?.totalOutstanding ?? 0);

  const risks: string[] = [];

  if (overdueAccounts > 0) risks.push(`${overdueAccounts} account${overdueAccounts > 1 ? 's' : ''} with overdue balances — immediate resolution recommended`);
  if (utilization > 70) risks.push('Critical credit utilization above 70% — significantly impacts score');
  else if (utilization > 40) risks.push('Credit utilization above recommended 30–40% threshold');
  if (recentEnquiries > 5) risks.push('Excessive recent enquiries — indicates high credit-seeking activity');
  else if (recentEnquiries > 3) risks.push('Multiple recent enquiries may signal credit dependency');
  if (activeAccounts > 6) risks.push(`High number of active loans (${activeAccounts}) — increases debt burden`);
  if (score < 650 && score > 0) risks.push('Score below 650 — most lenders consider this high-risk territory');
  if (totalOutstanding > 1000000) risks.push('High total outstanding balance relative to typical income ranges');

  return risks;
}

function buildStrengths(result: CreditResult): string[] {
  const insights = result.insights as Record<string, unknown>;
  const score = result.score ?? 0;
  const utilization = Number(insights?.creditUtilization ?? 0);
  const overdueAccounts = Number(insights?.overdueAccounts ?? 0);
  const activeAccounts = Number(insights?.activeAccounts ?? 0);
  const closedAccounts = Number(insights?.closedAccounts ?? 0);
  const oldestAccount = String(insights?.oldestAccount ?? '');

  const strengths: string[] = [];

  if (score >= 750) strengths.push('Excellent credit score — qualifies for premium loan products and best interest rates');
  else if (score >= 700) strengths.push('Good credit score — eligible for most standard loan products');
  else if (score >= 650) strengths.push('Fair credit score — some lending options available with standard terms');

  if (overdueAccounts === 0 && activeAccounts > 0) strengths.push('Clean repayment record — no overdue accounts on file');
  if (utilization > 0 && utilization <= 30) strengths.push('Excellent credit utilization — well within the optimal 30% range');
  if (activeAccounts > 0 && closedAccounts > 0) strengths.push('Healthy credit mix — demonstrates experience managing multiple credit types');
  if (oldestAccount && oldestAccount !== 'undefined' && oldestAccount !== '') strengths.push(`Established credit history — oldest account from ${oldestAccount}`);
  if (activeAccounts > 0) strengths.push(`${activeAccounts} active credit account${activeAccounts > 1 ? 's' : ''} in good standing`);

  return strengths;
}

function buildRecommendedActions(result: CreditResult): { priority: 'high' | 'medium' | 'low'; action: string; reason: string }[] {
  const insights = result.insights as Record<string, unknown>;
  const score = result.score ?? 0;
  const utilization = Number(insights?.creditUtilization ?? 0);
  const overdueAccounts = Number(insights?.overdueAccounts ?? 0);
  const recentEnquiries = Number(insights?.recentEnquiries ?? 0);
  const activeAccounts = Number(insights?.activeAccounts ?? 0);

  const actions: { priority: 'high' | 'medium' | 'low'; action: string; reason: string }[] = [];

  if (overdueAccounts > 0) {
    actions.push({
      priority: 'high',
      action: 'Clear all overdue balances immediately',
      reason: 'Overdue accounts are the single biggest drag on your score. Resolving them can improve your score by 50–100 points.',
    });
  }

  if (utilization > 40) {
    actions.push({
      priority: utilization > 70 ? 'high' : 'medium',
      action: 'Reduce credit utilization below 30%',
      reason: 'Pay down outstanding balances on credit cards and revolving credit. Lower utilization directly boosts your score.',
    });
  }

  if (recentEnquiries > 2) {
    actions.push({
      priority: 'medium',
      action: 'Avoid new credit applications for 30–60 days',
      reason: 'Each hard enquiry temporarily lowers your score. A pause in applications allows your score to recover.',
    });
  }

  if (activeAccounts > 6) {
    actions.push({
      priority: 'medium',
      action: 'Consider closing unused or inactive accounts',
      reason: 'Too many active accounts can signal over-leverage to lenders. Consolidating reduces complexity and risk perception.',
    });
  }

  if (score < 700 && score > 0) {
    actions.push({
      priority: 'medium',
      action: 'Set up auto-pay for all EMIs and credit card bills',
      reason: 'Consistent on-time payments are the fastest way to build score over 6–12 months.',
    });
  }

  if (actions.length < 3) {
    actions.push({
      priority: 'low',
      action: 'Monitor your credit report every 3–6 months',
      reason: 'Regular monitoring helps catch errors, fraudulent accounts, or unexpected changes early.',
    });
  }

  return actions;
}

// ─── Step Indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'details', label: 'Your Details' },
    { key: 'otp', label: 'Verify' },
    { key: 'processing', label: 'Processing' },
    { key: 'result', label: 'Your Report' },
  ];
  const currentIdx = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((step, i) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < currentIdx
                  ? 'bg-blue-600 text-white'
                  : i === currentIdx
                  ? 'bg-blue-600 text-white ring-4 ring-blue-600/25' :'bg-white/10 text-slate-500'
              }`}
            >
              {i < currentIdx ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span
              className={`text-xs mt-1.5 font-medium hidden sm:block ${
                i === currentIdx ? 'text-blue-400' : i < currentIdx ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-12 sm:w-20 h-0.5 mb-4 mx-1 transition-all ${
                i < currentIdx ? 'bg-blue-600' : 'bg-white/10'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Score Arc ──────────────────────────────────────────────────────────────────
function ScoreArc({ score, maxScore = 900 }: { score: number | null; maxScore?: number }) {
  const r = 70;
  const circumference = 2 * Math.PI * r;
  const pct = score !== null ? Math.min(score / maxScore, 1) : 0;
  const arcColor = getScoreArcColor(score);
  return (
    <div className="relative w-44 h-44 flex-shrink-0 mx-auto">
      <svg className="w-44 h-44 -rotate-90" viewBox="0 0 176 176">
        <circle cx="88" cy="88" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx="88" cy="88" r={r} fill="none"
          stroke={arcColor} strokeWidth="12"
          strokeDasharray={`${circumference * pct} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-bold text-4xl leading-none">{score ?? '—'}</span>
        <span className="text-slate-400 text-xs mt-1">out of {maxScore}</span>
      </div>
    </div>
  );
}

// ─── Report Section Wrapper ─────────────────────────────────────────────────────
function ReportSection({ icon, title, children, accent = 'blue' }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}) {
  const accentMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };
  const colors = accentMap[accent].split(' ');
  return (
    <div className="bg-[#0A1628] border border-white/8 rounded-2xl p-6 mb-5">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl ${colors[1]} border ${colors[2]} flex items-center justify-center flex-shrink-0`}>
          <span className={colors[0]}>{icon}</span>
        </div>
        <h3 className="text-white font-semibold text-base">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Accounts Table (Data Breakdown) ───────────────────────────────────────────
function AccountsSection({ accounts }: { accounts: Record<string, unknown>[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? accounts : accounts.slice(0, 3);

  if (!accounts.length) return null;

  return (
    <div className="mb-5">
      <div className="space-y-3">
        {visible.map((acc, i) => (
          <div key={i} className="bg-[#050A14] border border-white/6 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-white font-medium text-sm">{String(acc.lender ?? 'Unknown Lender')}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {String(acc.accountType ?? '')}
                  {acc.accountNumber ? ` · ${String(acc.accountNumber)}` : ''}
                </p>
              </div>
              <div className="text-right">
                {acc.currentBalance !== null && acc.currentBalance !== undefined && (
                  <p className="text-white text-sm font-semibold">{formatCurrency(acc.currentBalance)}</p>
                )}
                {Boolean(acc.status) && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                    String(acc.status).toLowerCase().includes('active')
                      ? 'bg-green-500/15 text-green-400' : String(acc.status).toLowerCase().includes('close')
                      ? 'bg-slate-500/15 text-slate-400' :'bg-amber-500/15 text-amber-400'
                  }`}>
                    {String(acc.status)}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {acc.sanctionedAmount !== null && acc.sanctionedAmount !== undefined && (
                <div>
                  <p className="text-slate-500 text-xs">Sanctioned</p>
                  <p className="text-slate-300 text-xs font-medium">{formatCurrency(acc.sanctionedAmount)}</p>
                </div>
              )}
              {acc.overdueAmount !== null && acc.overdueAmount !== undefined && (
                <div>
                  <p className="text-slate-500 text-xs">Overdue</p>
                  <p className={`text-xs font-medium ${Number(acc.overdueAmount) > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                    {formatCurrency(acc.overdueAmount)}
                  </p>
                </div>
              )}
              {acc.emiAmount !== null && acc.emiAmount !== undefined && (
                <div>
                  <p className="text-slate-500 text-xs">EMI</p>
                  <p className="text-slate-300 text-xs font-medium">{formatCurrency(acc.emiAmount)}</p>
                </div>
              )}
              {Boolean(acc.openDate) && (
                <div>
                  <p className="text-slate-500 text-xs">Opened</p>
                  <p className="text-slate-300 text-xs font-medium">{String(acc.openDate)}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {accounts.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 text-sm py-2 transition-colors"
        >
          {expanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show {accounts.length - 3} more accounts</>}
        </button>
      )}
    </div>
  );
}

// ─── Enquiries List (Data Breakdown) ───────────────────────────────────────────
function EnquiriesList({ enquiries }: { enquiries: Record<string, unknown>[] }) {
  if (!enquiries.length) return null;
  return (
    <div className="mb-5">
      <div className="space-y-2">
        {enquiries.map((enq, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
            <div>
              <p className="text-white text-sm font-medium">{String(enq.lender ?? 'Unknown')}</p>
              {Boolean(enq.enquiryType) && (
                <p className="text-slate-500 text-xs mt-0.5">{String(enq.enquiryType)}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {Boolean(enq.enquiryDate) && (
                <p className="text-slate-400 text-xs">{String(enq.enquiryDate)}</p>
              )}
              {enq.amount !== null && enq.amount !== undefined && (
                <p className="text-slate-300 text-xs font-medium mt-0.5">{formatCurrency(enq.amount)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Raw Metrics Grid (Data Breakdown) ─────────────────────────────────────────
function RawMetricsGrid({ insights }: { insights: Record<string, unknown> }) {
  const entries = Object.entries(insights).filter(([, v]) => v !== null && v !== undefined);
  if (!entries.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {entries.map(([key, value]) => {
        const isCurrency = ['totalOutstanding', 'totalCreditLimit'].includes(key);
        const displayVal = isCurrency ? formatCurrency(value) : String(value);
        return (
          <div key={key} className="bg-[#050A14] border border-white/6 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">{formatLabel(key)}</p>
            <p className="text-white font-semibold text-sm">{displayVal}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function GetAnalysisPage() {
  const [step, setStep] = useState<Step>('details');
  const [details, setDetails] = useState<UserDetails>({
    fullName: '', pan: '', dob: '', phone: '', email: '', state: '',
  });
  const [formId, setFormId] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState<Partial<UserDetails>>({});
  const [otpError, setOtpError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreditResult | null>(null);

  // Processing animation state
  const [processingStep, setProcessingStep] = useState(0);
  const [processingDone, setProcessingDone] = useState<boolean[]>([]);
  const processingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Processing animation ──
  useEffect(() => {
    if (step !== 'processing') return;
    setProcessingStep(0);
    setProcessingDone([]);

    let idx = 0;
    const advance = () => {
      if (idx >= PROCESSING_STEPS.length) return;
      setProcessingStep(idx);
      const delay = PROCESSING_STEPS[idx].duration;
      processingRef.current = setTimeout(() => {
        setProcessingDone((prev) => {
          const next = [...prev];
          next[idx] = true;
          return next;
        });
        idx++;
        advance();
      }, delay);
    };
    advance();

    return () => {
      if (processingRef.current) clearTimeout(processingRef.current);
    };
  }, [step]);

  // ── Form handlers ──
  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: name === 'pan' ? value.toUpperCase() : value }));
    if (errors[name as keyof UserDetails]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateDetails = () => {
    const newErrors: Partial<UserDetails> = {};
    if (!details.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!details.pan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(details.pan))
      newErrors.pan = 'Enter a valid PAN (e.g. ABCDE1234F)';
    if (!details.dob) newErrors.dob = 'Date of birth is required';
    if (!details.phone.trim() || !/^[6-9]\d{9}$/.test(details.phone))
      newErrors.phone = 'Enter a valid 10-digit mobile number';
    if (!details.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email))
      newErrors.email = 'Enter a valid email address';
    if (!details.state) newErrors.state = 'Please select your state';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) return;

    setLoading(true);
    setApiError('');

    try {
      const res = await fetch('/api/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: details.fullName,
          pan: details.pan,
          dob: details.dob,
          phone: details.phone,
          email: details.email,
          state: details.state,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.formId) {
        setApiError(data.error ?? 'Failed to create profile. Please try again.');
        return;
      }

      setFormId(data.formId);
      setStep('otp');
    } catch {
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP handlers ──
  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) {
      const next = document.getElementById(`otp-${idx + 1}`);
      if (next) (next as HTMLInputElement).focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const prev = document.getElementById(`otp-${idx - 1}`);
      if (prev) (prev as HTMLInputElement).focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otp.join('');
    if (entered.length < 6) {
      setOtpError('Please enter the complete 6-digit OTP.');
      return;
    }
    setOtpError('');
    setStep('processing');
    await fetchCreditData();
  };

  // ── Fetch credit data ──
  const fetchCreditData = async () => {
    if (!formId) {
      setApiError('Session expired. Please start over.');
      setStep('details');
      return;
    }

    try {
      const res = await fetch('/api/fetch-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          type: 'applicant',
          state: details.state,
        }),
      });

      const data = await res.json();

      // Minimum 3s processing feel regardless of API speed
      await new Promise((resolve) => setTimeout(resolve, 3000));

      if (!res.ok) {
        setApiError(data.error ?? 'Failed to fetch credit data. Please try again.');
        setStep('otp');
        return;
      }

      setResult(data as CreditResult);
      setStep('result');
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setApiError('Network error while fetching credit data. Please try again.');
      setStep('otp');
    }
  };

  const handleReset = () => {
    setStep('details');
    setDetails({ fullName: '', pan: '', dob: '', phone: '', email: '', state: '' });
    setOtp(['', '', '', '', '', '']);
    setFormId(null);
    setResult(null);
    setApiError('');
    setOtpError('');
  };

  const grade = result ? getScoreGrade(result.score) : getScoreGrade(null);

  return (
    <div className="bg-[#050A14] min-h-screen">
      <PublicNav />

      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-3xl" />
        </div>

        <div className={`relative mx-auto px-6 lg:px-8 ${step === 'result' ? 'max-w-3xl' : 'max-w-2xl'}`}>
          {/* Header — hidden on result */}
          {step !== 'result' && (
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
                <Lock size={12} className="text-blue-400" />
                <span className="text-blue-400 text-xs font-medium">Secure & Encrypted</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">Get Your Credit Analysis</h1>
              <p className="text-slate-400">
                Enter your details to receive a comprehensive credit intelligence report.
              </p>
            </div>
          )}

          {step !== 'result' && <StepIndicator current={step} />}

          {/* ── STEP 1: Details ── */}
          {step === 'details' && (
            <div className="bg-[#0A1628] border border-white/8 rounded-2xl p-8">
              {apiError && (
                <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{apiError}</p>
                </div>
              )}
              <form onSubmit={handleDetailsSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Full Name *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      name="fullName"
                      value={details.fullName}
                      onChange={handleDetailChange}
                      placeholder="As per PAN card"
                      className={`w-full bg-[#050A14] border rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${errors.fullName ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/25' : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/25'}`}
                    />
                  </div>
                  {errors.fullName && <p className="text-red-400 text-xs mt-1.5">{errors.fullName}</p>}
                </div>

                {/* PAN */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">PAN Number *</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      name="pan"
                      value={details.pan}
                      onChange={handleDetailChange}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className={`w-full bg-[#050A14] border rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all font-mono tracking-widest ${errors.pan ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/25' : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/25'}`}
                    />
                  </div>
                  {errors.pan && <p className="text-red-400 text-xs mt-1.5">{errors.pan}</p>}
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Date of Birth *</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="date"
                      name="dob"
                      value={details.dob}
                      onChange={handleDetailChange}
                      className={`w-full bg-[#050A14] border rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-1 transition-all ${errors.dob ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/25' : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/25'}`}
                    />
                  </div>
                  {errors.dob && <p className="text-red-400 text-xs mt-1.5">{errors.dob}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Mobile Number *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      name="phone"
                      value={details.phone}
                      onChange={handleDetailChange}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className={`w-full bg-[#050A14] border rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${errors.phone ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/25' : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/25'}`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-400 text-xs mt-1.5">{errors.phone}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Email Address *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                    <input
                      type="email"
                      name="email"
                      value={details.email}
                      onChange={handleDetailChange}
                      placeholder="you@example.com"
                      className={`w-full bg-[#050A14] border rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${errors.email ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/25' : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/25'}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
                </div>

                {/* State */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">State *</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select
                      name="state"
                      value={details.state}
                      onChange={handleDetailChange}
                      className={`w-full bg-[#050A14] border rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-1 transition-all appearance-none ${errors.state ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/25' : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/25'}`}
                    >
                      <option value="" className="bg-[#0A1628]">Select your state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s} className="bg-[#0A1628]">{s}</option>
                      ))}
                    </select>
                  </div>
                  {errors.state && <p className="text-red-400 text-xs mt-1.5">{errors.state}</p>}
                </div>

                {/* Security note */}
                <div className="flex items-start gap-3 bg-blue-600/8 border border-blue-500/15 rounded-xl p-4">
                  <Shield size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Your data is encrypted with 256-bit SSL and used solely for generating your credit analysis. We never share your information with third parties.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/25 group"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Creating profile…
                    </>
                  ) : (
                    <>
                      Continue to Verification
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <div className="bg-[#0A1628] border border-white/8 rounded-2xl p-8">
              {apiError && (
                <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{apiError}</p>
                </div>
              )}
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <Phone size={24} className="text-blue-400" />
                </div>
                <h2 className="text-white font-bold text-2xl mb-2">Verify Your Identity</h2>
                <p className="text-slate-400 text-sm">
                  We've sent a 6-digit OTP to{' '}
                  <span className="text-white font-medium">+91 {details.phone.slice(0, 5)}XXXXX</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit}>
                <div className="flex justify-center gap-3 mb-6">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      className="w-12 h-14 text-center text-white text-xl font-bold bg-[#050A14] border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all"
                    />
                  ))}
                </div>
                {otpError && <p className="text-red-400 text-sm text-center mb-4">{otpError}</p>}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/25 group"
                >
                  Verify & Get Report
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('details'); setApiError(''); }}
                  className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm mt-3 py-2 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to Details
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 3: Processing ── */}
          {step === 'processing' && (
            <div className="bg-[#0A1628] border border-white/8 rounded-2xl p-10 text-center">
              {/* Animated orb */}
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-blue-600/10 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-2 rounded-full border-4 border-blue-600/20" />
                <div className="absolute inset-2 rounded-full border-4 border-t-blue-500 border-r-blue-400 animate-spin" style={{ animationDuration: '1.2s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BarChart3 size={24} className="text-blue-400" />
                </div>
              </div>

              <h2 className="text-white font-bold text-2xl mb-2">Processing Your Request</h2>
              <p className="text-slate-400 text-sm mb-10">
                Our intelligent system is running a full analysis on your credit profile.
              </p>

              {/* 4-step sequential progress */}
              <div className="space-y-0 text-left max-w-sm mx-auto">
                {PROCESSING_STEPS.map((s, i) => {
                  const isDone = processingDone[i];
                  const isActive = processingStep === i && !isDone;
                  const isPending = i > processingStep && !processingDone[i];

                  return (
                    <div key={s.label} className="relative">
                      {i < PROCESSING_STEPS.length - 1 && (
                        <div
                          className={`absolute left-[19px] top-[40px] w-0.5 h-8 transition-all duration-500 ${
                            processingDone[i] ? 'bg-green-500/60' : 'bg-white/8'
                          }`}
                        />
                      )}

                      <div
                        className={`flex items-center gap-4 py-3 transition-all duration-500 ${
                          isPending ? 'opacity-35' : 'opacity-100'
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                            isDone
                              ? 'bg-green-500/15 border-green-500/50'
                              : isActive
                              ? 'bg-blue-600/15 border-blue-500/60' :'bg-white/4 border-white/10'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle size={16} className="text-green-400" />
                          ) : isActive ? (
                            <div className="w-4 h-4 rounded-full border-2 border-t-blue-400 border-blue-400/20 animate-spin" />
                          ) : (
                            <span className="text-slate-600 text-xs font-bold">{i + 1}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium transition-colors duration-300 ${
                                isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-slate-500'
                              }`}
                            >
                              Step {i + 1}: {s.label}
                            </span>
                            {isActive && (
                              <span className="flex gap-0.5">
                                {[0, 1, 2].map((dot) => (
                                  <span
                                    key={dot}
                                    className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"
                                    style={{ animationDelay: `${dot * 150}ms` }}
                                  />
                                ))}
                              </span>
                            )}
                            {isDone && (
                              <span className="text-xs text-green-500/70 font-medium">Done</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-xs">
                <Lock size={11} className="text-slate-600" />
                <span>Secured with 256-bit encryption</span>
              </div>
            </div>
          )}

          {/* ── STEP 4: Result — Intelligence Report ── */}
          {step === 'result' && result && (() => {
            const profileSummary = buildProfileSummary(result);
            const keySignals = buildKeySignals(result);
            const behaviorAnalysis = buildBehaviorAnalysis(result);
            const riskIndicators = buildRiskIndicators(result);
            const strengths = buildStrengths(result);
            const recommendedActions = buildRecommendedActions(result);

            return (
              <div>
                {/* ── 1. REPORT HEADER ── */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-5">
                    <FileText size={12} className="text-blue-400" />
                    <span className="text-blue-400 text-xs font-medium tracking-wide uppercase">Credit Intelligence Report</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Credit Intelligence Report</h1>
                  <p className="text-slate-400 text-sm">Generated from your financial data</p>
                  {Boolean(result.summary?.reportDate) && (
                    <p className="text-slate-600 text-xs mt-1">Report Date: {String(result.summary.reportDate)}</p>
                  )}
                </div>

                {/* Score Hero */}
                <div className="bg-[#0A1628] border border-white/10 rounded-2xl p-8 mb-5">
                  <div className="flex flex-col items-center gap-6">
                    <ScoreArc score={result.score} />
                    <div className="text-center">
                      <div className={`inline-flex items-center gap-2 border rounded-full px-5 py-2 mb-3 ${grade.bg} ${grade.border}`}>
                        <span className={`text-base font-bold ${grade.color}`}>{grade.label} Credit Profile</span>
                      </div>
                      {Boolean(result.summary?.name) && (
                        <p className="text-slate-300 text-sm">{String(result.summary.name)}</p>
                      )}
                      <div className="flex flex-wrap justify-center gap-2 mt-3">
                        {Boolean(result.summary?.pan) && (
                          <span className="text-xs text-slate-500 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5">
                            PAN: {String(result.summary.pan)}
                          </span>
                        )}
                        {Boolean(result.summary?.reportId) && (
                          <span className="text-xs text-slate-500 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5">
                            Ref: {String(result.summary.reportId)}
                          </span>
                        )}
                      </div>
                      {result.reportUrl && (
                        <a
                          href={result.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-4 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                        >
                          <ExternalLink size={13} />
                          Download Full PDF Report
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── 2. PROFILE SUMMARY ── */}
                <ReportSection icon={<User size={16} />} title="Profile Summary" accent="blue">
                  <p className="text-slate-300 text-sm leading-relaxed">{profileSummary}</p>
                </ReportSection>

                {/* ── 3. KEY SIGNALS ── */}
                {keySignals.length > 0 && (
                  <ReportSection icon={<Activity size={16} />} title="Key Signals" accent="purple">
                    <div className="space-y-2.5">
                      {keySignals.map((signal, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className={`flex-shrink-0 mt-0.5 text-base leading-none ${
                            signal.type === 'positive' ? 'text-green-400' :
                            signal.type === 'warning' ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {signal.type === 'positive' ? '✔' : signal.type === 'warning' ? '⚠' : '✖'}
                          </span>
                          <span className={`text-sm ${
                            signal.type === 'positive' ? 'text-slate-200' :
                            signal.type === 'warning' ? 'text-slate-300' : 'text-slate-300'
                          }`}>
                            {signal.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ReportSection>
                )}

                {/* ── 4. BEHAVIOR ANALYSIS ── */}
                {behaviorAnalysis.length > 0 && (
                  <ReportSection icon={<TrendingUp size={16} />} title="Behavior Analysis" accent="blue">
                    <div className="space-y-5">
                      {behaviorAnalysis.map((item, i) => (
                        <div key={i}>
                          <p className="text-white text-sm font-semibold mb-1.5">{item.title}</p>
                          <p className="text-slate-400 text-sm leading-relaxed">{item.text}</p>
                          {i < behaviorAnalysis.length - 1 && <div className="mt-5 border-t border-white/5" />}
                        </div>
                      ))}
                    </div>
                  </ReportSection>
                )}

                {/* ── 5. RISK INDICATORS ── */}
                {riskIndicators.length > 0 && (
                  <ReportSection icon={<AlertCircle size={16} />} title="Risk Indicators" accent="red">
                    <div className="space-y-2.5">
                      {riskIndicators.map((risk, i) => (
                        <div key={i} className="flex items-start gap-3 bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
                          <TrendingDown size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-slate-300 text-sm">{risk}</p>
                        </div>
                      ))}
                    </div>
                  </ReportSection>
                )}

                {/* ── 6. OPPORTUNITIES / STRENGTHS ── */}
                {strengths.length > 0 && (
                  <ReportSection icon={<Star size={16} />} title="Opportunities & Strengths" accent="green">
                    <div className="space-y-2.5">
                      {strengths.map((strength, i) => (
                        <div key={i} className="flex items-start gap-3 bg-green-500/5 border border-green-500/10 rounded-xl px-4 py-3">
                          <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                          <p className="text-slate-300 text-sm">{strength}</p>
                        </div>
                      ))}
                    </div>
                  </ReportSection>
                )}

                {/* ── 7. RECOMMENDED ACTIONS ── */}
                {recommendedActions.length > 0 && (
                  <ReportSection icon={<Target size={16} />} title="Recommended Actions" accent="amber">
                    <div className="space-y-4">
                      {recommendedActions.map((item, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                            item.priority === 'high' ?'bg-red-500/20 text-red-400 border border-red-500/30'
                              : item.priority === 'medium' ?'bg-amber-500/20 text-amber-400 border border-amber-500/30' :'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white text-sm font-semibold">{item.action}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                item.priority === 'high' ?'bg-red-500/15 text-red-400'
                                  : item.priority === 'medium' ?'bg-amber-500/15 text-amber-400' :'bg-blue-500/15 text-blue-400'
                              }`}>
                                {item.priority === 'high' ? 'High Priority' : item.priority === 'medium' ? 'Medium' : 'Ongoing'}
                              </span>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed">{item.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ReportSection>
                )}

                {/* ── 8. DATA BREAKDOWN ── */}
                <div className="mt-8 mb-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-px flex-1 bg-white/8" />
                    <span className="text-slate-500 text-xs font-medium tracking-widest uppercase px-3">Data Breakdown</span>
                    <div className="h-px flex-1 bg-white/8" />
                  </div>
                  <p className="text-slate-600 text-xs text-center mb-6">Raw data from your credit report — for reference only</p>
                </div>

                {/* Accounts */}
                {result.accounts.length > 0 && (
                  <div className="bg-[#0A1628] border border-white/8 rounded-2xl p-6 mb-5">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard size={16} className="text-slate-400" />
                      <h4 className="text-slate-300 font-medium text-sm">Credit Accounts</h4>
                      <span className="text-xs text-slate-600 ml-1">({result.accounts.length})</span>
                    </div>
                    <AccountsSection accounts={result.accounts} />
                  </div>
                )}

                {/* Enquiries */}
                {result.enquiries.length > 0 && (
                  <div className="bg-[#0A1628] border border-white/8 rounded-2xl p-6 mb-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity size={16} className="text-slate-400" />
                      <h4 className="text-slate-300 font-medium text-sm">Enquiry History</h4>
                      <span className="text-xs text-slate-600 ml-1">({result.enquiries.length})</span>
                    </div>
                    <EnquiriesList enquiries={result.enquiries} />
                  </div>
                )}

                {/* Raw Metrics */}
                {Object.keys(result.insights).length > 0 && (
                  <div className="bg-[#0A1628] border border-white/8 rounded-2xl p-6 mb-5">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 size={16} className="text-slate-400" />
                      <h4 className="text-slate-300 font-medium text-sm">Raw Metrics</h4>
                    </div>
                    <RawMetricsGrid insights={result.insights} />
                  </div>
                )}

                {/* CTA */}
                <div className="bg-gradient-to-r from-blue-600/15 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-6 text-center mt-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <Zap size={18} className="text-blue-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Want expert guidance?</h3>
                  <p className="text-slate-400 text-sm mb-5">
                    Our partner network can help you act on these insights and improve your credit health.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href="mailto:support@credittrust.in"
                      className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/25 group"
                    >
                      Talk to an Expert
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center justify-center gap-2 border border-white/15 hover:border-white/30 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:bg-white/5"
                    >
                      <RefreshCw size={15} />
                      New Analysis
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
