'use client';

import React from 'react';
import Link from 'next/link';
import PublicNav from './components/PublicNav';
import PublicFooter from './components/PublicFooter';
import { ArrowRight } from 'lucide-react';

// Hero: Financial Intelligence Platform visual — no score, no ring
function DataToInsightIllustration() {
  return (
    <svg viewBox="0 0 520 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background card */}
      <rect x={20} y={10} width={480} height={340} rx={16} fill="white" />
      <rect x={20} y={10} width={480} height={340} rx={16} stroke="#E2E8F0" strokeWidth={1.5} />

      {/* Top bar */}
      <rect x={20} y={10} width={480} height={48} rx={16} fill="#F8FAFC" />
      <rect x={20} y={42} width={480} height={16} fill="#F8FAFC" />
      <rect x={20} y={57} width={480} height={1} fill="#E2E8F0" />
      <circle cx={44} cy={34} r={5} fill="#FCA5A5" />
      <circle cx={60} cy={34} r={5} fill="#FDE68A" />
      <circle cx={76} cy={34} r={5} fill="#86EFAC" />
      <text x={260} y={38} fill="#94A3B8" fontSize={9} fontFamily="system-ui" textAnchor="middle" fontWeight="500" letterSpacing={0.5}>Financial Health Report</text>

      {/* ── LEFT COLUMN: Behavior signal bars ── */}
      <text x={40} y={84} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui" letterSpacing={2} fontWeight="600">BEHAVIOR INDICATORS</text>

      {[
        { label: 'Payment Consistency', pct: 88, color: '#2563EB', tag: 'STRONG', tagBg: '#EFF6FF', tagColor: '#2563EB' },
        { label: 'Credit Utilization', pct: 62, color: '#F59E0B', tag: 'MODERATE', tagBg: '#FFFBEB', tagColor: '#D97706' },
        { label: 'Account Stability', pct: 74, color: '#2563EB', tag: 'HEALTHY', tagBg: '#EFF6FF', tagColor: '#2563EB' },
        { label: 'Enquiry Frequency', pct: 38, color: '#EF4444', tag: 'RISK', tagBg: '#FEF2F2', tagColor: '#DC2626' },
        { label: 'Credit Diversity', pct: 80, color: '#2563EB', tag: 'STRONG', tagBg: '#EFF6FF', tagColor: '#2563EB' },
      ]?.map((row, i) => (
        <g key={i}>
          <rect x={30} y={96 + i * 38} width={190} height={28} rx={5} fill={i % 2 === 0 ? '#FAFAFA' : 'white'} />
          <text x={40} y={113 + i * 38} fill="#475569" fontSize={8} fontFamily="system-ui">{row.label}</text>
          <rect x={40} y={117 + i * 38} width={130} height={3.5} rx={2} fill="#F1F5F9" />
          <rect x={40} y={117 + i * 38} width={130 * row.pct / 100} height={3.5} rx={2} fill={row.color} opacity={0.8} />
          <rect x={176} y={103 + i * 38} width={44} height={14} rx={3} fill={row.tagBg} />
          <text x={198} y={113 + i * 38} fill={row.tagColor} fontSize={6.5} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{row.tag}</text>
        </g>
      ))}

      {/* Divider */}
      <line x1={238} y1={76} x2={238} y2={310} stroke="#F1F5F9" strokeWidth={1.5} />

      {/* ── RIGHT COLUMN: Signal feed ── */}
      <text x={254} y={84} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui" letterSpacing={2} fontWeight="600">LIVE SIGNAL FEED</text>

      {/* Signal waveform */}
      <polyline
        points="254,160 274,148 294,155 314,132 334,142 354,118 374,128 394,110 414,120 434,105 454,114 474,100"
        stroke="#2563EB" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <polyline
        points="254,165 274,162 294,168 314,158 334,163 354,155 374,160 394,152 414,158 434,150 454,155 474,148"
        stroke="#CBD5E1" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3"
      />

      {/* Annotated signal events */}
      <circle cx={314} cy={132} r={4.5} fill="#F59E0B" />
      <line x1={314} y1={127} x2={314} y2={104} stroke="#F59E0B" strokeWidth={1} opacity={0.5} />
      <rect x={278} y={88} width={72} height={18} rx={3} fill="#FFFBEB" stroke="#FDE68A" strokeWidth={1} />
      <text x={314} y={100} fill="#D97706" fontSize={7.5} fontFamily="system-ui" textAnchor="middle" fontWeight="700">PATTERN</text>

      <circle cx={394} cy={110} r={4.5} fill="#EF4444" opacity={0.9} />
      <line x1={394} y1={105} x2={394} y2={82} stroke="#EF4444" strokeWidth={1} opacity={0.4} />
      <rect x={356} y={66} width={76} height={18} rx={3} fill="#FEF2F2" stroke="#FECACA" strokeWidth={1} />
      <text x={394} y={78} fill="#DC2626" fontSize={7.5} fontFamily="system-ui" textAnchor="middle" fontWeight="700">ANOMALY</text>

      <circle cx={354} cy={118} r={5} fill="#2563EB" />
      <line x1={354} y1={113} x2={354} y2={90} stroke="#2563EB" strokeWidth={1} opacity={0.4} />
      <rect x={330} y={74} width={48} height={18} rx={3} fill="#DBEAFE" stroke="#93C5FD" strokeWidth={1} />
      <text x={354} y={86} fill="#1D4ED8" fontSize={7.5} fontFamily="system-ui" textAnchor="middle" fontWeight="700">RISK</text>

      {/* Signal event log */}
      <text x={254} y={196} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui" letterSpacing={2} fontWeight="600">DETECTED EVENTS</text>
      {[
        { dot: '#EF4444', text: 'Enquiry spike — 4 pulls in 12 days', time: '2d ago' },
        { dot: '#F59E0B', text: 'Utilization rising — 3 consecutive months', time: '5d ago' },
        { dot: '#2563EB', text: 'New unsecured account opened', time: '8d ago' },
        { dot: '#22C55E', text: 'On-time payment streak — 18 months', time: '12d ago' },
      ]?.map((ev, i) => (
        <g key={i}>
          <rect x={254} y={204 + i * 26} width={220} height={20} rx={4} fill={i % 2 === 0 ? '#FAFAFA' : 'white'} />
          <circle cx={264} cy={214 + i * 26} r={3.5} fill={ev.dot} opacity={0.85} />
          <text x={274} y={218 + i * 26} fill="#475569" fontSize={7.5} fontFamily="system-ui">{ev.text}</text>
          <text x={464} y={218 + i * 26} fill="#CBD5E1" fontSize={7} fontFamily="system-ui" textAnchor="end">{ev.time}</text>
        </g>
      ))}

      {/* Bottom summary bar */}
      <rect x={20} y={310} width={480} height={40} rx={16} fill="#F8FAFC" />
      <rect x={20} y={310} width={480} height={20} fill="#F8FAFC" />
      <rect x={20} y={309} width={480} height={1} fill="#E2E8F0" />
      <circle cx={246} cy={330} r={3.5} fill="#EF4444" opacity={0.8} />
      <text x={254} y={334} fill="#64748B" fontSize={7.5} fontFamily="system-ui">2 risk signals detected</text>
      <circle cx={360} cy={330} r={3.5} fill="#22C55E" opacity={0.8} />
      <text x={368} y={334} fill="#64748B" fontSize={7.5} fontFamily="system-ui">3 improvements available</text>
      <circle cx={466} cy={330} r={3.5} fill="#2563EB" opacity={0.8} />
      <text x={474} y={334} fill="#64748B" fontSize={7.5} fontFamily="system-ui">Live</text>
    </svg>
  );
}

