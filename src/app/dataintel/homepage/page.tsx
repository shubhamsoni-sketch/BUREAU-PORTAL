'use client';
import Link from 'next/link';

import '../styles.css';
import DataIntelNav from '../components/DataIntelNav';
import DataIntelFooter from '../components/DataIntelFooter';

export default function DataIntelHomepage() {
  return (
    <div className="di-root di-scrollbar">
      <DataIntelNav />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden di-noise-overlay" style={{ position: 'relative' }}>
        <div className="absolute inset-0 di-data-grid-bg opacity-100" />
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none di-animate-pulse-glow" style={{ background: 'rgba(6,182,212,0.05)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none di-animate-pulse-glow" style={{ background: 'rgba(124,58,237,0.08)', filter: 'blur(100px)', animationDelay: '1.5s' }} />
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: 0.03 }}>
          <div className="w-full h-px di-animate-scan" style={{ background: 'linear-gradient(to right, transparent, #06b6d4, transparent)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ border: '1px solid rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.05)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-pulse" />
                <span className="text-xs font-semibold text-[#06b6d4] tracking-wide uppercase">Self-Serve Data Intelligence</span>
              </div>

              <h1 className="di-font-display di-display-xl font-semibold text-[#f1f5f9] leading-none">
                Turn raw data<br />
                into real{' '}
                <span className="relative inline-block">
                  <span className="di-text-gradient">decisions</span>
                </span>
                <span className="text-[#06b6d4]">.</span>
              </h1>

              <p className="text-lg text-[#94a3b8] max-w-lg leading-relaxed">
                Everything you need to process, analyze, segment, and act on data — in one system. Built for fintechs, professionals, and businesses that move fast.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/dataintel/sign-up-login"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-sm bg-[#06b6d4] text-[#080b14] hover:bg-[#22d3ee] transition-all duration-200"
                  style={{ boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
                >
                  See it live
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16} className="group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <a
                  href="#pipeline"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-sm border text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[rgba(6,182,212,0.4)] transition-all duration-200"
                  style={{ borderColor: '#334155' }}
                >
                  How it works
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </a>
              </div>

              <div className="flex flex-wrap gap-6 pt-4 text-xs text-[#64748b] font-medium">
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={14} height={14} className="text-[#06b6d4]">
                    <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                  Data never leaves your system
                </span>
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={14} height={14} className="text-[#a78bfa]">
                    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
                  </svg>
                  Crores of records. Seconds.
                </span>
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={14} height={14}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                  </svg>
                  Pay per use. No subscriptions.
                </span>
              </div>
            </div>

            {/* Right - Engine Visualization */}
            <div className="relative">
              <div className="relative rounded-2xl border overflow-hidden backdrop-blur-sm p-2" style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.5)' }}>
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b" style={{ borderColor: '#1e293b' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.6)' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(234,179,8,0.6)' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(34,197,94,0.6)' }} />
                  <span className="ml-3 text-xs text-[#64748b] di-font-mono">dataintel.engine — live</span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-[#06b6d4]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-pulse" />
                    Processing
                  </span>
                </div>

                <svg viewBox="0 0 600 420" className="w-full" style={{ maxHeight: 380 }} aria-label="Data flow visualization">
                  {/* Grid lines */}
                  {[0,52,104,156,208,260,312,364].map(y => (
                    <line key={`h${y}`} x1="0" y1={y} x2="600" y2={y} stroke="rgba(6,182,212,0.04)" strokeWidth="1" />
                  ))}
                  {[0,50,100,150,200,250,300,350,400,450,500,550].map(x => (
                    <line key={`v${x}`} x1={x} y1="0" x2={x} y2="420" stroke="rgba(6,182,212,0.04)" strokeWidth="1" />
                  ))}

                  {/* Scatter dots */}
                  {[
                    [10,60,1.5,'#06B6D4',0.3],[57,52,2.3,'#7C3AED',0.4],[86,35,3.1,'#94A3B8',0.5],
                    [107,22,1.5,'#06B6D4',0.6],[139,22,2.3,'#7C3AED',0.3],[188,36,3.1,'#94A3B8',0.4],
                    [232,53,1.5,'#06B6D4',0.5],[14,145,2.3,'#7C3AED',0.6],[35,137,3.1,'#94A3B8',0.3],
                    [71,120,1.5,'#06B6D4',0.4],[120,107,2.3,'#7C3AED',0.5],[162,107,3.1,'#94A3B8',0.6],
                    [186,121,1.5,'#06B6D4',0.3],[209,138,2.3,'#7C3AED',0.4],[3,230,3.1,'#94A3B8',0.5],
                    [52,222,1.5,'#06B6D4',0.6],[91,205,2.3,'#7C3AED',0.3],[114,192,3.1,'#94A3B8',0.4],
                    [138,192,1.5,'#06B6D4',0.5],[180,206,2.3,'#7C3AED',0.6],[229,223,3.1,'#94A3B8',0.3],
                    [20,315,1.5,'#06B6D4',0.4],[41,307,2.3,'#7C3AED',0.5],[68,289,3.1,'#94A3B8',0.6],
                    [112,277,1.5,'#06B6D4',0.3],[161,278,2.3,'#7C3AED',0.4],[193,292,3.1,'#94A3B8',0.5],
                    [214,308,1.5,'#06B6D4',0.6]
                  ].map(([cx,cy,r,fill,opacity], i) => (
                    <circle key={i} cx={cx as number} cy={cy as number} r={r as number} fill={fill as string} opacity={opacity as number} />
                  ))}

                  {/* Stream lines */}
                  {[
                    [0,30,400,80,1,'0s'],
                    [0,100,400,60,1.5,'0.4s'],
                    [0,170,400,140,2,'0.8s'],
                    [0,240,400,200,1,'1.2s'],
                    [20,310,400,260,1.5,'0.6s'],
                    [0,380,400,320,2,'1s']
                  ].map(([x1,y1,x2,y2,sw,delay], i) => (
                    <line
                      key={`s${i}`}
                      x1={x1 as number} y1={y1 as number} x2={x2 as number} y2={y2 as number}
                      stroke="url(#streamGrad)" strokeWidth={sw as number}
                      strokeDasharray="8 4" opacity="0.5"
                      style={{ animation: `di-data-flow-loop 2.5s linear infinite`, animationDelay: delay as string }}
                    />
                  ))}

                  {/* Convergence nodes */}
                  {[80,140,200,260,320].map((y, i) => (
                    <circle key={`n${i}`} cx={400} cy={y} r={i===2?8:i===3?6:4} fill="rgba(6,182,212,0.2)" stroke="#06B6D4" strokeWidth="1.5"
                      style={{ animation: `di-pulse-glow 2.5s ease-in-out infinite`, animationDelay: `${i*0.4}s` }}
                    />
                  ))}

                  {/* Converge lines */}
                  {[80,140,200,260,320].map((y, i) => (
                    <line key={`c${i}`} x1={400} y1={y} x2={520} y2={200} stroke="url(#convergeGrad)" strokeWidth="1.5" opacity="0.7" strokeDasharray="4 3"
                      style={{ animation: `di-data-flow-loop ${1.8+i*0.2}s linear infinite`, animationDelay: `${1.5+i*0.1}s` }}
                    />
                  ))}

                  {/* Central node */}
                  <circle cx={520} cy={200} r={28} fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.3)" strokeWidth="1" />
                  <circle cx={520} cy={200} r={18} fill="rgba(6,182,212,0.15)" stroke="#06B6D4" strokeWidth="1.5"
                    style={{ animation: 'di-pulse-glow 2s ease-in-out infinite' }}
                  />
                  <circle cx={520} cy={200} r={6} fill="#06B6D4" />

                  {/* Output lines */}
                  <line x1={548} y1={188} x2={590} y2={160} stroke="#06B6D4" strokeWidth="2" opacity="0.8" />
                  <line x1={548} y1={200} x2={590} y2={200} stroke="#06B6D4" strokeWidth="2" opacity="0.9" />
                  <line x1={548} y1={212} x2={590} y2={240} stroke="#06B6D4" strokeWidth="2" opacity="0.8" />

                  <text x={595} y={164} fill="#06B6D4" fontSize={8} fontFamily="DM Sans" opacity={0.8}>SEGMENT</text>
                  <text x={595} y={204} fill="#06B6D4" fontSize={8} fontFamily="DM Sans" opacity={0.9}>ACTION</text>
                  <text x={595} y={244} fill="#06B6D4" fontSize={8} fontFamily="DM Sans" opacity={0.8}>RESULT</text>

                  <text x={10} y={385} fill="#64748B" fontSize={9} fontFamily="DM Sans">RAW DATA</text>
                  <text x={360} y={385} fill="#94A3B8" fontSize={9} fontFamily="DM Sans">ANALYSIS</text>
                  <text x={490} y={385} fill="#06B6D4" fontSize={9} fontFamily="DM Sans">INTELLIGENCE</text>

                  <defs>
                    <linearGradient id="streamGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#64748B" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="convergeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: '#1e293b' }}>
                  <div className="flex items-center gap-4 text-xs text-[#64748b] di-font-mono">
                    <span className="text-[#06b6d4]">1,24,87,332</span>
                    <span>records processed</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-green-400 di-font-mono">0.8s avg</span>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 di-glass-dark rounded-xl px-4 py-3 flex items-center gap-3 di-animate-float">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={16} height={16} className="text-[#a78bfa]">
                    <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#f1f5f9]">Fully Offline</div>
                  <div className="text-xs text-[#64748b]">Data stays on your machine</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#64748b]">The problem</span>
                <h2 className="di-font-display di-display-md font-semibold text-[#f1f5f9]">
                  Data arrives as <span className="di-font-display italic text-[#94a3b8]">chaos.</span>
                </h2>
              </div>
              <div className="space-y-5 text-[#94a3b8] leading-relaxed">
                <p className="text-lg">You have the data. Lakhs of leads. Crores of records. Spreadsheets that no one can make sense of. Numbers with no context. Contacts that may not even be active.</p>
                <p className="text-base">Every hour spent cleaning, filtering, and second-guessing is an hour not spent making decisions. The data exists — but it doesn&apos;t work for you yet.</p>
                <p className="text-base">That&apos;s the gap DataIntel closes. Raw input. Structured intelligence. In one system.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  ['73%', 'avg time wasted on data prep'],
                  ['~40%', 'leads lost to bad contact data'],
                  ['3 in 5', 'of campaigns reach wrong audience'],
                  ['68%', 'decisions made on incomplete data'],
                ].map(([stat, label]) => (
                  <div key={stat} className="p-4 rounded-xl border" style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.5)' }}>
                    <div className="text-2xl di-font-display font-semibold text-[#94a3b8] mb-1">{stat}</div>
                    <div className="text-xs text-[#64748b] leading-tight">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chaos visualization */}
            <div className="relative h-80 lg:h-[420px] rounded-2xl border overflow-hidden" style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.3)' }}>
              <div className="absolute inset-0 di-data-grid-bg opacity-50" />
              {[
                ['8%','12%','-8deg','#94A3B8','94,231 leads'],
                ['55%','8%','3deg','#64748B','phone: 9876543210'],
                ['22%','28%','-3deg','#475569','NULL'],
                ['70%','22%','6deg','#94A3B8','CUST_ID_44821'],
                ['5%','45%','-5deg','#64748B','\u20b92,40,000 income'],
                ['40%','35%','2deg','#475569','duplicate row'],
                ['78%','40%','-4deg','#94A3B8','0000000000'],
                ['15%','60%','7deg','#64748B','loan_status: ???'],
                ['52%','55%','-6deg','#475569','WhatsApp: unknown'],
                ['82%','58%','4deg','#94A3B8','28 col CSV'],
                ['30%','72%','-2deg','#64748B','credit: N/A'],
                ['62%','70%','5deg','#475569','city: MUM/BOM/Mumbai'],
                ['8%','80%','-7deg','#94A3B8','5,00,000 rows'],
                ['45%','82%','3deg','#64748B','MISSING_DATA'],
                ['75%','78%','-5deg','#475569','format: unknown'],
              ].map(([left, top, rotate, color, text]) => (
                <div
                  key={text as string}
                  className="absolute di-font-mono select-none"
                  style={{ left, top, transform: `rotate(${rotate})`, color, fontSize: 11 }}
                >
                  {text}
                </div>
              ))}
              <div className="absolute bottom-0 inset-x-0 h-1/2" style={{ background: 'linear-gradient(to top, #0f172a, rgba(15,23,42,0.6), transparent)' }} />
              <div className="absolute bottom-0 inset-x-0 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(6,182,212,0.4))' }} />
                  <span className="text-xs text-[#06b6d4] di-font-mono uppercase tracking-wider">structure emerging</span>
                  <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(6,182,212,0.4))' }} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['ID','Profile','Score','Action'].map(col => (
                    <div key={col} className="h-6 rounded flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                      <span className="text-xs text-[#06b6d4] di-font-mono">{col}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Section */}
      <section id="pipeline" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, rgba(15,23,42,0.3), transparent)' }} />
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#64748b] block mb-3">The system</span>
            <h2 className="di-font-display di-display-md font-semibold text-[#f1f5f9] mb-4">
              One flow. Five engines.{' '}
              <span className="di-font-display italic di-text-gradient">Every decision.</span>
            </h2>
            <p className="text-[#94a3b8] text-lg leading-relaxed">DataIntel doesn&apos;t hand you tools. It runs a system. From the moment your data enters to the moment action is taken — every step is connected.</p>
          </div>

          {/* Pipeline steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4">
            {[
              { icon: 'database', label: 'Raw Data', num: '1', desc: 'Upload CSV, Excel, or connect source', sub: 'Lakhs to crores of records. Any format. Any state.' },
              { icon: 'search', label: 'Analysis', num: '2', desc: 'Deep profiling and pattern detection', sub: 'Financial profiles, WhatsApp activity, credit signals — extracted automatically.' },
              { icon: 'filter', label: 'Segmentation', num: '3', desc: 'Filter, classify, and structure', sub: 'Slice by 50+ criteria. Location, income band, loan intent, contact quality.' },
              { icon: 'bolt', label: 'Action', num: '4', desc: 'Campaign, route, or export', sub: 'Run WhatsApp campaigns, route to lenders, or export clean segments.' },
              { icon: 'chart', label: 'Result', num: '5', desc: 'Decisions made. Outcomes tracked.', sub: 'Every action tied to a measurable outcome. Close the loop.' },
            ].map((step, i) => (
              <div key={step.num} className="flex flex-col items-center gap-4 text-center">
                <div className="relative w-[104px] h-[104px] rounded-2xl border-2 flex flex-col items-center justify-center gap-2" style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.5)' }}>
                  <PipelineIcon icon={step.icon} />
                  <span className="text-xs font-semibold text-[#64748b]">{step.label}</span>
                  <span className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: '#1e293b', color: '#475569' }}>{step.num}</span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-[#94a3b8]">{step.desc}</div>
                  <div className="text-xs text-[#64748b] leading-relaxed">{step.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-[#94a3b8] mb-4 text-base">The entire pipeline runs in one session. No handoffs. No integrations. Just data in, decisions out.</p>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="relative py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-24">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#64748b] block mb-3">Five engines. One system.</span>
            <h2 className="di-font-display di-display-md font-semibold text-[#f1f5f9]">
              Each capability is a chapter<br />
              <span className="di-font-display italic di-text-gradient">in the same story.</span>
            </h2>
          </div>

          <div className="space-y-32">
            <CapabilityBlock
              num="01"
              color="#06B6D4"
              tag="Fintech Processing Engine"
              title="Upload leads. Get decisions."
              desc="Raw lead files go in. Deep financial profile analysis comes out. The engine segments every contact by loan eligibility, routes qualified leads to the right lenders, and triggers WhatsApp follow-ups — automatically."
              bullets={['Upload any CSV format','Profile 50+ financial signals','Route to 200+ lenders']}
              cta="Run a fintech analysis"
              reverse={false}
              visual={
                <FintechVisual />
              }
            />
            <CapabilityBlock
              num="02"
              color="#7C3AED"
              tag="Big Data Analysis Engine"
              title="1 crore records. Your machine. Your control."
              desc="The most powerful engine in the system runs entirely offline. No cloud upload. No data transfer. The analysis happens on your hardware — which means your data never touches an external server. Ever."
              bullets={['Works fully offline','Handles crores of records','Deep filter & segmentation']}
              cta="Analyze large datasets"
              reverse={true}
              visual={
                <BigDataVisual />
              }
            />
            <CapabilityBlock
              num="03"
              color="#22C55E"
              tag="WhatsApp Intelligence Engine"
              title="Know who's reachable before you send."
              desc="Bulk mobile numbers are checked for active WhatsApp presence before any campaign runs. Dead numbers, inactive accounts, and non-WhatsApp contacts are filtered out — reducing campaign waste and cost before the first message is sent."
              bullets={['Detect active WhatsApp presence','Filter non-reachable contacts','Cut campaign waste by ~60%']}
              cta="Filter your contact list"
              reverse={false}
              visual={
                <WhatsAppVisual />
              }
            />
            <CapabilityBlock
              num="04"
              color="#F59E0B"
              tag="Data & Marketing Engine"
              title="Location-precise. Campaign-ready."
              desc="Structured datasets by city, pin code, profession, and income band — ready for targeted outreach. Run campaigns directly from the engine or export clean segments for your own channels."
              bullets={['City + pincode targeting','Profession-based segmentation','Campaign execution built-in']}
              cta="Build a targeted campaign"
              reverse={true}
              visual={
                <MarketingVisual />
              }
            />
            <CapabilityBlock
              num="05"
              color="#818CF8"
              tag="Credit Intelligence"
              title="The full financial picture. Without the guesswork."
              desc="Detailed credit profile analysis that goes beyond a single number. Income patterns, obligation load, repayment history, and financial health signals — structured into a clear profile that supports real lending and advisory decisions."
              bullets={['Full financial profile','Income & obligation analysis','Decision-grade output']}
              cta="Analyze a credit profile"
              reverse={false}
              visual={
                <CreditVisual />
              }
            />
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'rgba(15,23,42,0.6)' }} />
        <div className="absolute inset-0 di-data-grid-bg opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#64748b] block mb-12">Data privacy. By design.</span>
          <h2 className="di-font-display di-trust-weight text-[#f1f5f9]" style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)', lineHeight: 1.0, letterSpacing: '-0.04em' }}>
            Your data never<br />leaves your system.
          </h2>
          <div className="mt-12 max-w-2xl mx-auto">
            <p className="text-xl text-[#94a3b8] leading-relaxed">The Big Data Analysis Engine runs entirely on your machine. No upload. No cloud processing. No third-party access. Your data is analyzed where it lives — and it stays there.</p>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {[
              ['Zero cloud upload', 'Analysis runs locally. Nothing is transmitted to external servers.'],
              ['No data retention', "We don't store your datasets. Session ends, data gone."],
              ['Auditable processing', 'Every transformation logged locally. Full traceability on your end.'],
            ].map(([title, desc]) => (
              <div key={title} className="text-left p-6 rounded-xl border" style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.4)' }}>
                <div className="text-base font-semibold text-[#f1f5f9] mb-2">{title}</div>
                <div className="text-sm text-[#64748b] leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-16 pt-12 border-t" style={{ borderColor: '#1e293b' }}>
            <p className="di-font-display italic text-[#94a3b8]" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)' }}>
              &ldquo;Built for industries where data sensitivity isn&apos;t optional.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Intent Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#64748b] block mb-4">What do you want to do?</span>
            <h2 className="di-font-display di-display-md font-semibold text-[#f1f5f9]">
              Tell us your goal.<br />
              <span className="di-font-display italic text-[#94a3b8]">We&apos;ll take you there.</span>
            </h2>
          </div>

          <div className="space-y-0">
            {[
              { text: 'I run a fintech and need to process lead data', engine: '\u2192 Fintech Processing Engine', tag: 'Fintech / DSA / NBFC', color: '#06B6D4' },
              { text: 'I have a large dataset and need to analyze it offline', engine: '\u2192 Big Data Analysis Engine', tag: 'Enterprise / Research / Analytics', color: '#7C3AED' },
              { text: 'I want to run WhatsApp campaigns on clean, verified contacts', engine: '\u2192 WhatsApp Intelligence Engine', tag: 'Marketers / Campaign Managers', color: '#22C55E' },
              { text: 'I need location-targeted data for outreach campaigns', engine: '\u2192 Data & Marketing Engine', tag: 'Sales Teams / Businesses', color: '#F59E0B' },
              { text: 'I want a detailed credit and financial profile analysis', engine: '\u2192 Credit Intelligence', tag: 'CA / Financial Advisor / Individual', color: '#818CF8' },
            ].map((item) => (
              <Link
                key={item.engine}
                href="/dataintel/sign-up-login"
                className="di-intent-option group flex items-center justify-between py-6 border-b cursor-pointer block"
                style={{ borderColor: '#1e293b' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-medium mb-1 text-[#94a3b8] group-hover:text-[#f1f5f9] transition-colors">{item.text}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: item.color }}>{item.engine}</span>
                    <span className="text-xs text-[#64748b] border rounded-full px-2 py-0.5" style={{ borderColor: '#1e293b' }}>{item.tag}</span>
                  </div>
                </div>
                <div className="shrink-0 ml-6 transition-all duration-200" style={{ color: item.color }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={20} height={20}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-sm text-[#64748b]">
            Not sure where to start?{' '}
            <Link href="/dataintel/sign-up-login" className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors underline underline-offset-2">Create a free account</Link>
            {' '}and explore all capabilities from your dashboard.
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 70%)' }} />
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative rounded-3xl border overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.6) 100%)', borderColor: '#1e293b' }}>
            <div className="absolute inset-0 di-data-grid-bg opacity-40" />
            <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #06b6d4, transparent)' }} />
            <div className="relative z-10 p-8 md:p-16 text-center">
              <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-8 mx-auto" style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={32} height={32} className="text-[#06b6d4]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                </svg>
              </div>
              <h2 className="di-font-display di-display-md font-semibold text-[#f1f5f9] mb-4">Start with ₹0. Pay for what you use.</h2>
              <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto mb-10 leading-relaxed">Create your account. Load wallet credits. Run your first analysis. No subscriptions, no commitments — just access to the system when you need it.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 text-sm text-[#94a3b8]">
                {['Create account','Add wallet credits','Run analysis','Get results'].map((step, i) => (
                  <>
                    <span key={step} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full text-[#06b6d4] text-xs font-bold flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.4)' }}>{i+1}</span>
                      {step}
                    </span>
                    {i < 3 && (
                      <svg key={`arrow${i}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={14} height={14} className="text-[#64748b] hidden sm:block">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    )}
                  </>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dataintel/sign-up-login"
                  className="group inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full font-semibold text-sm bg-[#06b6d4] text-[#080b14] hover:bg-[#22d3ee] transition-all"
                  style={{ boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
                >
                  Create free account
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16} className="group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/dataintel/pricing"
                  className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full font-semibold text-sm border text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[rgba(6,182,212,0.4)] transition-all"
                  style={{ borderColor: '#334155' }}
                >
                  View pricing
                </Link>
              </div>
              <p className="mt-6 text-xs text-[#64748b]">Demo mode available — try each engine with sample data before loading credits.</p>
            </div>
          </div>
        </div>
      </section>

      <DataIntelFooter />
    </div>
  );
}

function PipelineIcon({ icon }: { icon: string }) {
  const cls = "transition-colors";
  const color = "#475569";
  if (icon === 'database') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={28} height={28} className={cls}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
  if (icon === 'search') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={28} height={28} className={cls}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 15.75-2.489-2.489m0 0a3.375 3.375 0 1 0-4.773-4.773 3.375 3.375 0 0 0 4.774 4.774ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
  if (icon === 'filter') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={28} height={28} className={cls}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
    </svg>
  );
  if (icon === 'bolt') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={28} height={28} className={cls}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={28} height={28} className={cls}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

interface CapabilityBlockProps {
  num: string;
  color: string;
  tag: string;
  title: string;
  desc: string;
  bullets: string[];
  cta: string;
  reverse: boolean;
  visual: React.ReactNode;
}

function CapabilityBlock({ num, color, tag, title, desc, bullets, cta, reverse, visual }: CapabilityBlockProps) {
  return (
    <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reverse ? 'lg:grid-flow-dense' : ''}`}>
      <div className={`space-y-6 ${reverse ? 'lg:col-start-2' : ''}`}>
        <div className="flex items-center gap-3">
          <span className="di-font-mono text-xs font-bold" style={{ color }}>{num}</span>
          <div className="h-px w-8" style={{ background: color }} />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">{tag}</span>
        </div>
        <h3 className="di-font-display di-display-sm font-semibold text-[#f1f5f9] leading-tight">{title}</h3>
        <p className="text-[#94a3b8] leading-relaxed text-base">{desc}</p>
        <ul className="space-y-2">
          {bullets.map(b => (
            <li key={b} className="flex items-center gap-2.5 text-sm text-[#94a3b8]">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
              {b}
            </li>
          ))}
        </ul>
        <Link
          href="/dataintel/sign-up-login"
          className="inline-flex items-center gap-2 text-sm font-semibold group transition-colors"
          style={{ color }}
        >
          {cta}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={14} height={14} className="group-hover:translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
      <div className={reverse ? 'lg:col-start-1 lg:row-start-1' : ''}>
        {visual}
      </div>
    </div>
  );
}

function FintechVisual() {
  return (
    <div className="relative rounded-2xl border overflow-hidden p-6 min-h-[280px] flex flex-col justify-between" style={{ borderColor: '#06B6D425', background: 'radial-gradient(ellipse at 30% 30%, #06B6D408 0%, transparent 60%), rgba(15,23,42,0.6)' }}>
      <div className="absolute inset-0 di-data-grid-bg opacity-50" />
      <div className="relative z-10 w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: '#06B6D415', border: '1px solid #06B6D430' }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#06B6D4" width={28} height={28}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
        </svg>
      </div>
      <div className="relative z-10 space-y-2 flex-1">
        <div className="grid grid-cols-4 gap-2 text-xs di-font-mono text-[#64748b] mb-2 px-2">
          <span>ID</span><span>Profile</span><span>Grade</span><span>Action</span>
        </div>
        {[
          ['LD-00291','Self-employed','A+','Route →'],
          ['LD-00292','Salaried','B','Hold'],
          ['LD-00293','Business','A','Route →'],
          ['LD-00294','Freelancer','C','Review'],
        ].map(([id, profile, grade, action]) => (
          <div key={id} className="grid grid-cols-4 gap-2 text-xs di-font-mono px-2 py-1.5 rounded" style={{ background: 'rgba(30,41,59,0.5)' }}>
            <span className="text-[#64748b]">{id}</span>
            <span className="text-[#94a3b8]">{profile}</span>
            <span style={{ color: '#06B6D4' }}>{grade}</span>
            <span style={{ color: '#06B6D4' }}>{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BigDataVisual() {
  return (
    <div className="relative rounded-2xl border overflow-hidden p-6 min-h-[280px] flex flex-col justify-between" style={{ borderColor: '#7C3AED25', background: 'radial-gradient(ellipse at 30% 30%, #7C3AED08 0%, transparent 60%), rgba(15,23,42,0.6)' }}>
      <div className="absolute inset-0 di-data-grid-bg opacity-50" />
      <div className="relative z-10 w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: '#7C3AED15', border: '1px solid #7C3AED30' }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#7C3AED" width={28} height={28}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
        </svg>
      </div>
      <div className="relative z-10 space-y-2 flex-1">
        <div className="text-xs di-font-mono text-[#64748b] mb-3">Processing 1,24,87,332 records — offline</div>
        <div className="flex items-end gap-1 h-20">
          {[45,62,38,75,55,80,48,70].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: 'linear-gradient(180deg, #7C3AED, rgba(124,58,237,0.5))' }} />
          ))}
        </div>
        <div className="flex justify-between text-xs di-font-mono text-[#64748b]">
          <span>0</span>
          <span style={{ color: '#7C3AED' }}>Segments: 14</span>
          <span>100%</span>
        </div>
      </div>
      <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: '#7C3AED20', color: '#7C3AED', border: '1px solid #7C3AED40' }}>Fully Offline</div>
    </div>
  );
}

function WhatsAppVisual() {
  return (
    <div className="relative rounded-2xl border overflow-hidden p-6 min-h-[280px] flex flex-col justify-between" style={{ borderColor: '#22C55E25', background: 'radial-gradient(ellipse at 30% 30%, #22C55E08 0%, transparent 60%), rgba(15,23,42,0.6)' }}>
      <div className="absolute inset-0 di-data-grid-bg opacity-50" />
      <div className="relative z-10 w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: '#22C55E15', border: '1px solid #22C55E30' }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#22C55E" width={28} height={28}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      </div>
      <div className="relative z-10 space-y-1.5 flex-1">
        {[
          ['98765*****', '\u25cf Active', '#22C55E'],
          ['87654*****', '\u25cb Inactive', '#EF4444'],
          ['76543*****', '\u25cf Active', '#22C55E'],
          ['65432*****', '\u25cb No WA', '#EF4444'],
          ['54321*****', '\u25cf Active', '#22C55E'],
        ].map(([num, status, color]) => (
          <div key={num} className="flex items-center justify-between text-xs di-font-mono px-2 py-1.5 rounded" style={{ background: 'rgba(30,41,59,0.5)' }}>
            <span className="text-[#64748b]">{num}</span>
            <span style={{ color }}>{status}</span>
          </div>
        ))}
        <div className="text-xs text-[#64748b] pt-1 px-2">
          3 / 5 reachable · <span style={{ color: '#22C55E' }}>Save ₹180 in waste</span>
        </div>
      </div>
    </div>
  );
}

function MarketingVisual() {
  return (
    <div className="relative rounded-2xl border overflow-hidden p-6 min-h-[280px] flex flex-col justify-between" style={{ borderColor: '#F59E0B25', background: 'radial-gradient(ellipse at 30% 30%, #F59E0B08 0%, transparent 60%), rgba(15,23,42,0.6)' }}>
      <div className="absolute inset-0 di-data-grid-bg opacity-50" />
      <div className="relative z-10 w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: '#F59E0B15', border: '1px solid #F59E0B30' }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#F59E0B" width={28} height={28}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      </div>
      <div className="relative z-10 space-y-2 flex-1">
        {[
          ['Mumbai · Salaried · 30-45', '14,231'],
          ['Pune · Business · 25-40', '8,441'],
          ['Delhi NCR · Freelancer', '11,892'],
        ].map(([label, count]) => (
          <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg border" style={{ borderColor: '#F59E0B25', background: '#F59E0B08' }}>
            <span className="text-xs text-[#94a3b8]">{label}</span>
            <span className="text-xs di-font-mono font-bold" style={{ color: '#F59E0B' }}>{count}</span>
          </div>
        ))}
        <div className="text-xs text-[#64748b] pt-1">
          Total: <span style={{ color: '#F59E0B' }}>34,564 contacts</span> · Campaign ready
        </div>
      </div>
    </div>
  );
}

function CreditVisual() {
  return (
    <div className="relative rounded-2xl border overflow-hidden p-6 min-h-[280px] flex flex-col justify-between" style={{ borderColor: '#818CF825', background: 'radial-gradient(ellipse at 30% 30%, #818CF808 0%, transparent 60%), rgba(15,23,42,0.6)' }}>
      <div className="absolute inset-0 di-data-grid-bg opacity-50" />
      <div className="relative z-10 w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: '#818CF815', border: '1px solid #818CF830' }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#818CF8" width={28} height={28}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      </div>
      <div className="relative z-10 space-y-3 flex-1">
        {[
          ['Income Stability', 82],
          ['Obligation Load', 38],
          ['Repayment Pattern', 91],
          ['Financial Health', 74],
        ].map(([label, value]) => (
          <div key={label as string}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#64748b]">{label}</span>
              <span style={{ color: '#818CF8' }}>{value}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: '#1e293b' }}>
              <div className="h-full rounded-full" style={{ width: `${value}%`, background: 'linear-gradient(90deg, #818CF8, rgba(129,140,248,0.5))' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
