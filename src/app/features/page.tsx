'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNav from '../home/components/PublicNav';
import PublicFooter from '../home/components/PublicFooter';
import { ArrowRight } from 'lucide-react';

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Visual 1: Full Profile Analysis ──
// Layered account cards with type labels and status tags
function FullProfileVisual() {
  const accounts = [
    { type: 'Home Loan', lender: 'HDFC Bank', status: 'ACTIVE', statusColor: '#16A34A', statusBg: '#DCFCE7', bar: 0.72 },
    { type: 'Personal Loan', lender: 'Bajaj Finance', status: 'CLOSED', statusColor: '#64748B', statusBg: '#F1F5F9', bar: 1.0 },
    { type: 'Credit Card', lender: 'ICICI Bank', status: 'ACTIVE', statusColor: '#16A34A', statusBg: '#DCFCE7', bar: 0.44 },
    { type: 'Auto Loan', lender: 'Kotak Mahindra', status: 'OVERDUE', statusColor: '#DC2626', statusBg: '#FEE2E2', bar: 0.61 },
  ];
  return (
    <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background */}
      <rect width={480} height={340} fill="#F8FAFC" rx={16} />
      {/* Header row */}
      <rect x={24} y={20} width={432} height={36} rx={8} fill="white" stroke="#E2E8F0" strokeWidth={1} />
      <text x={40} y={43} fill="#94A3B8" fontSize={8} fontFamily="system-ui" letterSpacing={2} fontWeight="700">ACCOUNT OVERVIEW</text>
      <rect x={360} y={28} width={80} height={20} rx={4} fill="#EFF6FF" />
      <text x={400} y={41} fill="#2563EB" fontSize={8} fontFamily="system-ui" textAnchor="middle" fontWeight="700">4 ACCOUNTS</text>

      {/* Account rows */}
      {accounts.map((acc, i) => {
        const y = 72 + i * 62;
        return (
          <g key={i}>
            <rect x={24} y={y} width={432} height={50} rx={8} fill="white" stroke="#E2E8F0" strokeWidth={1} />
            {/* Left dot */}
            <circle cx={44} cy={y + 25} r={5} fill={acc.status === 'ACTIVE' ? '#2563EB' : acc.status === 'OVERDUE' ? '#EF4444' : '#CBD5E1'} />
            {/* Account type */}
            <text x={58} y={y + 18} fill="#1E293B" fontSize={9.5} fontFamily="system-ui" fontWeight="700">{acc.type}</text>
            <text x={58} y={y + 32} fill="#94A3B8" fontSize={8} fontFamily="system-ui">{acc.lender}</text>
            {/* Status badge */}
            <rect x={380} y={y + 14} width={60} height={16} rx={4} fill={acc.statusBg} />
            <text x={410} y={y + 25} fill={acc.statusColor} fontSize={7.5} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{acc.status}</text>
            {/* Progress bar */}
            <rect x={58} y={y + 38} width={200} height={3} rx={1.5} fill="#F1F5F9" />
            <rect x={58} y={y + 38} width={200 * acc.bar} height={3} rx={1.5} fill={acc.status === 'OVERDUE' ? '#FCA5A5' : acc.status === 'CLOSED' ? '#CBD5E1' : '#93C5FD'} />
          </g>
        );
      })}
    </svg>
  );
}