// Solution section: annotated signal pattern chart
function SignalPatternIllustration() {
  return (
    <svg viewBox="0 0 460 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* ── Background card ── */}
      <rect x={0} y={0} width={460} height={280} rx={12} fill="#F8FAFC" stroke="#E2E8F0" strokeWidth={1} />

      {/* ── Header bar ── */}
      <rect x={0} y={0} width={460} height={36} rx={12} fill="#EFF6FF" />
      <rect x={0} y={24} width={460} height={12} fill="#EFF6FF" />
      <circle cx={18} cy={18} r={5} fill="#BFDBFE" />
      <circle cx={32} cy={18} r={5} fill="#BFDBFE" />
      <circle cx={46} cy={18} r={5} fill="#BFDBFE" />
      <text x={230} y={23} fill="#2563EB" fontSize={9} fontFamily="system-ui" textAnchor="middle" fontWeight="700" letterSpacing={1.5}>FINANCIAL INTELLIGENCE REPORT</text>

      {/* ══════════════════════════════════════════════════
          QUADRANT 1 (top-left): RISK SIGNALS
      ══════════════════════════════════════════════════ */}
      <rect x={10} y={46} width={215} height={105} rx={6} fill="white" stroke="#F1F5F9" strokeWidth={1} />
      {/* Label */}
      <rect x={18} y={54} width={8} height={8} rx={1.5} fill="#EF4444" />
      <text x={30} y={62} fill="#1E293B" fontSize={8} fontFamily="system-ui" fontWeight="700" letterSpacing={0.5}>RISK SIGNALS</text>

      {/* Signal waveform */}
      <polyline
        points="18,110 38,100 58,106 78,88 98,95 118,78 138,86 158,70 178,78 198,65 215,62"
        stroke="#EF4444" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Baseline */}
      <line x1={18} y1={100} x2={215} y2={100} stroke="#E2E8F0" strokeWidth={1} strokeDasharray="4 3" />

      {/* Anomaly pin */}
      <circle cx={78} cy={88} r={3.5} fill="#EF4444" />
      <line x1={78} y1={84} x2={78} y2={74} stroke="#EF4444" strokeWidth={1} opacity={0.5} />
      <rect x={58} y={64} width={40} height={13} rx={2.5} fill="#FEF2F2" stroke="#FECACA" strokeWidth={0.8} />
      <text x={78} y={73} fill="#DC2626" fontSize={6.5} fontFamily="system-ui" textAnchor="middle" fontWeight="700">ANOMALY</text>

      {/* Risk pin */}
      <circle cx={138} cy={86} r={3.5} fill="#F59E0B" />
      <line x1={138} y1={82} x2={138} y2={72} stroke="#F59E0B" strokeWidth={1} opacity={0.5} />
      <rect x={118} y={62} width={38} height={13} rx={2.5} fill="#FFFBEB" stroke="#FDE68A" strokeWidth={0.8} />
      <text x={137} y={71} fill="#D97706" fontSize={6.5} fontFamily="system-ui" textAnchor="middle" fontWeight="700">PATTERN</text>

      {/* Month labels */}
      {['Jan','Mar','May','Jul'].map((m, i) => (
        <text key={m} x={18 + i * 52} y={140} fill="#CBD5E1" fontSize={6.5} fontFamily="system-ui">{m}</text>
      ))}

      {/* ══════════════════════════════════════════════════
          QUADRANT 2 (top-right): BEHAVIOUR ANALYSIS
      ══════════════════════════════════════════════════ */}
      <rect x={235} y={46} width={215} height={105} rx={6} fill="white" stroke="#F1F5F9" strokeWidth={1} />
      <rect x={243} y={54} width={8} height={8} rx={1.5} fill="#8B5CF6" />
      <text x={255} y={62} fill="#1E293B" fontSize={8} fontFamily="system-ui" fontWeight="700" letterSpacing={0.5}>BEHAVIOUR ANALYSIS</text>

      {/* Behaviour bars */}
      {[
        { label: 'Repayment Trend', pct: 84, color: '#2563EB', tag: 'STRONG' },
        { label: 'Utilization Pattern', pct: 58, color: '#F59E0B', tag: 'MODERATE' },
        { label: 'Enquiry Velocity', pct: 32, color: '#EF4444', tag: 'HIGH RISK' },
      ].map((row, i) => (
        <g key={i}>
          <text x={243} y={80 + i * 22} fill="#64748B" fontSize={6.5} fontFamily="system-ui">{row.label}</text>
          <rect x={243} y={83 + i * 22} width={130} height={4} rx={2} fill="#F1F5F9" />
          <rect x={243} y={83 + i * 22} width={130 * row.pct / 100} height={4} rx={2} fill={row.color} opacity={0.85} />
          <rect x={380} y={76 + i * 22} width={62} height={13} rx={2.5}
            fill={row.color === '#EF4444' ? '#FEF2F2' : row.color === '#F59E0B' ? '#FFFBEB' : '#EFF6FF'}
          />
          <text x={411} y={85 + i * 22} fill={row.color} fontSize={6} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{row.tag}</text>
        </g>
      ))}

      {/* ══════════════════════════════════════════════════
          QUADRANT 3 (bottom-left): STRENGTH INDICATORS
      ══════════════════════════════════════════════════ */}
      <rect x={10} y={161} width={215} height={108} rx={6} fill="white" stroke="#F1F5F9" strokeWidth={1} />
      <rect x={18} y={169} width={8} height={8} rx={1.5} fill="#10B981" />
      <text x={30} y={177} fill="#1E293B" fontSize={8} fontFamily="system-ui" fontWeight="700" letterSpacing={0.5}>STRENGTH INDICATORS</text>

      {/* Radar-style polygon */}
      <polygon points="113,195 135,205 135,225 113,235 91,225 91,205" fill="#ECFDF5" stroke="#6EE7B7" strokeWidth={1} />
      <polygon points="113,200 128,208 128,222 113,230 98,222 98,208" fill="#D1FAE5" stroke="#34D399" strokeWidth={1} />
      <polygon points="113,205 122,211 122,219 113,225 104,219 104,211" fill="#A7F3D0" stroke="#10B981" strokeWidth={1.5} />
      <circle cx={113} cy={215} r={3} fill="#10B981" />

      {/* Strength labels around */}
      <text x={113} y={192} fill="#059669" fontSize={6} fontFamily="system-ui" textAnchor="middle" fontWeight="600">DEPTH</text>
      <text x={148} y={216} fill="#059669" fontSize={6} fontFamily="system-ui" textAnchor="middle" fontWeight="600">MIX</text>
      <text x={113} y={248} fill="#059669" fontSize={6} fontFamily="system-ui" textAnchor="middle" fontWeight="600">AGE</text>
      <text x={76} y={216} fill="#059669" fontSize={6} fontFamily="system-ui" textAnchor="middle" fontWeight="600">HISTORY</text>

      {/* Strength score chips */}
      <rect x={168} y={172} width={50} height={14} rx={3} fill="#ECFDF5" stroke="#6EE7B7" strokeWidth={0.8} />
      <text x={193} y={181} fill="#059669" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">STABLE</text>
      <rect x={168} y={192} width={50} height={14} rx={3} fill="#EFF6FF" stroke="#93C5FD" strokeWidth={0.8} />
      <text x={193} y={201} fill="#2563EB" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">HEALTHY</text>
      <rect x={168} y={212} width={50} height={14} rx={3} fill="#ECFDF5" stroke="#6EE7B7" strokeWidth={0.8} />
      <text x={193} y={221} fill="#059669" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">STRONG</text>

      {/* ══════════════════════════════════════════════════
          QUADRANT 4 (bottom-right): ACTIONABLE INSIGHTS
      ══════════════════════════════════════════════════ */}
      <rect x={235} y={161} width={215} height={108} rx={6} fill="white" stroke="#F1F5F9" strokeWidth={1} />
      <rect x={243} y={169} width={8} height={8} rx={1.5} fill="#2563EB" />
      <text x={255} y={177} fill="#1E293B" fontSize={8} fontFamily="system-ui" fontWeight="700" letterSpacing={0.5}>ACTIONABLE INSIGHTS</text>

      {/* Insight rows */}
      {[
        { icon: '↓', text: 'Reduce credit utilization below 30%', color: '#F59E0B', bg: '#FFFBEB' },
        { icon: '✓', text: 'Payment consistency is a key strength', color: '#10B981', bg: '#ECFDF5' },
        { icon: '!', text: 'Limit new enquiries for 90 days', color: '#EF4444', bg: '#FEF2F2' },
        { icon: '→', text: 'Diversify credit mix for better depth', color: '#2563EB', bg: '#EFF6FF' },
      ].map((row, i) => (
        <g key={i}>
          <rect x={243} y={183 + i * 20} width={199} height={16} rx={3} fill={row.bg} />
          <text x={252} y={194 + i * 20} fill={row.color} fontSize={8} fontFamily="system-ui" fontWeight="700">{row.icon}</text>
          <text x={264} y={194 + i * 20} fill="#475569" fontSize={6.5} fontFamily="system-ui">{row.text}</text>
        </g>
      ))}

      {/* ── Center dividers ── */}
      <line x1={228} y1={46} x2={228} y2={269} stroke="#E2E8F0" strokeWidth={1} />
      <line x1={10} y1={155} x2={450} y2={155} stroke="#E2E8F0" strokeWidth={1} />

      {/* ── Footer strip ── */}
      <rect x={0} y={269} width={460} height={11} rx={0} fill="#F1F5F9" />
      <rect x={0} y={269} width={460} height={5} fill="#F1F5F9" />
      <circle cx={20} cy={274} r={2.5} fill="#10B981" />
      <text x={27} y={277} fill="#94A3B8" fontSize={6} fontFamily="system-ui">Live Analysis</text>
      <text x={380} y={277} fill="#94A3B8" fontSize={6} fontFamily="system-ui">4 modules active</text>
    </svg>
  );
}

