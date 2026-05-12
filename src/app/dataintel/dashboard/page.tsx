'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import '../styles.css';

const engines = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    id: 'fintech',
    label: 'Fintech Processing',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
      </svg>
    ),
  },
  {
    id: 'bigdata',
    label: 'Big Data Analysis',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
      </svg>
    ),
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Intelligence',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    id: 'marketing',
    label: 'Data & Marketing',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
  },
  {
    id: 'credit',
    label: 'Credit Intelligence',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
];

const engineColors: Record<string, string> = {
  fintech: '#06B6D4',
  bigdata: '#7C3AED',
  whatsapp: '#22C55E',
  marketing: '#F59E0B',
  credit: '#818CF8',
};

const recentActivity = [
  { engine: 'Fintech Processing', action: 'Processed 4,231 leads', time: '2 hours ago', color: '#06B6D4' },
  { engine: 'WhatsApp Intelligence', action: 'Verified 12,000 numbers', time: '5 hours ago', color: '#22C55E' },
  { engine: 'Big Data Analysis', action: 'Segmented 1.2L records', time: 'Yesterday', color: '#7C3AED' },
  { engine: 'Credit Intelligence', action: '3 profiles analyzed', time: '2 days ago', color: '#818CF8' },
];

const engineCards = [
  { id: 'fintech', name: 'Fintech Processing', desc: 'Upload lead file \u2192 profile \u2192 route', rate: '\u20b92 / record', status: 'Ready', color: '#06B6D4' },
  { id: 'bigdata', name: 'Big Data Analysis', desc: 'Analyze crores of records offline', rate: '\u20b90.50 / 1000 records', status: 'Offline engine', color: '#7C3AED' },
  { id: 'whatsapp', name: 'WhatsApp Intelligence', desc: 'Verify bulk numbers for WA activity', rate: '\u20b90.10 / number', status: 'Ready', color: '#22C55E' },
  { id: 'marketing', name: 'Data & Marketing', desc: 'Location-targeted campaign datasets', rate: '\u20b95 / 1000 contacts', status: 'Ready', color: '#F59E0B' },
  { id: 'credit', name: 'Credit Intelligence', desc: 'Full financial profile analysis', rate: '\u20b915 / report', status: 'Ready', color: '#818CF8' },
];