// ── Visual 2: Payment Behavior Engine ──
// Month-by-month DPD calendar heatmap
function PaymentBehaviorVisual() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // 0=on-time, 1=late-30, 2=late-60, 3=missed
  const dpd = [0,0,0,1,0,0,2,0,0,0,1,0,  0,0,0,0,0,1,0,0,0,0,0,0,  0,0,1,0,0,0,0,0,3,0,0,0];
  const colors = ['#DBEAFE', '#FDE68A', '#FDBA74', '#FCA5A5'];
  const labels = ['On Time', '30 DPD', '60 DPD', 'Missed'];
  const labelColors = ['#2563EB', '#D97706', '#EA580C', '#DC2626'];

  return (
    <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={340} fill="#F8FAFC" rx={16} />
      {/* Title */}
      <text x={24} y={36} fill="#94A3B8" fontSize={8} fontFamily="system-ui" letterSpacing={2} fontWeight="700">PAYMENT HISTORY — 36 MONTHS</text>

      {/* Month labels */}
      {months.map((m, i) => (
        <text key={i} x={36 + i * 34} y={58} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui" textAnchor="middle">{m}</text>
      ))}

      {/* 3 rows × 12 months */}
      {[0, 1, 2].map(row => (
        <g key={row}>
          <text x={14} y={82 + row * 44} fill="#CBD5E1" fontSize={7} fontFamily="system-ui" textAnchor="middle">{2024 - row}</text>
          {months.map((_, col) => {
            const idx = row * 12 + col;
            const val = dpd[idx] ?? 0;
            return (
              <rect
                key={col}
                x={20 + col * 34}
                y={66 + row * 44}
                width={26}
                height={26}
                rx={5}
                fill={colors[val]}
                stroke="white"
                strokeWidth={2}
              />
            );
          })}
        </g>
      ))}

      {/* Legend */}
      {labels.map((l, i) => (
        <g key={i}>
          <rect x={24 + i * 110} y={210} width={12} height={12} rx={3} fill={colors[i]} />
          <text x={40 + i * 110} y={221} fill={labelColors[i]} fontSize={8} fontFamily="system-ui" fontWeight="600">{l}</text>
        </g>
      ))}

      {/* Trend line below */}
      <text x={24} y={252} fill="#94A3B8" fontSize={8} fontFamily="system-ui" letterSpacing={2} fontWeight="700">CONSISTENCY TREND</text>
      <rect x={24} y={260} width={432} height={1} fill="#E2E8F0" />
      <polyline
        points="24,295 60,288 96,290 132,278 168,285 204,270 240,275 276,265 312,272 348,260 384,263 420,255 456,258"
        stroke="#2563EB" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <polyline
        points="24,295 60,288 96,290 132,278 168,285 204,270 240,275 276,265 312,272 348,260 384,263 420,255 456,258"
        stroke="#BFDBFE" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.3}
      />
    </svg>
  );
}