// Decision flow: DATA → SIGNALS → DECISION
function DecisionFlowIllustration() {
  return (
    <svg viewBox="0 0 560 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x={10} y={50} width={130} height={80} rx={8} fill="#F8FAFC" stroke="#E2E8F0" strokeWidth={1.5} />
      {[0,1,2,3,4]?.map((i) => (
        <rect key={i} x={26} y={66 + i*12} width={[60,45,72,38,55]?.[i]} height={3} rx={1.5} fill="#CBD5E1" opacity={0.7} />
      ))}
      <text x={75} y={148} fill="#94A3B8" fontSize={8} fontFamily="system-ui" textAnchor="middle" letterSpacing={2} fontWeight="600">DATA</text>
      <line x1={142} y1={90} x2={188} y2={90} stroke="#CBD5E1" strokeWidth={1.5} />
      <polygon points="186,86 194,90 186,94" fill="#CBD5E1" />
      <text x={165} y={82} fill="#94A3B8" fontSize={7} fontFamily="system-ui" textAnchor="middle" letterSpacing={1}>EXTRACT</text>
      <rect x={196} y={50} width={168} height={80} rx={8} fill="#EFF6FF" stroke="#BFDBFE" strokeWidth={1.5} />
      <polyline
        points="212,110 232,92 252,100 272,78 292,88 312,68 332,76 352,62"
        stroke="#2563EB" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <rect x={212} y={56} width={44} height={14} rx={2} fill="#FEF2F2" />
      <text x={234} y={66} fill="#DC2626" fontSize={6.5} fontFamily="system-ui" textAnchor="middle" fontWeight="600">ANOMALY</text>
      <rect x={262} y={56} width={38} height={14} rx={2} fill="#FFFBEB" />
      <text x={281} y={66} fill="#D97706" fontSize={6.5} fontFamily="system-ui" textAnchor="middle" fontWeight="600">PATTERN</text>
      <rect x={306} y={56} width={30} height={14} rx={2} fill="#DBEAFE" />
      <text x={321} y={66} fill="#1D4ED8" fontSize={6.5} fontFamily="system-ui" textAnchor="middle" fontWeight="600">RISK</text>
      <text x={280} y={148} fill="#2563EB" fontSize={8} fontFamily="system-ui" textAnchor="middle" letterSpacing={2} fontWeight="600">SIGNALS</text>
      <line x1={366} y1={90} x2={412} y2={90} stroke="#93C5FD" strokeWidth={1.5} />
      <polygon points="410,86 418,90 410,94" fill="#93C5FD" />
      <text x={389} y={82} fill="#93C5FD" fontSize={7} fontFamily="system-ui" textAnchor="middle" letterSpacing={1}>ANALYZE</text>
      <rect x={420} y={50} width={130} height={80} rx={8} fill="#2563EB" stroke="#2563EB" strokeWidth={1.5} />
      <circle cx={485} cy={82} r={14} fill="rgba(255,255,255,0.12)" />
      <polyline points="476,82 482,88 494,74" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x={485} y={148} fill="#2563EB" fontSize={8} fontFamily="system-ui" textAnchor="middle" letterSpacing={2} fontWeight="600">DECISION</text>
    </svg>
  );
}
// ── FEATURE BLOCK 1: Financial Profile Analysis
// Style: Horizontal metric bars with score badge — structured report feel
function FinancialProfileIllustration() {
  return (
    <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x={0} y={0} width={480} height={48} rx={0} fill="#F1F5F9" />
      <circle cx={24} cy={24} r={12} fill="#DBEAFE" />
      <text x={24} y={28} fill="#2563EB" fontSize={10} fontFamily="system-ui" textAnchor="middle" fontWeight="700">KR</text>
      <rect x={44} y={14} width={80} height={6} rx={3} fill="#CBD5E1" />
      <rect x={44} y={26} width={52} height={4} rx={2} fill="#E2E8F0" />
      <rect x={390} y={10} width={76} height={28} rx={6} fill="#DBEAFE" />
      <text x={428} y={28} fill="#2563EB" fontSize={9} fontFamily="system-ui" textAnchor="middle" fontWeight="600">PROFILE</text>
      <text x={0} y={72} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui" letterSpacing={2} fontWeight="600">CREDIT PROFILE BREAKDOWN</text>
      {[
        { label: 'Payment History', value: 88, color: '#2563EB', tag: 'STRONG' },
        { label: 'Credit Utilization', value: 62, color: '#F59E0B', tag: 'MODERATE' },
        { label: 'Account Age', value: 74, color: '#2563EB', tag: 'GOOD' },
        { label: 'Enquiry Frequency', value: 38, color: '#EF4444', tag: 'RISK' },
        { label: 'Credit Mix', value: 80, color: '#2563EB', tag: 'STRONG' },
      ]?.map((row, i) => (
        <g key={i}>
          <text x={0} y={96 + i * 38} fill="#475569" fontSize={9} fontFamily="system-ui">{row.label}</text>
          <rect x={0} y={102 + i * 38} width={320} height={5} rx={2.5} fill="#F1F5F9" />
          <rect x={0} y={102 + i * 38} width={320 * row.value / 100} height={5} rx={2.5} fill={row.color} opacity={0.75} />
          <rect x={330} y={96 + i * 38 - 10} width={60} height={16} rx={3} fill={row.color === '#EF4444' ? '#FEF2F2' : row.color === '#F59E0B' ? '#FFFBEB' : '#EFF6FF'} />
          <text x={360} y={96 + i * 38 + 2} fill={row.color} fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="600">{row.tag}</text>
        </g>
      ))}
      <line x1={0} y1={282} x2={480} y2={282} stroke="#E2E8F0" strokeWidth={1} />
      <text x={0} y={296} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui">2 risk factors identified · 3 improvement opportunities</text>
    </svg>
  );
}