export default function DashboardPage() {
  const [activeEngine, setActiveEngine] = useState('overview');

  return (
    <div className="di-root" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r shrink-0" style={{ borderColor: '#1e293b', background: '#080b14' }}>
        <div className="p-5 border-b" style={{ borderColor: '#1e293b' }}>
          <Link href="/dataintel" className="flex items-center gap-2.5">
            <Image src="/assets/images/credit-trust-logo.png" alt="Credit Trust Logo" width={28} height={28} />
            <span style={{ fontFamily: 'Fraunces, serif' }} className="text-base font-semibold text-[#f1f5f9]">DataIntel</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {engines.map((engine) => (
            <button
              key={engine.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
              style={{
                background: activeEngine === engine.id ? 'linear-gradient(90deg, rgba(6,182,212,0.15), transparent)' : 'transparent',
                borderLeft: activeEngine === engine.id ? '2px solid #06b6d4' : '2px solid transparent',
                color: activeEngine === engine.id ? '#06b6d4' : '#64748b',
              }}
              onClick={() => setActiveEngine(engine.id)}
            >
              <span style={{ color: activeEngine === engine.id ? '#06b6d4' : '#475569' }}>{engine.icon}</span>
              <span>{engine.label}</span>
            </button>
          ))}
        </nav>

        {/* Wallet */}
        <div className="p-4 m-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(124,58,237,0.15))', border: '1px solid rgba(6,182,212,0.25)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#94a3b8]">Wallet</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#06b6d4" width={16} height={16}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
            </svg>
          </div>
          <div className="text-2xl font-bold di-font-display text-[#f1f5f9]">&#8377;2,450</div>
          <div className="text-xs text-[#64748b] mb-3">Available credits</div>
          <Link
            href="/dataintel/pricing"
            className="block text-center py-2 rounded-lg text-xs font-semibold text-[#080b14] transition-all"
            style={{ background: '#06b6d4' }}
          >
            Add credits
          </Link>
        </div>

        {/* User */}
        <div className="p-4 border-t flex items-center gap-3" style={{ borderColor: '#1e293b' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#080b14]" style={{ background: '#06b6d4' }}>AM</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[#f1f5f9] truncate">Arjun Mehta</div>
            <div className="text-xs text-[#64748b] truncate">arjun@company.com</div>
          </div>
          <Link href="/dataintel/sign-up-login" className="text-[#64748b] hover:text-[#94a3b8] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b flex items-center justify-between px-6" style={{ borderColor: '#1e293b', background: '#080b14' }}>
          <span className="text-sm font-semibold text-[#f1f5f9] capitalize">{activeEngine === 'overview' ? 'Overview' : engines.find(e => e.id === activeEngine)?.label}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#64748b]">Demo mode active</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>Demo</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background: '#080b14' }}>
          {activeEngine === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="di-font-display text-2xl font-semibold text-[#f1f5f9] mb-1">Good evening, Arjun.</h1>
                <p className="text-sm text-[#64748b]">Your data intelligence command center. All engines ready.</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: 'database', value: '14,87,332', label: 'Records Processed', sub: '+12% this week', color: '#06B6D4' },
                  { icon: 'bolt', value: '24', label: 'Campaigns Run', sub: '+3 this week', color: '#7C3AED' },
                  { icon: 'wallet', value: '\u20b94,820', label: 'Credits Used', sub: 'This month', color: '#F59E0B' },
                  { icon: 'chart', value: '187', label: 'Analyses Done', sub: 'Total', color: '#818CF8' },
                ].map((stat) => (
                  <div key={stat.label} className="p-5 rounded-2xl border" style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.5)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
                      <StatIcon icon={stat.icon} color={stat.color} />
                    </div>
                    <div className="text-2xl font-bold di-font-display text-[#f1f5f9] mb-1">{stat.value}</div>
                    <div className="text-sm text-[#64748b] mb-1">{stat.label}</div>
                    <div className="text-xs" style={{ color: stat.color }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Engine launcher */}
                <div className="lg:col-span-2 rounded-2xl border p-5" style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.5)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-[#f1f5f9]">Launch an Engine</h2>
                    <span className="text-xs text-[#64748b]">5 available</span>
                  </div>
                  <div className="space-y-2">
                    {engineCards.map((engine) => (
                      <button
                        key={engine.id}
                        className="w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all hover:border-[rgba(6,182,212,0.3)]"
                        style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.3)' }}
                        onClick={() => setActiveEngine(engine.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${engine.color}15`, border: `1px solid ${engine.color}30` }}>
                            <EngineIcon id={engine.id} color={engine.color} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#f1f5f9]">{engine.name}</div>
                            <div className="text-xs text-[#64748b]">{engine.desc}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs di-font-mono text-[#94a3b8]">{engine.rate}</div>
                          <div className="text-xs" style={{ color: engine.status === 'Offline engine' ? '#7C3AED' : '#06B6D4' }}>{engine.status}</div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#64748b" width={16} height={16} className="ml-3 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent activity */}
                <div className="rounded-2xl border p-5" style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.5)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-[#f1f5f9]">Recent Activity</h2>
                    <button className="text-xs text-[#06b6d4] hover:text-[#22d3ee] transition-colors">View all</button>
                  </div>
                  <div className="space-y-4">
                    {recentActivity.map((item) => (
                      <div key={item.engine} className="flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: item.color }} />
                        <div>
                          <div className="text-sm font-medium text-[#f1f5f9]">{item.engine}</div>
                          <div className="text-xs text-[#64748b]">{item.action}</div>
                          <div className="text-xs text-[#475569] mt-0.5">{item.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t" style={{ borderColor: '#1e293b' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-[#64748b]">Wallet balance</span>
                      <span className="text-sm font-bold di-font-mono text-[#06b6d4]">&#8377;2,450</span>
                    </div>
                    <Link
                      href="/dataintel/pricing"
                      className="block text-center py-2 rounded-lg text-xs font-semibold text-[#080b14] transition-all"
                      style={{ background: '#06b6d4' }}
                    >
                      Add credits
                    </Link>
                  </div>
                </div>
              </div>

              {/* Demo banner */}
              <div className="flex items-center gap-4 p-5 rounded-2xl border" style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.05)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(6,182,212,0.15)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#06b6d4" width={20} height={20}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#f1f5f9]">Demo mode is active</div>
                  <div className="text-xs text-[#64748b]">Try all engines with sample data. Add credits to run on your own data.</div>
                </div>
                <Link
                  href="/dataintel/pricing"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#080b14] shrink-0"
                  style={{ background: '#06b6d4' }}
                >
                  Add credits
                </Link>
              </div>
            </div>
          )}

          {activeEngine !== 'overview' && (
            <EngineView engine={activeEngine} />
          )}
        </main>
      </div>
    </div>
  );
}

function EngineView({ engine }: { engine: string }) {
  const color = engineColors[engine] || '#06B6D4';
  const engineData = engineCards.find(e => e.id === engine);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <EngineIcon id={engine} color={color} size={24} />
        </div>
        <div>
          <h1 className="di-font-display text-xl font-semibold text-[#f1f5f9]">{engineData?.name}</h1>
          <p className="text-sm text-[#64748b]">{engineData?.desc}</p>
        </div>
        <div className="ml-auto">
          <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>{engineData?.status}</span>
        </div>
      </div>

      {/* Upload area */}
      <div className="rounded-2xl border-2 border-dashed p-12 text-center" style={{ borderColor: `${color}30`, background: `${color}05` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${color}15` }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={32} height={32}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <h3 className="di-font-display text-lg font-semibold text-[#f1f5f9] mb-2">Upload your data</h3>
        <p className="text-sm text-[#64748b] mb-6">Drag and drop your CSV or Excel file, or click to browse</p>
        <button
          className="px-6 py-3 rounded-xl font-semibold text-sm text-[#080b14] transition-all"
          style={{ background: color }}
        >
          Choose file
        </button>
        <p className="text-xs text-[#475569] mt-4">Supports CSV, XLSX · Max 500MB · Demo mode: sample data available</p>
      </div>

      {/* Pricing info */}
      <div className="p-5 rounded-2xl border" style={{ borderColor: '#1e293b', background: 'rgba(15,23,42,0.5)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[#f1f5f9] mb-1">Credit cost</div>
            <div className="text-xs text-[#64748b]">Exact cost shown before every run</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold di-font-mono" style={{ color }}>{engineData?.rate}</div>
            <div className="text-xs text-[#64748b]">per unit</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatIcon({ icon, color }: { icon: string; color: string }) {
  if (icon === 'database') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={20} height={20}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
  if (icon === 'bolt') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={20} height={20}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
  if (icon === 'wallet') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={20} height={20}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
  );
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={20} height={20}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function EngineIcon({ id, color, size = 18 }: { id: string; color: string; size?: number }) {
  if (id === 'fintech') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size} height={size}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
    </svg>
  );
  if (id === 'bigdata') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size} height={size}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
    </svg>
  );
  if (id === 'whatsapp') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size} height={size}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
  if (id === 'marketing') return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size} height={size}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size} height={size}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}
