'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAdmin, IntegrationService } from '@/context/AdminContext';
import { CheckCircle, XCircle, Loader, Eye, EyeOff, ToggleLeft, ToggleRight, Zap, AlertCircle, CreditCard, Play, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const CATEGORY_ICONS: Record<string, string> = {
  'Payment Gateway': '💳',
  'SMS/OTP Service': '📱',
  'Email Service': '📧',
  'eSign Service': '✍️',
  'CIBIL API': '📊',
};

// ─── Mock test cards ─────────────────────────────────────────────────────────
interface MockCard {
  label: string;
  number: string;
  scenario: 'success' | 'decline' | '3ds' | 'insufficient' | 'expired';
  description: string;
  badge: string;
  badgeColor: string;
}

const MOCK_CARDS: MockCard[] = [
  {
    label: 'Visa — Success',
    number: '4242 4242 4242 4242',
    scenario: 'success',
    description: 'Payment succeeds immediately. Wallet is credited.',
    badge: 'Success',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  {
    label: 'Visa — Generic Decline',
    number: '4000 0000 0000 0002',
    scenario: 'decline',
    description: 'Card is declined. No charge is made.',
    badge: 'Declined',
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
  },
  {
    label: 'Visa — Insufficient Funds',
    number: '4000 0000 0000 9995',
    scenario: 'insufficient',
    description: 'Declined due to insufficient funds.',
    badge: 'Insufficient Funds',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  {
    label: 'Visa — 3D Secure Auth',
    number: '4000 0025 0000 3155',
    scenario: '3ds',
    description: 'Requires 3D Secure authentication before payment.',
    badge: '3DS Required',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    label: 'Visa — Expired Card',
    number: '4000 0000 0000 0069',
    scenario: 'expired',
    description: 'Declined because the card is expired.',
    badge: 'Expired',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
  },
];

interface TestResult {
  scenario: MockCard['scenario'];
  card: string;
  amount: number;
  timestamp: string;
  message: string;
  success: boolean;
  transactionId?: string;
}

function getScenarioResult(scenario: MockCard['scenario'], amount: number): Omit<TestResult, 'card' | 'amount' | 'timestamp'> {
  switch (scenario) {
    case 'success':
      return {
        scenario,
        success: true,
        message: `Payment of ₹${amount.toLocaleString('en-IN')} processed successfully. Wallet credited.`,
        transactionId: 'txn_mock_' + Math.random().toString(36).slice(2, 10).toUpperCase(),
      };
    case 'decline':
      return { scenario, success: false, message: 'Your card was declined. Please use a different payment method.' };
    case 'insufficient':
      return { scenario, success: false, message: 'Your card has insufficient funds. Please top up and retry.' };
    case '3ds':
      return { scenario, success: true, message: '3D Secure authentication completed. Payment authorised and wallet credited.', transactionId: 'txn_mock_3DS_' + Math.random().toString(36).slice(2, 8).toUpperCase() };
    case 'expired':
      return { scenario, success: false, message: 'Your card has expired. Please update your card details.' };
  }
}

// ─── Stripe-specific card ────────────────────────────────────────────────────
function StripePluginCard({ service, onUpdate }: { service: IntegrationService; onUpdate: (id: string, updates: Partial<IntegrationService>) => void }) {
  const [publishableKey, setPublishableKey] = useState(service.apiKey);
  const [secretKey, setSecretKey] = useState(service.apiSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);

  // Mock tester state
  const [testerOpen, setTesterOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<MockCard>(MOCK_CARDS[0]);
  const [testAmount, setTestAmount] = useState('10000');
  const [running, setRunning] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);

  const isConnected = service.testStatus === 'success';
  const hasKeys = publishableKey.trim().length > 0 && secretKey.trim().length > 0;
  const amountNum = parseInt(testAmount, 10) || 0;
  const amountValid = amountNum >= 10000;

  const handleSave = () => {
    onUpdate(service.id, { apiKey: publishableKey, apiSecret: secretKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = () => {
    if (!hasKeys) return;
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      onUpdate(service.id, {
        enabled: true,
        testStatus: 'success',
        lastTested: new Date().toISOString().split('T')[0],
      });
    }, 1800);
  };

  const handleRunMockPayment = () => {
    if (!amountValid) return;
    setRunning(true);
    setTestResult(null);
    // Simulate network delay
    const delay = selectedCard.scenario === '3ds' ? 2400 : 1600;
    setTimeout(() => {
      const result: TestResult = {
        ...getScenarioResult(selectedCard.scenario, amountNum),
        card: selectedCard.number,
        amount: amountNum,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setTestResult(result);
      setTestHistory((prev) => [result, ...prev].slice(0, 5));
      setRunning(false);
    }, delay);
  };

  const handleReset = () => {
    setTestResult(null);
    setTestAmount('10000');
    setSelectedCard(MOCK_CARDS[0]);
  };

  return (
    <div className="bg-white rounded-xl border-2 border-indigo-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-base">Stripe</p>
            <p className="text-xs text-slate-400">Payment Gateway · Cards, UPI, Net Banking</p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
          isConnected
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
        }`}>
          {isConnected ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
          {isConnected ? 'Connected' : 'Not Connected'}
        </span>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-50 border border-indigo-100 mb-5">
        <AlertCircle size={13} className="text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-700">
          Paste your Stripe keys below and click <strong>Save &amp; Activate</strong> to go live. Partners will then be able to pay via Stripe directly from their wallet.
        </p>
      </div>

      {/* Key fields */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">
            Publishable Key <span className="font-normal text-slate-400">(starts with pk_live_ or pk_test_)</span>
          </label>
          <input
            type="text"
            value={publishableKey}
            onChange={(e) => setPublishableKey(e.target.value)}
            placeholder="Enter Stripe publishable key"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">
            Secret Key <span className="font-normal text-slate-400">(starts with sk_live_ or sk_test_)</span>
          </label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter Stripe secret key"
              className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono"
            />
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-5">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {saved ? <CheckCircle size={12} /> : null}
          {saved ? 'Saved!' : 'Save & Activate'}
        </button>
        <button
          onClick={handleTest}
          disabled={testing || !hasKeys}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {testing ? <Loader size={12} className="animate-spin" /> : null}
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        {isConnected && !testing && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 ml-auto">
            <CheckCircle size={12} /> Live · {service.lastTested}
          </span>
        )}
      </div>

      {/* ── Mock Payment Tester ─────────────────────────────────────────── */}
      <div className="mt-6 border-t border-slate-100 pt-5">
        <button
          onClick={() => setTesterOpen((v) => !v)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2">
            <CreditCard size={15} className="text-violet-500" />
            <span className="text-sm font-semibold text-slate-700">Mock Payment Tester</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
              Sandbox
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
            <span>{testerOpen ? 'Hide' : 'Show'}</span>
            {testerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        {testerOpen && (
          <div className="mt-4 space-y-4">
            {/* Sandbox notice */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-violet-50 border border-violet-100">
              <CreditCard size={13} className="text-violet-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-violet-700">
                <strong>No real charges.</strong> These are Stripe test card numbers. Use them to simulate success and failure scenarios before adding your live keys.
              </p>
            </div>

            {/* Amount input */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                Test Amount <span className="font-normal text-slate-400">(min ₹10,000)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">₹</span>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  min={10000}
                  className={`w-full pl-7 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                    !amountValid && testAmount !== '' ?'border-red-300 focus:ring-red-200' :'border-slate-200 focus:ring-violet-300'
                  }`}
                />
              </div>
              {!amountValid && testAmount !== '' && (
                <p className="text-xs text-red-500 mt-1">Minimum amount is ₹10,000</p>
              )}
            </div>

            {/* Card selector */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-2">Select Test Card</label>
              <div className="space-y-2">
                {MOCK_CARDS.map((card) => (
                  <button
                    key={card.number}
                    onClick={() => { setSelectedCard(card); setTestResult(null); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${
                      selectedCard.number === card.number
                        ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-300'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedCard.number === card.number ? 'bg-violet-500' : 'bg-slate-300'}`} />
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{card.label}</p>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">{card.number}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 pl-1">
                {selectedCard.description}
              </p>
            </div>

            {/* Run button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunMockPayment}
                disabled={running || !amountValid}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {running ? <Loader size={12} className="animate-spin" /> : <Play size={12} />}
                {running ? (selectedCard.scenario === '3ds' ? 'Authenticating...' : 'Processing...') : 'Run Mock Payment'}
              </button>
              {testResult && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw size={11} /> Reset
                </button>
              )}
            </div>

            {/* Result panel */}
            {testResult && (
              <div className={`rounded-lg border p-4 ${testResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-2">
                  {testResult.success
                    ? <CheckCircle size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    : <XCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${testResult.success ? 'text-emerald-800' : 'text-red-700'}`}>
                      {testResult.success ? 'Payment Successful (Mock)' : 'Payment Failed (Mock)'}
                    </p>
                    <p className={`text-xs mt-1 ${testResult.success ? 'text-emerald-700' : 'text-red-600'}`}>
                      {testResult.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="text-xs text-slate-500 font-mono">Card: {testResult.card}</span>
                      <span className="text-xs text-slate-500">Amount: ₹{testResult.amount.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-slate-400">{testResult.timestamp}</span>
                      {testResult.transactionId && (
                        <span className="text-xs font-mono text-slate-500">ID: {testResult.transactionId}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Test history */}
            {testHistory.length > 1 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Recent Test Runs</p>
                <div className="space-y-1.5">
                  {testHistory.slice(1).map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                      {h.success
                        ? <CheckCircle size={11} className="text-emerald-500 flex-shrink-0" />
                        : <XCircle size={11} className="text-red-400 flex-shrink-0" />
                      }
                      <span className="text-xs text-slate-600 truncate flex-1">{h.message}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{h.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Generic integration card ────────────────────────────────────────────────
function IntegrationCard({ service, onUpdate }: { service: IntegrationService; onUpdate: (id: string, updates: Partial<IntegrationService>) => void }) {
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [localKey, setLocalKey] = useState(service.apiKey);
  const [localSecret, setLocalSecret] = useState(service.apiSecret);
  const [localEndpoint, setLocalEndpoint] = useState(service.endpoint ?? '');
  const [saved, setSaved] = useState(false);

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      onUpdate(service.id, {
        testStatus: 'success',
        lastTested: new Date().toISOString().split('T')[0],
      });
    }, 1500);
  };

  const handleSave = () => {
    onUpdate(service.id, { apiKey: localKey, apiSecret: localSecret, endpoint: localEndpoint });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={`bg-white rounded-xl border ${service.enabled ? 'border-slate-200' : 'border-slate-100 opacity-80'} p-5`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{CATEGORY_ICONS[service.category] ?? '🔌'}</span>
          <div>
            <p className="font-semibold text-slate-800">{service.name}</p>
            <p className="text-xs text-slate-400">{service.category}</p>
          </div>
        </div>
        <button
          onClick={() => onUpdate(service.id, { enabled: !service.enabled })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${service.enabled ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          {service.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {service.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">API Key</label>
          <input
            type="text"
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            placeholder="Enter API key"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">API Secret</label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={localSecret}
              onChange={(e) => setLocalSecret(e.target.value)}
              placeholder="Enter API secret"
              className="w-full px-3 py-2 pr-9 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
            />
            <button onClick={() => setShowSecret(!showSecret)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Endpoint URL</label>
          <input
            type="text"
            value={localEndpoint}
            onChange={(e) => setLocalEndpoint(e.target.value)}
            placeholder="https://api.example.com"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={handleTest}
          disabled={testing || !service.enabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {testing ? <Loader size={12} className="animate-spin" /> : null}
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {saved ? <CheckCircle size={12} /> : null}
          {saved ? 'Saved!' : 'Save'}
        </button>
        {service.testStatus === 'success' && !testing && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 ml-auto">
            <CheckCircle size={12} /> Connected · {service.lastTested}
          </span>
        )}
        {service.testStatus === 'failed' && !testing && (
          <span className="flex items-center gap-1 text-xs text-red-500 ml-auto">
            <XCircle size={12} /> Failed · {service.lastTested}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminIntegrationsPage() {
  const { integrations, updateIntegration } = useAdmin();

  const stripeService = integrations.find((i) => i.id === 'int-stripe');
  const categories = ['Payment Gateway', 'SMS/OTP Service', 'Email Service', 'eSign Service', 'CIBIL API'];

  return (
    <AdminLayout title="Integrations">
      <div className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800 font-medium">Integration Settings</p>
          <p className="text-xs text-blue-600 mt-0.5">Configure third-party services. API keys are stored in session only — connect to a secure vault in production.</p>
        </div>

        {/* Stripe — Featured Plugin */}
        {stripeService && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span>💳</span> Stripe Payment Gateway
              <span className="text-xs font-normal text-slate-400 ml-1">— Featured Plugin</span>
            </h3>
            <StripePluginCard service={stripeService} onUpdate={updateIntegration} />
          </div>
        )}

        {/* Other categories */}
        {categories.map((cat) => {
          const services = integrations.filter((i) => i.category === cat && i.id !== 'int-stripe');
          if (services.length === 0) return null;
          return (
            <div key={cat}>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span>{CATEGORY_ICONS[cat]}</span> {cat}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {services.map((service) => (
                  <IntegrationCard key={service.id} service={service} onUpdate={updateIntegration} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