// ── FEATURE BLOCK 2: Signal Detection Engine
// Style: Radial/scatter plot — distinct from bar chart above
function SignalDetectionIllustration() {
  const signals = [
    { cx: 240, cy: 150, r: 90, label: 'ANOMALY', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', desc: 'Enquiry spike — 4 in 12 days', angle: -40 },
    { cx: 240, cy: 150, r: 55, label: 'PATTERN', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', desc: 'Utilization climbing 3 months', angle: 80 },
    { cx: 240, cy: 150, r: 25, label: 'RISK', color: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD', desc: 'New unsecured credit opened', angle: 200 },
  ];
  return (
    <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <text x={0} y={14} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui" letterSpacing={2} fontWeight="600">SIGNAL DETECTION ENGINE</text>
      <circle cx={240} cy={155} r={110} stroke="#F1F5F9" strokeWidth={1} fill="none" />
      <circle cx={240} cy={155} r={75} stroke="#E2E8F0" strokeWidth={1} fill="none" strokeDasharray="4 4" />
      <circle cx={240} cy={155} r={40} stroke="#DBEAFE" strokeWidth={1} fill="none" strokeDasharray="3 3" />
      <circle cx={240} cy={155} r={4} fill="#2563EB" opacity={0.4} />
      {/* Scatter dots */}
      {[
        {x:310,y:80,c:'#EF4444'},{x:330,y:120,c:'#EF4444'},{x:290,y:65,c:'#EF4444'},
        {x:180,y:210,c:'#D97706'},{x:200,y:195,c:'#D97706'},
        {x:255,y:135,c:'#1D4ED8'},{x:265,y:148,c:'#1D4ED8'},
        {x:150,y:160,c:'#CBD5E1'},{x:340,y:200,c:'#CBD5E1'},{x:200,y:80,c:'#CBD5E1'},
        {x:280,y:230,c:'#CBD5E1'},{x:130,y:160,c:'#CBD5E1'},
      ].map((d,i)=>(
        <circle key={i} cx={d.x} cy={d.y} r={4} fill={d.c} opacity={0.7} />
      ))}
      {/* Labels */}
      <rect x={298} y={56} width={62} height={18} rx={3} fill="#FEF2F2" stroke="#FECACA" strokeWidth={1} />
      <text x={329} y={68} fill="#DC2626" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">ANOMALY</text>
      <rect x={148} y={218} width={58} height={18} rx={3} fill="#FFFBEB" stroke="#FDE68A" strokeWidth={1} />
      <text x={177} y={230} fill="#D97706" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">PATTERN</text>
      <rect x={248} y={118} width={40} height={18} rx={3} fill="#DBEAFE" stroke="#93C5FD" strokeWidth={1} />
      <text x={268} y={130} fill="#1D4ED8" fontSize={7} fontFamily="system-ui" textAnchor="middle" fontWeight="700">RISK</text>
      {/* Legend */}
      <circle cx={8} cy={282} r={4} fill="#EF4444" opacity={0.7} />
      <text x={16} y={286} fill="#64748B" fontSize={7.5} fontFamily="system-ui">Anomaly cluster</text>
      <circle cx={110} cy={282} r={4} fill="#D97706" opacity={0.7} />
      <text x={118} y={286} fill="#64748B" fontSize={7.5} fontFamily="system-ui">Pattern group</text>
      <circle cx={210} cy={282} r={4} fill="#1D4ED8" opacity={0.7} />
      <text x={218} y={286} fill="#64748B" fontSize={7.5} fontFamily="system-ui">Risk signal</text>
    </svg>
  );
}

// ── FEATURE BLOCK 3: Decision Insights
// Style: Structured report card with verdict + ranked findings
function DecisionInsightsIllustration() {
  return (
    <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <text x={0} y={14} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui" letterSpacing={2} fontWeight="600">DECISION INSIGHTS REPORT</text>
      <rect x={0} y={24} width={480} height={52} rx={6} fill="#EFF6FF" />
      <text x={16} y={44} fill="#1D4ED8" fontSize={9} fontFamily="system-ui" fontWeight="700" letterSpacing={0.5}>OVERALL ASSESSMENT</text>
      <text x={16} y={62} fill="#2563EB" fontSize={13} fontFamily="system-ui" fontWeight="700">Moderate-High Creditworthiness</text>
      <rect x={380} y={34} width={84} height={24} rx={4} fill="#2563EB" />
      <text x={422} y={50} fill="white" fontSize={9} fontFamily="system-ui" textAnchor="middle" fontWeight="600">ASSESSED</text>
      <text x={0} y={100} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui" letterSpacing={2} fontWeight="600">KEY FINDINGS</text>
      {[
        { icon: '↑', label: 'Payment consistency is your strongest asset', sentiment: 'positive' },
        { icon: '!', label: 'High enquiry rate signals financial stress to lenders', sentiment: 'negative' },
        { icon: '→', label: 'Reducing utilization below 30% will improve score', sentiment: 'neutral' },
        { icon: '↑', label: 'Long account history adds stability to your profile', sentiment: 'positive' },
      ]?.map((item, i) => {
        const colors: Record<string, { bg: string; text: string; icon: string }> = {
          positive: { bg: '#F0FDF4', text: '#166534', icon: '#22C55E' },
          negative: { bg: '#FEF2F2', text: '#991B1B', icon: '#EF4444' },
          neutral: { bg: '#EFF6FF', text: '#1D4ED8', icon: '#2563EB' },
        };
        const c = colors[item.sentiment];
        return (
          <g key={i}>
            <rect x={0} y={110 + i * 40} width={480} height={32} rx={4} fill={c.bg} opacity={0.7} />
            <circle cx={16} cy={126 + i * 40} r={8} fill={c.icon} opacity={0.15} />
            <text x={16} y={130 + i * 40} fill={c.icon} fontSize={9} fontFamily="system-ui" textAnchor="middle" fontWeight="700">{item.icon}</text>
            <text x={32} y={130 + i * 40} fill={c.text} fontSize={8.5} fontFamily="system-ui">{item.label}</text>
          </g>
        );
      })}
      <line x1={0} y1={278} x2={480} y2={278} stroke="#E2E8F0" strokeWidth={1} />
      <text x={0} y={294} fill="#94A3B8" fontSize={7.5} fontFamily="system-ui">Next step: Reduce credit enquiries · Wait 3 months · Apply for secured card</text>
    </svg>
  );
}

// ── FEATURE BLOCK 4: Partner Program (Value Proposition Layout)
function PartnerProgramSection() {
  return (
    <div className="w-full">
      {/* Headline */}
      <div className="mb-10">
        <span className="text-[10px] font-semibold tracking-widest text-slate-300 uppercase mb-3">04</span>
        {/* FOR PROFESSIONALS badge */}
        <div className="mt-2 mb-3 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
          <div className="w-1 h-1 rounded-full bg-blue-500" />
          <span className="text-[10px] font-semibold tracking-widest text-blue-600 uppercase">For Professionals</span>
        </div>
        {/* Highlighted heading */}
        <h3 className="text-2xl lg:text-3xl font-bold mt-1 mb-3 leading-tight tracking-tight">
          <span
            className="relative inline-block"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Partner Program
            <span
              className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full"
              style={{ background: 'linear-gradient(90deg, #2563EB, #60A5FA)', opacity: 0.5 }}
            />
          </span>
        </h3>
        <p className="text-blue-600 text-sm font-medium mb-1 leading-snug">
          Grow your practice with a platform built for professionals.
        </p>
        <p className="text-slate-500 text-sm leading-relaxed">
          Built for DSAs, CAs, and financial advisors who work at scale.
        </p>
      </div>

      {/* Split layout: left pillars + right benefits */}
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mb-10">
        {/* Left: 3 Growth Pillars */}
        <div className="space-y-7">
          {[
            {
              num: '01',
              title: 'Pull reports for clients',
              body: 'Run financial analysis for your entire client base from one place.',
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="2" width="14" height="16" rx="2" stroke="#2563EB" strokeWidth="1.5" />
                  <path d="M6 7h8M6 10h8M6 13h5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              num: '02',
              title: 'Wallet-based flexibility',
              body: 'Pay only for what you use — no monthly commitment.',
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="5" width="16" height="11" rx="2" stroke="#2563EB" strokeWidth="1.5" />
                  <path d="M14 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z" fill="#2563EB" stroke="#2563EB" strokeWidth="1" />
                  <path d="M2 8h16" stroke="#2563EB" strokeWidth="1.5" />
                </svg>
              ),
            },
            {
              num: '03',
              title: 'Grow without limits',
              body: 'The more clients you serve, the more value you generate.',
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 13l3.5-3.5 2.5 2.5 3-4 3 2" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="17" cy="5" r="2" stroke="#2563EB" strokeWidth="1.5" />
                </svg>
              ),
            },
          ].map((pillar, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                {pillar.icon}
              </div>
              <div>
                <span className="text-[10px] font-semibold tracking-widest text-slate-300 uppercase block mb-1">{pillar.num}</span>
                <p className="text-slate-900 font-semibold text-sm mb-1 leading-snug">{pillar.title}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{pillar.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right: 4 Benefit Callouts — premium card layout */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="9" cy="9" r="7" stroke="#2563EB" strokeWidth="1.5" />
                    <path d="M9 5v4l2.5 2.5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                label: 'Faster Analysis',
                desc: 'Deliver insights to clients in minutes',
                accent: 'from-blue-50 to-indigo-50',
                iconBg: 'bg-blue-100',
                border: 'border-blue-100',
                bar: 'bg-blue-500',
                offset: false,
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 2C5.13 2 2 5.13 2 9s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7Z" stroke="#2563EB" strokeWidth="1.5" />
                    <path d="M6 9l2 2 4-4" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                label: 'More Clients',
                desc: 'Manage unlimited client profiles',
                accent: 'from-violet-50 to-purple-50',
                iconBg: 'bg-violet-100',
                border: 'border-violet-100',
                bar: 'bg-violet-500',
                offset: true,
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 13l3.5-3.5 2.5 2.5 3-4 3 2" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="2" y="2" width="14" height="14" rx="3" stroke="#2563EB" strokeWidth="1.5" />
                  </svg>
                ),
                label: 'Better Margins',
                desc: 'Pay per use — no wasted spend',
                accent: 'from-emerald-50 to-teal-50',
                iconBg: 'bg-emerald-100',
                border: 'border-emerald-100',
                bar: 'bg-emerald-500',
                offset: false,
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 14V8M8 14V5M12 14V9M16 14V3" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                label: 'Scale Ready',
                desc: 'Built to grow as your practice grows',
                accent: 'from-amber-50 to-orange-50',
                iconBg: 'bg-amber-100',
                border: 'border-amber-100',
                bar: 'bg-amber-500',
                offset: true,
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className={`relative bg-gradient-to-br ${benefit.accent} border ${benefit.border} rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow duration-200 group ${benefit.offset ? 'mt-6' : ''}`}
              >
                {/* Top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${benefit.bar} opacity-60 rounded-t-2xl`} />
                {/* Icon badge */}
                <div className={`w-10 h-10 rounded-xl ${benefit.iconBg} flex items-center justify-center shadow-sm`}>
                  {benefit.icon}
                </div>
                {/* Text */}
                <div>
                  <p className="text-slate-900 font-bold text-sm mb-1 tracking-tight">{benefit.label}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center mb-8">
        <Link
          href="/become-a-partner"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors duration-200 group"
        >
          Become a Partner
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>
    </div>
  );
}

const featureBlocks = [
  {
    id: 'financial-profile',
    tag: '01',
    title: 'Financial Profile Analysis',
    description: 'Every account, enquiry, and payment mapped into a structured profile — not just a number.',
    detail: 'We break down your credit report into 5 weighted dimensions: payment history, utilization, account age, enquiry frequency, and credit mix. Each dimension is scored, labeled, and explained.',
    illustration: <FinancialProfileIllustration />,
    reverse: false,
    aspect: 'aspect-[8/5]',
    custom: false,
  },
  {
    id: 'signal-detection',
    tag: '02',
    title: 'Signal Detection Engine',
    description: 'Behavioral patterns and risk signals extracted automatically from raw bureau data.',
    detail: 'Our engine scans for anomalies, recurring patterns, and risk indicators that a standard score ignores — surfaced as a live signal feed with timestamps and context.',
    illustration: <SignalDetectionIllustration />,
    reverse: true,
    aspect: 'aspect-square',
    custom: false,
  },
  {
    id: 'decision-insights',
    tag: '03',
    title: 'Decision Insights',
    description: 'Structured findings that tell you what to do next — not just where you stand.',
    detail: 'Each analysis produces a ranked list of findings: what\'s working, what\'s hurting you, and the exact steps to improve. Prioritized by impact, written in plain language.',
    illustration: <DecisionInsightsIllustration />,
    reverse: false,
    aspect: 'aspect-[8/5]',
    custom: false,
  },
  {
    id: 'partner-system',
    tag: '04',
    title: 'Partner Program',
    description: '',
    detail: '',
    illustration: null,
    reverse: false,
    aspect: '',
    custom: true,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <PublicNav />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="pt-20 pb-10 lg:pt-28 lg:pb-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-slate-400 text-xs font-medium tracking-widest uppercase">Financial Intelligence Platform</span>
              </div>
              <h1 className="text-4xl lg:text-5xl xl:text-[3.4rem] font-bold text-slate-900 leading-[1.1] tracking-tight mb-4">
                Understand your data.<br />
                <span className="text-blue-600">Act with clarity.</span>
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed mb-7 max-w-md">
                For individuals who want clarity. For partners who need scale. One platform, built for both.
              </p>
              <Link
                href="/get-analysis"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors duration-200 group"
              >
                Analyze My Profile
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
            </div>
            <div className="mt-8 lg:mt-0">
              <div className="aspect-[4/3] flex items-center justify-center">
                <DataToInsightIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROBLEM — prose ──────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-9 lg:py-12">
        <p className="text-slate-500 text-xl lg:text-2xl leading-[1.85] text-center font-light">
          Most financial decisions are made on incomplete data. A score tells you where you stand — not why, or what comes next. The signals that actually matter stay hidden.
        </p>
      </div>

      {/* ─── SHIFT MOMENT ─────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-6 lg:py-9 text-center">
        <p className="text-3xl lg:text-4xl font-semibold text-slate-800 leading-[1.25] tracking-tight">
          What if the number<br />
          <span className="text-blue-600">isn&apos;t the story?</span>
        </p>
      </div>

      {/* ─── SOLUTION — split layout ──────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-9 lg:py-14">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">
              We read between<br />the lines.
            </h2>
            <p className="text-slate-500 text-base leading-relaxed mb-7">
              Our intelligence engine surfaces what a score never could — the patterns, behaviors, and signals that define your true financial position.
            </p>
            <ul className="space-y-3">
              {[
                { label: 'Risk Signals', text: 'Hidden patterns affecting your financial profile' },
                { label: 'Behavior Analysis', text: 'Repayment and usage trends over time' },
                { label: 'Strength Indicators', text: 'Depth and stability beyond the surface number' },
                { label: 'Actionable Insights', text: 'Clear next steps, not raw data' },
              ]?.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-2.5 flex-shrink-0" />
                  <div>
                    <span className="text-slate-800 font-semibold text-sm">{item?.label}</span>
                    <span className="text-slate-400 text-sm ml-2">— {item?.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 lg:mt-0">
            <div className="aspect-[5/3]">
              <SignalPatternIllustration />
            </div>
          </div>
        </div>
      </div>

      {/* ─── TRANSITION LINE ──────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-200" />
          <p className="text-slate-400 text-sm font-medium tracking-wide whitespace-nowrap">
            Here&apos;s what actually powers that intelligence.
          </p>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      </div>

      {/* ─── FEATURE SHOWCASE ─────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-6 pb-4">
        <div className="mb-12">
          {/* Label row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-blue-500" />
              <div className="w-1 h-1 rounded-full bg-blue-400 opacity-60" />
              <div className="w-1 h-1 rounded-full bg-blue-300 opacity-30" />
            </div>
            <p className="text-[10px] font-semibold tracking-widest text-blue-500 uppercase">Product Depth</p>
          </div>

          {/* Highlighted heading */}
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight max-w-2xl">
            <span className="text-slate-900">Built for </span>
            <span
              className="relative inline-block"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 60%, #0EA5E9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              every layer
            </span>
            <span className="text-slate-900"> of </span>
            <span className="relative">
              <span className="relative z-10 text-slate-900">financial intelligence</span>
              <span
                className="absolute bottom-0 left-0 right-0 h-[6px] -z-0 rounded-sm opacity-20"
                style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }}
              />
            </span>
            <span className="text-slate-400">.</span>
          </h2>

          {/* Subtext */}
          <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-lg">
            Four precision-built modules. Each one designed to surface what a score never could.
          </p>

          {/* Decorative rule */}
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px w-10 bg-blue-500 opacity-60" />
            <div className="h-px w-4 bg-blue-400 opacity-30" />
            <div className="h-px w-2 bg-blue-300 opacity-20" />
          </div>
        </div>

        <div className="space-y-18 lg:space-y-24">
          {featureBlocks.map((block) => (
            block.custom ? (
              <div key={block.id}>
                <PartnerProgramSection />
              </div>
            ) : (
            <div
              key={block.id}
              className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${block.reverse ? 'lg:[direction:rtl]' : ''}`}
            >
              {/* Text side */}
              <div className={block.reverse ? 'lg:[direction:ltr]' : ''}>
                <span className="text-[10px] font-semibold tracking-widest text-slate-300 uppercase">{block.tag}</span>
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2 mb-3 leading-tight tracking-tight">
                  {block.title}
                </h3>
                <p className="text-blue-600 text-sm font-medium mb-3 leading-snug">
                  {block.description}
                </p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {block.detail}
                </p>
              </div>

              {/* Visual side */}
              <div className={`mt-6 lg:mt-0 ${block.reverse ? 'lg:[direction:ltr]' : ''}`}>
                <div className={block.aspect}>
                  {block.illustration}
                </div>
              </div>
            </div>
            )
          ))}
        </div>
      </div>

      {/* ─── FINAL CTA ────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-10 lg:py-14 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">
          See the full picture.
        </h2>
        <p className="text-slate-400 text-base mb-7 leading-relaxed">
          One analysis. Complete clarity.
        </p>
        <Link
          href="/get-analysis"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-lg text-sm transition-colors duration-200 group"
        >
          Start Your Analysis
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>

      <PublicFooter />
    </div>
  );
}
