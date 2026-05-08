'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNav from '../home/components/PublicNav';
import PublicFooter from '../home/components/PublicFooter';
import { ArrowRight, CheckCircle } from 'lucide-react';

function useInView(threshold = 0.1) {
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

// ── Visual: Partner Dashboard ──
function DashboardVisual() {
  return (
    <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={320} fill="#F8FAFC" rx={16} />
      {/* Sidebar */}
      <rect x={0} y={0} width={100} height={320} rx={12} fill="#1E293B" />
      <rect x={12} y={20} width={76} height={28} rx={6} fill="#2563EB" />
      <text x={50} y={38} fill="white" fontSize={8} fontFamily="system-ui" textAnchor="middle" fontWeight="700">DASHBOARD</text>
      {['Clients', 'Reports', 'Wallet', 'Settings'].map((item, i) => (
        <g key={i}>
          <rect x={12} y={60 + i * 36} width={76} height={26} rx={6} fill={i === 0 ? '#334155' : 'transparent'} />
          <text x={50} y={77 + i * 36} fill={i === 0 ? 'white' : '#94A3B8'} fontSize={8} fontFamily="system-ui" textAnchor="middle">{item}</text>
        </g>
      ))}
      {/* Main area */}
      <text x={120} y={30} fill="#94A3B8" fontSize={7} fontFamily="system-ui" letterSpacing={2} fontWeight="700">PARTNER OVERVIEW</text>
      {/* KPI cards */}
      {[
        { label: 'Total Clients', value: '—' },
        { label: 'Reports Pulled', value: '—' },
        { label: 'Wallet Balance', value: '—' },
      ].map((kpi, i) => (
        <g key={i}>
          <rect x={120 + i * 122} y={42} width={112} height={56} rx={8} fill="white" stroke="#E2E8F0" strokeWidth={1} />
          <text x={176 + i * 122} y={68} fill="#1E293B" fontSize={14} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{kpi.value}</text>
          <text x={176 + i * 122} y={86} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui" textAnchor="middle">{kpi.label}</text>
        </g>
      ))}
      {/* Client list */}
      <rect x={120} y={112} width={340} height={24} rx={6} fill="#F1F5F9" />
      <text x={136} y={128} fill="#64748B" fontSize={7.5} fontFamily="system-ui" fontWeight="700">CLIENT</text>
      <text x={300} y={128} fill="#64748B" fontSize={7.5} fontFamily="system-ui" fontWeight="700">STATUS</text>
      <text x={400} y={128} fill="#64748B" fontSize={7.5} fontFamily="system-ui" fontWeight="700">LAST PULL</text>
      {[
        { name: 'Rajesh Kumar', status: 'Analysed', color: '#16A34A', bg: '#DCFCE7', date: 'Today' },
        { name: 'Priya Sharma', status: 'Pending', color: '#D97706', bg: '#FEF3C7', date: 'Yesterday' },
        { name: 'Amit Verma', status: 'Analysed', color: '#16A34A', bg: '#DCFCE7', date: '3 days ago' },
        { name: 'Sunita Patel', status: 'New', color: '#2563EB', bg: '#EFF6FF', date: '—' },
      ].map((client, i) => (
        <g key={i}>
          <rect x={120} y={140 + i * 38} width={340} height={32} rx={6} fill="white" stroke="#F1F5F9" strokeWidth={1} />
          <circle cx={136} cy={156 + i * 38} r={8} fill="#EFF6FF" />
          <text x={136} y={159 + i * 38} fill="#2563EB" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{client.name[0]}</text>
          <text x={152} y={159 + i * 38} fill="#1E293B" fontSize={8} fontFamily="system-ui" fontWeight="600">{client.name}</text>
          <rect x={284} y={148 + i * 38} width={52} height={16} rx={4} fill={client.bg} />
          <text x={310} y={159 + i * 38} fill={client.color} fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{client.status}</text>
          <text x={400} y={159 + i * 38} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui">{client.date}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Visual: Instant Analysis ──
function InstantAnalysisVisual() {
  return (
    <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={320} fill="#F8FAFC" rx={16} />
      {/* Progress steps */}
      <text x={24} y={36} fill="#94A3B8" fontSize={7} fontFamily="system-ui" letterSpacing={2} fontWeight="700">ANALYSIS IN PROGRESS</text>
      {[
        { label: 'Bureau Data Fetched', done: true },
        { label: 'Account Mapping', done: true },
        { label: 'Payment Behavior Analysis', done: true },
        { label: 'Risk Signal Detection', done: false, active: true },
        { label: 'Generating Report', done: false },
      ].map((step, i) => (
        <g key={i}>
          <circle cx={36} cy={62 + i * 44} r={10} fill={step.done ? '#2563EB' : step.active ? '#EFF6FF' : '#F1F5F9'} stroke={step.active ? '#2563EB' : 'none'} strokeWidth={1.5} />
          {step.done && (
            <>
              <line x1={30} y1={62 + i * 44} x2={34} y2={67 + i * 44} stroke="white" strokeWidth={1.5} strokeLinecap="round" />
              <line x1={34} y1={67 + i * 44} x2={42} y2={57 + i * 44} stroke="white" strokeWidth={1.5} strokeLinecap="round" />
            </>
          )}
          {step.active && <circle cx={36} cy={62 + i * 44} r={3} fill="#2563EB" />}
          {!step.done && !step.active && <circle cx={36} cy={62 + i * 44} r={3} fill="#CBD5E1" />}
          {i < 4 && <line x1={36} y1={72 + i * 44} x2={36} y2={96 + i * 44} stroke={step.done ? '#2563EB' : '#E2E8F0'} strokeWidth={1.5} strokeDasharray={step.done ? '0' : '3 3'} />}
          <text x={56} y={66 + i * 44} fill={step.done ? '#1E293B' : step.active ? '#2563EB' : '#94A3B8'} fontSize={9} fontFamily="system-ui" fontWeight={step.done || step.active ? '600' : '400'}>{step.label}</text>
          {step.done && (
            <rect x={280} y={54 + i * 44} width={44} height={16} rx={4} fill="#DCFCE7">
              <text x={302} y={65 + i * 44} fill="#16A34A" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">DONE</text>
            </rect>
          )}
          {step.done && <text x={302} y={65 + i * 44} fill="#16A34A" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">DONE</text>}
          {step.active && <text x={302} y={65 + i * 44} fill="#2563EB" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">RUNNING</text>}
        </g>
      ))}
      {/* Timer */}
      <rect x={360} y={260} width={96} height={36} rx={8} fill="#EFF6FF" />
      <text x={408} y={276} fill="#2563EB" fontSize={8} fontFamily="system-ui" textAnchor="middle" fontWeight="700">AVG. TIME</text>
      <text x={408} y={290} fill="#1E293B" fontSize={10} fontFamily="system-ui" textAnchor="middle" fontWeight="800">Under 2 min</text>
    </svg>
  );
}

// ── Visual: Wallet System ──
function WalletVisual() {
  return (
    <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={320} fill="#F8FAFC" rx={16} />
      {/* Wallet card */}
      <rect x={24} y={20} width={432} height={100} rx={12} fill="#1E293B" />
      <text x={44} y={52} fill="#94A3B8" fontSize={8} fontFamily="system-ui" letterSpacing={2} fontWeight="700">PARTNER WALLET</text>
      <text x={44} y={80} fill="white" fontSize={22} fontFamily="system-ui" fontWeight="800">₹ ——</text>
      <text x={44} y={100} fill="#64748B" fontSize={8} fontFamily="system-ui">Available Balance</text>
      <rect x={360} y={44} width={80} height={28} rx={6} fill="#2563EB" />
      <text x={400} y={62} fill="white" fontSize={8} fontFamily="system-ui" textAnchor="middle" fontWeight="700">+ RECHARGE</text>
      {/* Transaction list */}
      <text x={24} y={148} fill="#94A3B8" fontSize={7} fontFamily="system-ui" letterSpacing={2} fontWeight="700">RECENT TRANSACTIONS</text>
      {[
        { label: 'Analysis — Rajesh Kumar', type: 'debit', amount: '— credits' },
        { label: 'Wallet Recharge', type: 'credit', amount: '+ credits' },
        { label: 'Analysis — Priya Sharma', type: 'debit', amount: '— credits' },
        { label: 'Analysis — Amit Verma', type: 'debit', amount: '— credits' },
      ].map((tx, i) => (
        <g key={i}>
          <rect x={24} y={160 + i * 36} width={432} height={30} rx={6} fill="white" stroke="#F1F5F9" strokeWidth={1} />
          <circle cx={42} cy={175 + i * 36} r={7} fill={tx.type === 'credit' ? '#DCFCE7' : '#FEE2E2'} />
          <text x={42} y={178 + i * 36} fill={tx.type === 'credit' ? '#16A34A' : '#DC2626'} fontSize={8} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{tx.type === 'credit' ? '+' : '−'}</text>
          <text x={58} y={178 + i * 36} fill="#1E293B" fontSize={8.5} fontFamily="system-ui" fontWeight="500">{tx.label}</text>
          <text x={440} y={178 + i * 36} fill={tx.type === 'credit' ? '#16A34A' : '#64748B'} fontSize={8} fontFamily="system-ui" textAnchor="end" fontWeight="600">{tx.amount}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Visual: Professional Report ──
function ReportVisual() {
  return (
    <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={320} fill="#F8FAFC" rx={16} />
      {/* Report header */}
      <rect x={24} y={16} width={432} height={52} rx={10} fill="white" stroke="#E2E8F0" strokeWidth={1} />
      <rect x={40} y={28} width={28} height={28} rx={6} fill="#2563EB" />
      <text x={54} y={46} fill="white" fontSize={10} fontFamily="system-ui" textAnchor="middle" fontWeight="800">I</text>
      <text x={78} y={38} fill="#1E293B" fontSize={10} fontFamily="system-ui" fontWeight="700">Financial Analysis Report</text>
      <text x={78} y={54} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui">Prepared by Insight · Confidential</text>
      <rect x={380} y={28} width={60} height={16} rx={4} fill="#EFF6FF" />
      <text x={410} y={39} fill="#2563EB" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">PROFESSIONAL</text>
      {/* Sections */}
      {[
        { title: 'Account Summary', items: ['4 active accounts', 'Credit age: 6+ years', 'No write-offs detected'] },
        { title: 'Risk Assessment', items: ['Enquiry pattern: Normal', 'DPD trend: Improving', 'Utilization: Moderate'] },
        { title: 'Recommendations', items: ['Reduce credit card usage', 'Maintain EMI consistency', 'Avoid new enquiries'] },
      ].map((section, si) => (
        <g key={si}>
          <text x={40} y={96 + si * 76} fill="#1E293B" fontSize={9} fontFamily="system-ui" fontWeight="700">{section.title}</text>
          <line x1={40} y1={102 + si * 76} x2={440} y2={102 + si * 76} stroke="#F1F5F9" strokeWidth={1} />
          {section.items.map((item, ii) => (
            <g key={ii}>
              <circle cx={48} cy={116 + si * 76 + ii * 16} r={2.5} fill="#2563EB" />
              <text x={58} y={120 + si * 76 + ii * 16} fill="#64748B" fontSize={8} fontFamily="system-ui">{item}</text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

// ── Visual: Risk Signals ──
function RiskSignalVisual() {
  return (
    <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={320} fill="#F8FAFC" rx={16} />
      <text x={24} y={36} fill="#94A3B8" fontSize={7} fontFamily="system-ui" letterSpacing={2} fontWeight="700">RISK SIGNAL FEED</text>
      {[
        { signal: 'Enquiry Spike Detected', detail: '6 hard enquiries in 45 days', level: 'HIGH', color: '#DC2626', bg: '#FEE2E2' },
        { signal: 'Utilization Elevated', detail: 'Credit card at 78% of limit', level: 'MEDIUM', color: '#D97706', bg: '#FEF3C7' },
        { signal: 'DPD Pattern Improving', detail: 'No late payments in 8 months', level: 'POSITIVE', color: '#16A34A', bg: '#DCFCE7' },
        { signal: 'Account Age Strong', detail: 'Oldest account: 7 years 4 months', level: 'POSITIVE', color: '#16A34A', bg: '#DCFCE7' },
        { signal: 'Settlement on Record', detail: '1 settled account — 2021', level: 'HIGH', color: '#DC2626', bg: '#FEE2E2' },
      ].map((item, i) => (
        <g key={i}>
          <rect x={24} y={48 + i * 50} width={432} height={42} rx={8} fill="white" stroke="#E2E8F0" strokeWidth={1} />
          <rect x={24} y={48 + i * 50} width={4} height={42} rx={2} fill={item.color} />
          <text x={40} y={66 + i * 50} fill="#1E293B" fontSize={9} fontFamily="system-ui" fontWeight="700">{item.signal}</text>
          <text x={40} y={80 + i * 50} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui">{item.detail}</text>
          <rect x={360} y={58 + i * 50} width={80} height={18} rx={4} fill={item.bg} />
          <text x={400} y={70 + i * 50} fill={item.color} fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{item.level}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Visual: Improvement Roadmap ──
function RoadmapVisual() {
  return (
    <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={320} fill="#F8FAFC" rx={16} />
      <text x={24} y={36} fill="#94A3B8" fontSize={7} fontFamily="system-ui" letterSpacing={2} fontWeight="700">IMPROVEMENT ROADMAP</text>
      {/* Timeline */}
      {[
        { month: 'Month 1', action: 'Reduce credit card utilization below 30%', impact: 'High', impactColor: '#16A34A', impactBg: '#DCFCE7' },
        { month: 'Month 2', action: 'Avoid all new credit enquiries', impact: 'High', impactColor: '#16A34A', impactBg: '#DCFCE7' },
        { month: 'Month 3', action: 'Maintain zero DPD across all accounts', impact: 'Medium', impactColor: '#D97706', impactBg: '#FEF3C7' },
        { month: 'Month 4–6', action: 'Build consistent repayment track record', impact: 'High', impactColor: '#16A34A', impactBg: '#DCFCE7' },
      ].map((step, i) => (
        <g key={i}>
          <circle cx={36} cy={68 + i * 60} r={10} fill="#2563EB" />
          <text x={36} y={72 + i * 60} fill="white" fontSize={8} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{i + 1}</text>
          {i < 3 && <line x1={36} y1={78 + i * 60} x2={36} y2={118 + i * 60} stroke="#E2E8F0" strokeWidth={1.5} strokeDasharray="3 3" />}
          <rect x={56} y={52 + i * 60} width={380} height={40} rx={8} fill="white" stroke="#E2E8F0" strokeWidth={1} />
          <text x={72} y={68 + i * 60} fill="#94A3B8" fontSize={7} fontFamily="system-ui" fontWeight="700">{step.month}</text>
          <text x={72} y={83 + i * 60} fill="#1E293B" fontSize={8.5} fontFamily="system-ui" fontWeight="600">{step.action}</text>
          <rect x={360} y={60 + i * 60} width={60} height={16} rx={4} fill={step.impactBg} />
          <text x={390} y={71 + i * 60} fill={step.impactColor} fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{step.impact}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Visual: Enquiry Intelligence ──
function EnquiryVisual() {
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const counts = [1, 0, 2, 0, 1, 3, 0, 1, 0];
  const maxCount = 4;
  return (
    <svg viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={320} fill="#F8FAFC" rx={16} />
      <text x={24} y={36} fill="#94A3B8" fontSize={7} fontFamily="system-ui" letterSpacing={2} fontWeight="700">ENQUIRY PATTERN — 9 MONTHS</text>
      {/* Bars */}
      {months.map((m, i) => {
        const barH = counts[i] === 0 ? 4 : (counts[i] / maxCount) * 160;
        const barY = 220 - barH;
        const isSpike = counts[i] >= 3;
        return (
          <g key={i}>
            <rect x={36 + i * 46} y={barY} width={28} height={barH} rx={4} fill={isSpike ? '#FCA5A5' : counts[i] === 0 ? '#E2E8F0' : '#93C5FD'} />
            {isSpike && (
              <>
                <rect x={28 + i * 46} y={barY - 22} width={44} height={16} rx={4} fill="#FEE2E2" />
                <text x={50 + i * 46} y={barY - 11} fill="#DC2626" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">SPIKE</text>
              </>
            )}
            <text x={50 + i * 46} y={238} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui" textAnchor="middle">{m}</text>
            {counts[i] > 0 && (
              <text x={50 + i * 46} y={barY - 4} fill={isSpike ? '#DC2626' : '#2563EB'} fontSize={8} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{counts[i]}</text>
            )}
          </g>
        );
      })}
      {/* Baseline */}
      <line x1={24} y1={224} x2={456} y2={224} stroke="#E2E8F0" strokeWidth={1} />
      {/* Legend */}
      <rect x={24} y={260} width={12} height={12} rx={2} fill="#93C5FD" />
      <text x={42} y={271} fill="#64748B" fontSize={8} fontFamily="system-ui">Normal enquiry</text>
      <rect x={140} y={260} width={12} height={12} rx={2} fill="#FCA5A5" />
      <text x={158} y={271} fill="#64748B" fontSize={8} fontFamily="system-ui">Spike — risk signal</text>
      {/* Summary box */}
      <rect x={300} y={252} width={156} height={44} rx={8} fill="white" stroke="#E2E8F0" strokeWidth={1} />
      <text x={378} y={268} fill="#94A3B8" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">TOTAL ENQUIRIES</text>
      <text x={378} y={286} fill="#1E293B" fontSize={14} fontFamily="system-ui" textAnchor="middle" fontWeight="800">8 in 9 months</text>
    </svg>
  );
}

// ── Visual: Consumer Data ──
function ConsumerDataVisual() {
  return (
    <svg viewBox="0 0 480 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={280} fill="#EFF6FF" rx={16} />
      {/* Central profile card */}
      <rect x={140} y={20} width={200} height={80} rx={12} fill="white" stroke="#BFDBFE" strokeWidth={1.5} />
      <circle cx={180} cy={60} r={18} fill="#DBEAFE" />
      <text x={180} y={65} fill="#2563EB" fontSize={13} fontFamily="system-ui" textAnchor="middle" fontWeight="800">R</text>
      <text x={210} y={50} fill="#1E293B" fontSize={9} fontFamily="system-ui" fontWeight="700">Rahul Mehta</text>
      <text x={210} y={64} fill="#64748B" fontSize={7.5} fontFamily="system-ui">Individual · Mumbai</text>
      <rect x={205} y={72} width={50} height={14} rx={4} fill="#DCFCE7" />
      <text x={230} y={82} fill="#16A34A" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">VERIFIED</text>
      {/* Data points radiating out */}
      {[
        { label: 'Credit Score', value: '—', x: 24, y: 60, color: '#2563EB', bg: '#EFF6FF' },
        { label: 'Active Loans', value: '—', x: 24, y: 140, color: '#7C3AED', bg: '#F5F3FF' },
        { label: 'DPD History', value: '—', x: 24, y: 220, color: '#0891B2', bg: '#ECFEFF' },
        { label: 'Enquiries', value: '—', x: 360, y: 60, color: '#DC2626', bg: '#FEF2F2' },
        { label: 'Utilization', value: '—', x: 360, y: 140, color: '#D97706', bg: '#FFFBEB' },
        { label: 'Account Age', value: '—', x: 360, y: 220, color: '#16A34A', bg: '#F0FDF4' },
      ].map((d, i) => (
        <g key={i}>
          <rect x={d.x} y={d.y} width={88} height={40} rx={8} fill="white" stroke="#E2E8F0" strokeWidth={1} />
          <rect x={d.x} y={d.y} width={3} height={40} rx={2} fill={d.color} />
          <text x={d.x + 12} y={d.y + 16} fill="#94A3B8" fontSize={6.5} fontFamily="system-ui" fontWeight="700">{d.label.toUpperCase()}</text>
          <text x={d.x + 12} y={d.y + 30} fill={d.color} fontSize={11} fontFamily="system-ui" fontWeight="800">{d.value}</text>
        </g>
      ))}
      {/* Connecting lines */}
      <line x1={112} y1={80} x2={140} y2={60} stroke="#BFDBFE" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={112} y1={160} x2={140} y2={80} stroke="#BFDBFE" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={112} y1={240} x2={140} y2={100} stroke="#BFDBFE" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={360} y1={80} x2={340} y2={60} stroke="#BFDBFE" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={360} y1={160} x2={340} y2={80} stroke="#BFDBFE" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={360} y1={240} x2={340} y2={100} stroke="#BFDBFE" strokeWidth={1} strokeDasharray="3 3" />
    </svg>
  );
}

// ── Visual: Commercial Data ──
function CommercialDataVisual() {
  return (
    <svg viewBox="0 0 480 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={280} fill="#F5F3FF" rx={16} />
      {/* Company header */}
      <rect x={24} y={16} width={432} height={56} rx={10} fill="white" stroke="#DDD6FE" strokeWidth={1.5} />
      <rect x={40} y={28} width={28} height={28} rx={8} fill="#7C3AED" />
      <text x={56} y={48} fill="white" fontSize={12} fontFamily="system-ui" textAnchor="middle" fontWeight="800">B</text>
      <text x={84} y={38} fill="#1E293B" fontSize={10} fontFamily="system-ui" fontWeight="700">Bharat Enterprises Pvt. Ltd.</text>
      <text x={84} y={54} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui">GSTIN: 27XXXXX · Mumbai · Est. 2015</text>
      <rect x={380} y={28} width={60} height={18} rx={4} fill="#EDE9FE" />
      <text x={410} y={40} fill="#7C3AED" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">ACTIVE</text>
      {/* Metrics grid */}
      {[
        { label: 'Credit Exposure', value: '—', sub: 'Total outstanding', color: '#7C3AED' },
        { label: 'Payment Track', value: '—', sub: 'On-time rate', color: '#16A34A' },
        { label: 'Lender Count', value: '—', sub: 'Active relationships', color: '#2563EB' },
        { label: 'Risk Grade', value: '—', sub: 'Internal rating', color: '#D97706' },
      ].map((m, i) => (
        <g key={i}>
          <rect x={24 + (i % 2) * 228} y={88 + Math.floor(i / 2) * 80} width={212} height={64} rx={10} fill="white" stroke="#E2E8F0" strokeWidth={1} />
          <text x={44 + (i % 2) * 228} y={112 + Math.floor(i / 2) * 80} fill={m.color} fontSize={18} fontFamily="system-ui" fontWeight="800">{m.value}</text>
          <text x={44 + (i % 2) * 228} y={128 + Math.floor(i / 2) * 80} fill="#1E293B" fontSize={8.5} fontFamily="system-ui" fontWeight="600">{m.label}</text>
          <text x={44 + (i % 2) * 228} y={142 + Math.floor(i / 2) * 80} fill="#94A3B8" fontSize={7} fontFamily="system-ui">{m.sub}</text>
        </g>
      ))}
      {/* Bottom tag */}
      <rect x={24} y={256} width={432} height={16} rx={4} fill="#EDE9FE" />
      <text x={240} y={267} fill="#7C3AED" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">COMMERCIAL CREDIT INTELLIGENCE · POWERED BY INSIGHT</text>
    </svg>
  );
}

// ── Visual: Bulk Reports ──
function BulkReportsVisual() {
  return (
    <svg viewBox="0 0 480 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width={480} height={280} fill="#F0FDF4" rx={16} />
      {/* Stack of report cards */}
      <rect x={60} y={40} width={360} height={200} rx={12} fill="#DCFCE7" stroke="#BBF7D0" strokeWidth={1} />
      <rect x={44} y={32} width={360} height={200} rx={12} fill="#ECFDF5" stroke="#A7F3D0" strokeWidth={1} />
      <rect x={28} y={24} width={360} height={200} rx={12} fill="white" stroke="#D1FAE5" strokeWidth={1.5} />
      {/* Report header */}
      <rect x={28} y={24} width={360} height={44} rx={12} fill="#16A34A" />
      <text x={208} y={42} fill="white" fontSize={9} fontFamily="system-ui" textAnchor="middle" fontWeight="700" letterSpacing={2}>BULK ANALYSIS REPORT</text>
      <text x={208} y={58} fill="#BBF7D0" fontSize={7.5} fontFamily="system-ui" textAnchor="middle">Batch processed · 50 profiles</text>
      {/* Progress bar */}
      <rect x={44} y={80} width={328} height={8} rx={4} fill="#DCFCE7" />
      <rect x={44} y={80} width={280} height={8} rx={4} fill="#16A34A" />
      <text x={380} y={88} fill="#16A34A" fontSize={8} fontFamily="system-ui" fontWeight="700">85%</text>
      {/* Report rows */}
      {[
        { name: 'Rajesh Kumar', status: 'Complete', color: '#16A34A', bg: '#DCFCE7' },
        { name: 'Priya Sharma', status: 'Complete', color: '#16A34A', bg: '#DCFCE7' },
        { name: 'Amit Verma', status: 'Processing', color: '#D97706', bg: '#FEF3C7' },
        { name: 'Sunita Patel', status: 'Queued', color: '#64748B', bg: '#F1F5F9' },
      ].map((row, i) => (
        <g key={i}>
          <rect x={44} y={100 + i * 28} width={328} height={22} rx={5} fill={i % 2 === 0 ? '#F0FDF4' : 'white'} />
          <circle cx={58} cy={111 + i * 28} r={6} fill="#DCFCE7" />
          <text x={58} y={114 + i * 28} fill="#16A34A" fontSize={6} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{row.name[0]}</text>
          <text x={72} y={114 + i * 28} fill="#1E293B" fontSize={8} fontFamily="system-ui" fontWeight="500">{row.name}</text>
          <rect x={300} y={104 + i * 28} width={60} height={14} rx={4} fill={row.bg} />
          <text x={330} y={114 + i * 28} fill={row.color} fontSize={6.5} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{row.status}</text>
        </g>
      ))}
      {/* Bottom summary */}
      <rect x={28} y={212} width={360} height={12} rx={4} fill="#DCFCE7" />
      <text x={208} y={221} fill="#16A34A" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">42 of 50 reports complete · Est. 4 min remaining</text>
    </svg>
  );
}

interface BenefitBlock {
  tag: string;
  title: string;
  description: string;
  bullets: string[];
  visual: React.ReactNode;
  reverse: boolean;
}

function FeatureBlock({ tag, title, description, bullets, visual, reverse }: BenefitBlock) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-20 items-center`}>
        {/* Text */}
        <div className="flex-1 max-w-lg">
          <span className="text-xs font-bold tracking-widest text-blue-600 uppercase">{tag}</span>
          <h3 className="mt-3 text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">{title}</h3>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">{description}</p>
          <ul className="mt-6 space-y-3">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <span className="text-slate-600 text-sm">{b}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Visual */}
        <div className="flex-1 w-full max-w-xl">
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            {visual}
          </div>
        </div>
      </div>
    </div>
  );
}

const benefits: BenefitBlock[] = [
  {
    tag: 'DASHBOARD',
    title: 'Manage every client from one place.',
    description: 'A dedicated partner dashboard gives you full visibility across all your clients — their analysis status, report history, and account health at a glance.',
    bullets: [
      'See all clients and their analysis status in one view',
      'Track report history and pull dates per client',
      'Quick-pull new analysis without leaving the dashboard',
    ],
    visual: <DashboardVisual />,
    reverse: false,
  },
  {
    tag: 'SPEED',
    title: 'Full financial analysis in under 2 minutes.',
    description: 'From bureau data fetch to complete analysis — our engine processes 50+ signals and delivers a structured report faster than any manual review.',
    bullets: [
      'Bureau data fetched and mapped automatically',
      'Payment behavior, risk signals, and utilization analysed in parallel',
      'Structured report ready in under 2 minutes',
    ],
    visual: <InstantAnalysisVisual />,
    reverse: true,
  },
  {
    tag: 'RISK INTELLIGENCE',
    title: 'Surface risk signals your clients can\'t see.',
    description: 'Our engine detects write-offs, settlement records, enquiry spikes, and DPD patterns — and presents them with context, not just flags.',
    bullets: [
      'Enquiry spike detection with timeline context',
      'Settlement and write-off surfaced with dates',
      'DPD trend analysis — improving, stable, or deteriorating',
    ],
    visual: <RiskSignalVisual />,
    reverse: false,
  },
  {
    tag: 'WALLET',
    title: 'Pay only for what you use.',
    description: 'No monthly subscriptions. No lock-in. Recharge your partner wallet and deduct credits per analysis — full control, full transparency.',
    bullets: [
      'Recharge any amount, use at your own pace',
      'Per-analysis deduction — no hidden charges',
      'Full transaction history in your wallet dashboard',
    ],
    visual: <WalletVisual />,
    reverse: true,
  },
  {
    tag: 'REPORTS',
    title: 'Professional-grade reports for your clients.',
    description: 'Every analysis produces a clean, structured report — account summary, risk assessment, and a concrete improvement roadmap your clients can act on.',
    bullets: [
      'Account summary with lender-level breakdown',
      'Risk assessment with signal-level detail',
      'Actionable improvement roadmap with timelines',
    ],
    visual: <ReportVisual />,
    reverse: false,
  },
  {
    tag: 'ENQUIRY INTELLIGENCE',
    title: 'Decode enquiry patterns before they become problems.',
    description: 'Multiple hard enquiries in a short window signal financial stress. Our engine tracks enquiry frequency, clusters spikes, and explains what it means for loan eligibility.',
    bullets: [
      'Month-by-month enquiry frequency chart',
      'Spike detection with risk classification',
      'Lender appetite signals based on enquiry patterns',
    ],
    visual: <EnquiryVisual />,
    reverse: true,
  },
];

export default function PartnerProgramPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicNav />

      {/* ── HERO ── */}
      <section className="pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div
            ref={heroRef}
            className={`transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <span className="inline-block text-xs font-bold tracking-widest text-blue-600 uppercase bg-blue-50 px-4 py-1.5 rounded-full mb-6">
              PARTNER PROGRAM
            </span>
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
              The intelligence platform<br />
              <span className="text-blue-600">built for financial professionals.</span>
            </h1>
            <p className="mt-6 text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Pull deep financial analysis for your clients — faster, smarter, at scale. Built for DSAs, CAs, and financial advisors who need more than a number.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/become-a-partner"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-base shadow-sm"
              >
                Become a Partner
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-8 py-4 rounded-xl border border-slate-200 transition-all duration-200 text-base"
              >
                Talk to Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO THIS IS FOR ── */}
      <section className="py-16 px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase text-center mb-10">WHO THIS IS FOR</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                role: 'DSA Agents',
                line: 'Close more loans with data-backed client insights.',
                icon: '📋',
              },
              {
                role: 'Chartered Accountants',
                line: 'Give clients a complete financial health picture beyond tax returns.',
                icon: '📊',
              },
              {
                role: 'Financial Advisors',
                line: 'Build trust with professional-grade analysis your clients can act on.',
                icon: '🎯',
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.role}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES OFFERED FOR PARTNERS ── */}
      <section className="py-20 px-6 lg:px-8 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold tracking-widest text-blue-400 uppercase bg-blue-900/40 px-4 py-1.5 rounded-full mb-5">
              SERVICES OFFERED FOR PARTNERS
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
              Three data products.<br />
              <span className="text-blue-400">One powerful platform.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Whether you&apos;re assessing an individual borrower, evaluating a business, or processing a large client portfolio — we have the data product for it.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Consumer Data */}
            <div className="relative bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
              <div className="p-8">
                <div className="w-12 h-12 rounded-xl bg-blue-900/60 flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                  <svg className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Consumer Data</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Full individual credit intelligence — from bureau scores to behavioral patterns. Ideal for DSAs and advisors assessing personal loan eligibility, creditworthiness, and financial health of individual clients.
                </p>
                <ul className="space-y-2.5 mb-8">
                  {[
                    'Bureau credit score with trend analysis',
                    'Account-level breakdown across all lenders',
                    'DPD history and payment behavior patterns',
                    'Hard enquiry timeline and spike detection',
                    'Credit utilization and limit analysis',
                    'Risk signals with actionable context',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl overflow-hidden border border-slate-700">
                  <ConsumerDataVisual />
                </div>
              </div>
              <div className="px-8 pb-8">
                <div className="bg-blue-900/30 border border-blue-800 rounded-xl p-4">
                  <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Best For</p>
                  <p className="text-slate-300 text-sm">DSA Agents · Financial Advisors · Loan Consultants</p>
                </div>
              </div>
            </div>

            {/* Commercial Data */}
            <div className="relative bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-purple-500 transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-400" />
              <div className="p-8">
                <div className="w-12 h-12 rounded-xl bg-purple-900/60 flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors duration-300">
                  <svg className="w-6 h-6 text-purple-400 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Commercial Data</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Business credit intelligence for SMEs, proprietorships, and private limited companies. Designed for CAs and financial advisors who need a complete picture of a business entity&apos;s credit standing before advising on loans or investments.
                </p>
                <ul className="space-y-2.5 mb-8">
                  {[
                    'Business credit profile and exposure summary',
                    'Lender relationship mapping across banks',
                    'Commercial payment track record analysis',
                    'Outstanding liability and repayment behavior',
                    'Director-level credit linkage insights',
                    'Business risk grade and financial health score',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl overflow-hidden border border-slate-700">
                  <CommercialDataVisual />
                </div>
              </div>
              <div className="px-8 pb-8">
                <div className="bg-purple-900/30 border border-purple-800 rounded-xl p-4">
                  <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">Best For</p>
                  <p className="text-slate-300 text-sm">Chartered Accountants · Business Loan Advisors · NBFCs</p>
                </div>
              </div>
            </div>

            {/* Bulk Reports */}
            <div className="relative bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-emerald-500 transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-400" />
              <div className="p-8">
                <div className="w-12 h-12 rounded-xl bg-emerald-900/60 flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors duration-300">
                  <svg className="w-6 h-6 text-emerald-400 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Bulk Reports</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Process entire client portfolios in one go. Upload a list of profiles and receive structured analysis reports for all of them — automatically queued, processed, and delivered. Built for partners who operate at scale.
                </p>
                <ul className="space-y-2.5 mb-8">
                  {[
                    'Upload multiple profiles in a single batch',
                    'Automated queue processing — no manual intervention',
                    'Individual reports generated for each profile',
                    'Portfolio-level summary and risk distribution',
                    'Bulk wallet deduction with per-report transparency',
                    'Download all reports in one consolidated export',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl overflow-hidden border border-slate-700">
                  <BulkReportsVisual />
                </div>
              </div>
              <div className="px-8 pb-8">
                <div className="bg-emerald-900/30 border border-emerald-800 rounded-xl p-4">
                  <p className="text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">Best For</p>
                  <p className="text-slate-300 text-sm">High-Volume DSAs · Loan Aggregators · Large CA Firms</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA strip */}
          <div className="mt-12 bg-slate-800 border border-slate-700 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Not sure which service fits your practice?</h3>
              <p className="text-slate-400 text-sm">Talk to our team — we&apos;ll help you pick the right data product for your workflow and client volume.</p>
            </div>
            <Link
              href="/contact"
              className="shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 text-sm whitespace-nowrap"
            >
              Talk to Our Team
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6 BENEFIT BLOCKS ── */}
      <section className="py-8 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-24">
          {benefits.map((benefit, i) => (
            <div key={i}>
              <FeatureBlock {...benefit} />
              {i < benefits.length - 1 && (
                <div className="mt-24 border-t border-slate-100" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6 lg:px-8 border-t border-slate-200 mt-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase text-center mb-4">HOW IT WORKS</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 text-center mb-16">Four steps to get started.</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Apply', desc: 'Submit your partner application with basic professional details.' },
              { step: '02', title: 'Get Approved', desc: 'Our team reviews and approves your application — typically within 24 hours.' },
              { step: '03', title: 'Recharge Wallet', desc: 'Add credits to your partner wallet. No minimum commitment required.' },
              { step: '04', title: 'Start Pulling Analysis', desc: 'Add clients and pull full financial analysis instantly from your dashboard.' },
            ].map((s, i) => (
              <div key={i} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-slate-200 z-0" style={{ width: 'calc(100% - 2rem)', left: '50%' }} />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mx-auto mb-4">
                    {s.step}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{s.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 DIFFERENTIATORS ── */}
      <section className="py-20 px-6 lg:px-8 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase text-center mb-4">WHY INSIGHT</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white text-center mb-16">Not just a report. Full intelligence.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                headline: 'Not just a report — full intelligence.',
                detail: 'We go beyond a credit score. Every analysis surfaces account-level signals, behavioral patterns, and risk flags with context your clients can understand.',
              },
              {
                headline: 'Pay as you go — no lock-in.',
                detail: 'Wallet-based pricing means you recharge what you need and use what you pay for. No monthly fees, no minimum commitments, no surprises.',
              },
              {
                headline: 'Built for volume — scales with your practice.',
                detail: 'Whether you serve 10 clients or 1,000, the platform handles it. Manage all profiles from one dashboard without any per-seat pricing.',
              },
            ].map((d, i) => (
              <div key={i} className="border border-slate-700 rounded-2xl p-8">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center mb-6">
                  <span className="text-white font-bold text-sm">{i + 1}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3 leading-snug">{d.headline}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{d.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING MESSAGE ── */}
      <section className="py-20 px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">PRICING</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Flexible. Transparent. No surprises.</h2>
          <p className="text-lg text-slate-500 leading-relaxed mb-4">
            Wallet-based pricing — recharge what you need, use what you pay for. Every analysis deducts a fixed number of credits from your wallet.
          </p>
          <p className="text-slate-400 text-base mb-10">
            For volume pricing or custom arrangements, reach out directly.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-base"
          >
            Contact Us for Volume Pricing
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 lg:px-8 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Ready to grow your practice<br />with better data?
          </h2>
          <p className="text-blue-100 text-lg mb-10 leading-relaxed">
            Join financial professionals who use Insight to deliver deeper analysis, faster decisions, and better outcomes for their clients.
          </p>
          <Link
            href="/become-a-partner"
            className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 font-bold px-10 py-4 rounded-xl transition-all duration-200 text-base shadow-sm"
          >
            Become a Partner
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
