'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import '../styles.css';

export default function SignUpLoginPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="di-root" style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden di-auth-left">
        <div className="absolute inset-0 di-data-grid-bg opacity-30" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="relative z-10">
          <Link href="/dataintel" className="flex items-center gap-2.5">
            <Image src="/assets/images/credit-trust-logo.png" alt="Credit Trust Logo" width={32} height={32} />
            <span style={{ fontFamily: 'Fraunces, serif' }} className="text-lg font-semibold text-[#f1f5f9]">DataIntel</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="di-font-display font-semibold text-[#f1f5f9]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            The system that turns<br />
            <span className="di-text-gradient">data into decisions.</span>
          </h1>
          <p className="text-[#94a3b8] text-lg">Five engines. One account. Pay per use.</p>

          <div className="space-y-3">
            {[
              { color: '#06B6D4', label: 'Fintech Processing' },
              { color: '#7C3AED', label: 'Big Data Analysis' },
              { color: '#22C55E', label: 'WhatsApp Intelligence' },
              { color: '#F59E0B', label: 'Data & Marketing' },
              { color: '#818CF8', label: 'Credit Intelligence' },
            ]?.map((item) => (
              <div key={item?.label} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full" style={{ background: item?.color }} />
                <span className="text-sm text-[#94a3b8]">{item?.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={16} height={16} className="text-[#a78bfa]">
              <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm text-[#94a3b8]">Your data never leaves your system</span>
        </div>
      </div>
      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12" style={{ background: '#080b14' }}>
        <div className="w-full max-w-md">
          {/* Tab switcher */}
          <div className="flex rounded-xl p-1 mb-8" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
            <button
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: tab === 'signin' ? '#06b6d4' : 'transparent',
                color: tab === 'signin' ? '#080b14' : '#94a3b8',
              }}
              onClick={() => setTab('signin')}
            >
              Sign in
            </button>
            <button
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: tab === 'signup' ? '#06b6d4' : 'transparent',
                color: tab === 'signup' ? '#080b14' : '#94a3b8',
              }}
              onClick={() => setTab('signup')}
            >
              Create account
            </button>
          </div>

          {tab === 'signin' ? (
            <>
              <h2 className="di-font-display text-2xl font-semibold text-[#f1f5f9] mb-1">Welcome back.</h2>
              <p className="text-sm text-[#64748b] mb-8">Sign in to access your engines and wallet.</p>

              <form className="space-y-5" onSubmit={(e) => e?.preventDefault()}>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Email address</label>
                  <input
                    type="email"
                    placeholder="arjun@company.com"
                    className="w-full px-4 py-3 rounded-xl text-sm text-[#f1f5f9] placeholder-[#475569] outline-none transition-all"
                    style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(6,182,212,0.5)'}
                    onBlur={(e) => e.target.style.borderColor = '#1e293b'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-[#f1f5f9] placeholder-[#475569] outline-none transition-all"
                      style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(6,182,212,0.5)'}
                      onBlur={(e) => e.target.style.borderColor = '#1e293b'}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="text-right mt-2">
                    <button className="text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors">Forgot password?</button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-[#080b14] transition-all"
                  style={{ background: '#06b6d4', boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
                >
                  Sign in to DataIntel
                </button>
              </form>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: '#1e293b' }} />
                <span className="text-xs text-[#475569]">or continue with</span>
                <div className="flex-1 h-px" style={{ background: '#1e293b' }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['Google', 'Microsoft']?.map((provider) => (
                  <button
                    key={provider}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-all"
                    style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    {provider}
                  </button>
                ))}
              </div>

              <p className="text-center text-sm text-[#64748b] mt-6">
                Don&apos;t have an account?{' '}
                <button className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors" onClick={() => setTab('signup')}>Create one</button>
              </p>
            </>
          ) : (
            <>
              <h2 className="di-font-display text-2xl font-semibold text-[#f1f5f9] mb-1">Create your account.</h2>
              <p className="text-sm text-[#64748b] mb-8">Free to start. Demo mode available immediately.</p>

              <form className="space-y-5" onSubmit={(e) => e?.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">First name</label>
                    <input
                      type="text"
                      placeholder="Arjun"
                      className="w-full px-4 py-3 rounded-xl text-sm text-[#f1f5f9] placeholder-[#475569] outline-none transition-all"
                      style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(6,182,212,0.5)'}
                      onBlur={(e) => e.target.style.borderColor = '#1e293b'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Last name</label>
                    <input
                      type="text"
                      placeholder="Mehta"
                      className="w-full px-4 py-3 rounded-xl text-sm text-[#f1f5f9] placeholder-[#475569] outline-none transition-all"
                      style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(6,182,212,0.5)'}
                      onBlur={(e) => e.target.style.borderColor = '#1e293b'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Email address</label>
                  <input
                    type="email"
                    placeholder="arjun@company.com"
                    className="w-full px-4 py-3 rounded-xl text-sm text-[#f1f5f9] placeholder-[#475569] outline-none transition-all"
                    style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(6,182,212,0.5)'}
                    onBlur={(e) => e.target.style.borderColor = '#1e293b'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-[#f1f5f9] placeholder-[#475569] outline-none transition-all"
                      style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(6,182,212,0.5)'}
                      onBlur={(e) => e.target.style.borderColor = '#1e293b'}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-[#080b14] transition-all"
                  style={{ background: '#06b6d4', boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
                >
                  Create account
                </button>
              </form>

              <p className="text-center text-xs text-[#475569] mt-4">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-[#64748b] hover:text-[#94a3b8] transition-colors">Terms</a>{' '}and{' '}
                <a href="#" className="text-[#64748b] hover:text-[#94a3b8] transition-colors">Privacy Policy</a>.
              </p>

              <p className="text-center text-sm text-[#64748b] mt-4">
                Already have an account?{' '}
                <button className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors" onClick={() => setTab('signin')}>Sign in</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