// ── Visual 3: Risk Signal Detection ──
// Annotated anomaly feed with severity levels
function RiskSignalVisual() {
  const signals = [
    { label: 'Write-off detected', sub: 'Bajaj Finance — 2023', sev: 'HIGH', sevColor: '#DC2626', sevBg: '#FEE2E2', dot: '#EF4444' },
    { label: 'Enquiry spike', sub: '7 enquiries in 45 days', sev: 'MEDIUM', sevColor: '#D97706', sevBg: '#FEF3C7', dot: '#F59E0B' },
    { label: 'Settlement flag', sub: 'ICICI — partial settlement', sev: 'HIGH', sevColor: '#DC2626', sevBg: '#FEE2E2', dot: '#EF4444' },
    { label: 'DPD pattern', sub: '60+ DPD on 2 accounts', sev: 'MEDIUM', sevColor: '#D97706', sevBg: '#FEF3C7', dot: '#F59E0B' },
    { label: 'Account age drop', sub: 'Oldest account closed', sev: 'LOW', sevColor: '#2563EB', sevBg: '#EFF6FF', dot: '#93C5FD' },
  ];
  return (
    <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={340} fill="#F8FAFC" rx={16} />
      {/* Header */}
      <rect x={24} y={18} width={432} height={36} rx={8} fill="white" stroke="#E2E8F0" strokeWidth={1} />
      <text x={40} y={41} fill="#94A3B8" fontSize={8} fontFamily="system-ui" letterSpacing={2} fontWeight="700">RISK SIGNAL FEED</text>
      <rect x={370} y={26} width={70} height={20} rx={4} fill="#FEE2E2" />
      <text x={405} y={39} fill="#DC2626" fontSize={8} fontFamily="system-ui" textAnchor="middle" fontWeight="700">3 CRITICAL</text>

      {/* Signal rows */}
      {signals.map((s, i) => {
        const y = 70 + i * 50;
        return (
          <g key={i}>
            <rect x={24} y={y} width={432} height={40} rx={7} fill="white" stroke="#F1F5F9" strokeWidth={1} />
            {/* Pulse dot */}
            <circle cx={44} cy={y + 20} r={6} fill={s.dot} opacity={0.15} />
            <circle cx={44} cy={y + 20} r={3.5} fill={s.dot} />
            {/* Text */}
            <text x={60} y={y + 15} fill="#1E293B" fontSize={9.5} fontFamily="system-ui" fontWeight="700">{s.label}</text>
            <text x={60} y={y + 29} fill="#94A3B8" fontSize={8} fontFamily="system-ui">{s.sub}</text>
            {/* Severity */}
            <rect x={390} y={y + 11} width={56} height={18} rx={4} fill={s.sevBg} />
            <text x={418} y={y + 23} fill={s.sevColor} fontSize={7.5} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{s.sev}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Visual 4: Credit Utilization Intelligence ──
// Gauge-free utilization breakdown with over-leverage detection
function UtilizationVisual() {
  const accounts = [
    { name: 'ICICI Platinum', limit: 100, used: 78, pct: 0.78, risk: true },
    { name: 'HDFC Millennia', limit: 100, used: 42, pct: 0.42, risk: false },
    { name: 'Axis Ace', limit: 100, used: 91, pct: 0.91, risk: true },
    { name: 'SBI SimplySave', limit: 100, used: 29, pct: 0.29, risk: false },
  ];
  return (
    <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={340} fill="#F8FAFC" rx={16} />
      {/* Title */}
      <text x={24} y={36} fill="#94A3B8" fontSize={8} fontFamily="system-ui" letterSpacing={2} fontWeight="700">CREDIT UTILIZATION BREAKDOWN</text>

      {/* Overall utilization bar */}
      <rect x={24} y={48} width={432} height={36} rx={8} fill="white" stroke="#E2E8F0" strokeWidth={1} />
      <text x={40} y={63} fill="#475569" fontSize={8.5} fontFamily="system-ui" fontWeight="600">Overall Utilization</text>
      <rect x={40} y={68} width={340} height={6} rx={3} fill="#F1F5F9" />
      <rect x={40} y={68} width={340 * 0.60} height={6} rx={3} fill="#F59E0B" />
      <text x={390} y={75} fill="#D97706" fontSize={8} fontFamily="system-ui" fontWeight="700">60%</text>
      <rect x={410} y={58} width={36} height={16} rx={4} fill="#FEF3C7" />
      <text x={428} y={69} fill="#D97706" fontSize={7.5} fontFamily="system-ui" textAnchor="middle" fontWeight="700">HIGH</text>

      {/* Threshold line label */}
      <line x1={40 + 340 * 0.30} y1={100} x2={40 + 340 * 0.30} y2={310} stroke="#E2E8F0" strokeWidth={1} strokeDasharray="4 3" />
      <text x={40 + 340 * 0.30 + 4} y={112} fill="#94A3B8" fontSize={7} fontFamily="system-ui">30% safe zone</text>

      {/* Per-card rows */}
      {accounts.map((acc, i) => {
        const y = 118 + i * 48;
        const barW = 260 * acc.pct;
        const barColor = acc.risk ? '#FCA5A5' : '#93C5FD';
        const textColor = acc.risk ? '#DC2626' : '#2563EB';
        const bg = acc.risk ? '#FEF2F2' : '#EFF6FF';
        return (
          <g key={i}>
            <rect x={24} y={y} width={432} height={38} rx={7} fill="white" stroke="#F1F5F9" strokeWidth={1} />
            <text x={40} y={y + 15} fill="#334155" fontSize={8.5} fontFamily="system-ui" fontWeight="600">{acc.name}</text>
            <rect x={40} y={y + 20} width={260} height={6} rx={3} fill="#F1F5F9" />
            <rect x={40} y={y + 20} width={barW} height={6} rx={3} fill={barColor} />
            <rect x={310} y={y + 11} width={50} height={16} rx={4} fill={bg} />
            <text x={335} y={y + 22} fill={textColor} fontSize={8} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{Math.round(acc.pct * 100)}%</text>
            {acc.risk && (
              <>
                <circle cx={374} cy={y + 19} r={5} fill="#FEE2E2" />
                <text x={374} y={y + 23} fill="#DC2626" fontSize={8} fontFamily="system-ui" textAnchor="middle" fontWeight="700">!</text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Visual 5: Actionable Improvement Plan ──
// Prioritized step cards with impact labels
function ImprovementPlanVisual() {
  const steps = [
    { priority: '01', action: 'Reduce credit card utilization below 30%', impact: 'HIGH IMPACT', impactColor: '#16A34A', impactBg: '#DCFCE7', timeline: '30 days' },
    { priority: '02', action: 'Avoid new loan enquiries for 90 days', impact: 'MEDIUM', impactColor: '#D97706', impactBg: '#FEF3C7', timeline: '90 days' },
    { priority: '03', action: 'Clear overdue EMI on Kotak Auto Loan', impact: 'HIGH IMPACT', impactColor: '#16A34A', impactBg: '#DCFCE7', timeline: '15 days' },
    { priority: '04', action: 'Keep oldest credit card active', impact: 'LOW', impactColor: '#2563EB', impactBg: '#EFF6FF', timeline: 'Ongoing' },
  ];
  return (
    <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={340} fill="#F8FAFC" rx={16} />
      {/* Header */}
      <rect x={24} y={18} width={432} height={36} rx={8} fill="white" stroke="#E2E8F0" strokeWidth={1} />
      <text x={40} y={41} fill="#94A3B8" fontSize={8} fontFamily="system-ui" letterSpacing={2} fontWeight="700">IMPROVEMENT ROADMAP</text>
      <rect x={362} y={26} width={84} height={20} rx={4} fill="#DCFCE7" />
      <text x={404} y={39} fill="#16A34A" fontSize={8} fontFamily="system-ui" textAnchor="middle" fontWeight="700">4 ACTIONS</text>

      {/* Connector line */}
      <line x1={44} y1={70} x2={44} y2={310} stroke="#E2E8F0" strokeWidth={1.5} strokeDasharray="4 4" />

      {steps.map((s, i) => {
        const y = 68 + i * 60;
        return (
          <g key={i}>
            {/* Priority circle */}
            <circle cx={44} cy={y + 20} r={12} fill="white" stroke="#E2E8F0" strokeWidth={1.5} />
            <text x={44} y={y + 24} fill="#2563EB" fontSize={8} fontFamily="system-ui" textAnchor="middle" fontWeight="800">{s.priority}</text>
            {/* Card */}
            <rect x={66} y={y} width={390} height={40} rx={8} fill="white" stroke="#F1F5F9" strokeWidth={1} />
            <text x={82} y={y + 16} fill="#1E293B" fontSize={9} fontFamily="system-ui" fontWeight="700">{s.action}</text>
            {/* Impact badge */}
            <rect x={82} y={y + 22} width={70} height={13} rx={3} fill={s.impactBg} />
            <text x={117} y={y + 32} fill={s.impactColor} fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{s.impact}</text>
            {/* Timeline */}
            <text x={420} y={y + 32} fill="#94A3B8" fontSize={8} fontFamily="system-ui" textAnchor="middle">{s.timeline}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Visual 6: Partner Reporting Suite ──
// Professional client report card with partner branding
function PartnerReportVisual() {
  const clients = [
    { name: 'Rajesh Kumar', type: 'Home Loan', status: 'APPROVED', statusColor: '#16A34A', statusBg: '#DCFCE7' },
    { name: 'Priya Sharma', type: 'Personal Loan', status: 'REVIEW', statusColor: '#D97706', statusBg: '#FEF3C7' },
    { name: 'Amit Verma', type: 'Business Loan', status: 'APPROVED', statusColor: '#16A34A', statusBg: '#DCFCE7' },
    { name: 'Sunita Patel', type: 'Credit Card', status: 'DECLINED', statusColor: '#DC2626', statusBg: '#FEE2E2' },
  ];
  return (
    <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={340} fill="#F8FAFC" rx={16} />
      {/* Partner dashboard header */}
      <rect x={24} y={16} width={432} height={44} rx={8} fill="#1E3A5F" />
      <circle cx={48} cy={38} r={10} fill="#2563EB" opacity={0.6} />
      <text x={64} y={34} fill="white" fontSize={9} fontFamily="system-ui" fontWeight="700">Partner Dashboard</text>
      <text x={64} y={47} fill="#93C5FD" fontSize={7.5} fontFamily="system-ui">DSA Pro — Active</text>
      <rect x={370} y={26} width={70} height={20} rx={4} fill="#2563EB" opacity={0.3} />
      <text x={405} y={39} fill="white" fontSize={8} fontFamily="system-ui" textAnchor="middle" fontWeight="700">LIVE</text>

      {/* Stats row */}
      {[
        { label: 'Reports Generated', val: '142' },
        { label: 'Approved', val: '89' },
        { label: 'Pending', val: '31' },
      ].map((stat, i) => (
        <g key={i}>
          <rect x={24 + i * 148} y={72} width={136} height={40} rx={7} fill="white" stroke="#E2E8F0" strokeWidth={1} />
          <text x={92 + i * 148} y={90} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui" textAnchor="middle">{stat.label}</text>
          <text x={92 + i * 148} y={104} fill="#1E293B" fontSize={13} fontFamily="system-ui" textAnchor="middle" fontWeight="800">{stat.val}</text>
        </g>
      ))}

      {/* Client table header */}
      <text x={24} y={134} fill="#94A3B8" fontSize={8} fontFamily="system-ui" letterSpacing={2} fontWeight="700">RECENT CLIENT REPORTS</text>

      {/* Client rows */}
      {clients.map((c, i) => {
        const y = 144 + i * 44;
        return (
          <g key={i}>
            <rect x={24} y={y} width={432} height={36} rx={7} fill="white" stroke="#F1F5F9" strokeWidth={1} />
            {/* Avatar */}
            <circle cx={44} cy={y + 18} r={10} fill="#EFF6FF" />
            <text x={44} y={y + 22} fill="#2563EB" fontSize={9} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{c.name[0]}</text>
            {/* Name + type */}
            <text x={62} y={y + 14} fill="#1E293B" fontSize={9} fontFamily="system-ui" fontWeight="700">{c.name}</text>
            <text x={62} y={y + 27} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui">{c.type}</text>
            {/* Status */}
            <rect x={380} y={y + 10} width={64} height={16} rx={4} fill={c.statusBg} />
            <text x={412} y={y + 21} fill={c.statusColor} fontSize={7.5} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{c.status}</text>
          </g>
        );
      })}
    </svg>
  );
}

interface FeatureBlock {
  tag: string;
  headline: string;
  description: string;
  visual: React.ReactNode;
}

const FEATURES: FeatureBlock[] = [
  {
    tag: 'ANALYSIS',
    headline: 'Every account. Every signal. One complete picture.',
    description: 'Surface the full depth of a financial profile — active loans, closed accounts, lender history, and account-level status — in a single structured view.',
    visual: <FullProfileVisual />,
  },
  {
    tag: 'BEHAVIOR',
    headline: 'See exactly how payments have been made — month by month.',
    description: 'Track DPD patterns, missed EMIs, and consistency trends across the full repayment history to understand behavior, not just outcomes.',
    visual: <PaymentBehaviorVisual />,
  },
  {
    tag: 'RISK',
    headline: 'Flag write-offs, defaults, and anomalies before they define the profile.',
    description: 'Our engine surfaces write-offs, settlements, enquiry spikes, and delinquency patterns with severity context — not just raw flags.',
    visual: <RiskSignalVisual />,
  },
  {
    tag: 'UTILIZATION',
    headline: 'Know when credit usage crosses into over-leverage territory.',
    description: 'Break down utilization per card and overall — with automatic detection of accounts pushing past the safe threshold.',
    visual: <UtilizationVisual />,
  },
  {
    tag: 'IMPROVEMENT',
    headline: 'A concrete roadmap — not a score and a shrug.',
    description: 'Every analysis ends with a prioritized action plan: what to fix, in what order, and how long each step realistically takes.',
    visual: <ImprovementPlanVisual />,
  },
  {
    tag: 'PARTNERS',
    headline: 'Professional-grade reports built for DSAs, CAs, and advisors.',
    description: 'Generate client reports, track approval outcomes, and manage your entire book from one clean dashboard — built for professionals who work at scale.',
    visual: <PartnerReportVisual />,
  },
];

function FeatureSection({ block, index }: { block: FeatureBlock; index: number }) {
  const { ref, inView } = useInView(0.1);
  const isEven = index % 2 === 0;

  return (
    <section ref={ref} className="py-10 lg:py-14">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text side */}
          <div
            className={`${isEven ? 'lg:order-1' : 'lg:order-2'} transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <span className="inline-block text-blue-600 text-xs font-bold tracking-[0.18em] mb-5 uppercase">
              {block.tag}
            </span>
            <h2 className="text-4xl lg:text-[2.6rem] font-bold text-slate-900 leading-[1.15] mb-5 tracking-tight">
              {block.headline}
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              {block.description}
            </p>
          </div>

          {/* Visual side */}
          <div
            className={`${isEven ? 'lg:order-2' : 'lg:order-1'} transition-all duration-700 delay-150 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <div className="rounded-2xl overflow-hidden aspect-[4/3]">
              {block.visual}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  const { ref: heroRef, inView: heroInView } = useInView(0.1);
  const { ref: ctaRef, inView: ctaInView } = useInView(0.1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <PublicNav />

      {/* HERO */}
      <section className="pt-24 pb-10" ref={heroRef}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div
            className={`transition-all duration-700 ease-out ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <span className="inline-block text-blue-600 text-xs font-bold tracking-[0.18em] uppercase mb-6">
              Platform Capabilities
            </span>
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight mb-6">
              Intelligence at every layer.
            </h1>
            <p className="text-slate-500 text-xl leading-relaxed max-w-2xl mx-auto">
              Six capabilities built to surface what matters — not just what's measurable.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="h-px bg-slate-200" />
      </div>

      {/* FEATURE BLOCKS */}
      {FEATURES.map((block, i) => (
        <React.Fragment key={block.tag}>
          <FeatureSection block={block} index={i} />
          {i < FEATURES.length - 1 && (
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <div className="h-px bg-slate-200" />
            </div>
          )}
        </React.Fragment>
      ))}

      {/* BOTTOM CTA */}
      <div ref={ctaRef} className="mt-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="h-px bg-slate-200" />
        </div>
        <div
          className={`max-w-3xl mx-auto px-6 lg:px-8 py-16 text-center transition-all duration-700 ease-out ${ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className="inline-block text-blue-600 text-xs font-bold tracking-[0.18em] uppercase mb-5">
            Get Started
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight tracking-tight mb-5">
            Ready to see it in action?
          </h2>
          <p className="text-slate-500 text-lg mb-10 leading-relaxed">
            Run a full analysis on your financial data signals — all six capabilities, in one report.
          </p>
          <Link
            href="/get-analysis"
            className="inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-200 group text-base"
          >
            Start Your Analysis
            <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
