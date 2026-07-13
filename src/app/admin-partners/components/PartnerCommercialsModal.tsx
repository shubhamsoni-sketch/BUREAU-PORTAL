'use client';

import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Package, Zap, TrendingUp, Save, Loader2, AlertCircle, CheckCircle2, Users, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { authFetch } from '@/lib/supabase/auth-fetch';

interface Partner {
  id: string;
  fullName: string;
  partnerCode: string;
  email: string;
}

interface PartnerCommercials {
  pricing_plan: string;
  subscription_type: string;
  consumer_credit_rate: number;
  commercial_credit_rate: number;
  bundled_credits: number;
  credit_limit: number;
  addon_credits: number;
  notes: string;
}

interface PartnerCommercialsModalProps {
  partner: Partner;
  onClose: () => void;
  onSaved: () => void;
}

const PRICING_PLANS = ['Basic', 'Standard', 'Premium', 'Custom'];
const SUBSCRIPTION_TYPES = [
  { value: 'prepaid', label: 'Prepaid' },
  { value: 'monthly_fixed', label: 'Monthly Fixed' },
  { value: 'hybrid', label: 'Hybrid' },
];

const PLAN_COLORS: Record<string, string> = {
  Basic: 'bg-slate-100 text-slate-700 border-slate-200',
  Standard: 'bg-blue-50 text-blue-700 border-blue-200',
  Premium: 'bg-purple-50 text-purple-700 border-purple-200',
  Custom: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function PartnerCommercialsModal({ partner, onClose, onSaved }: PartnerCommercialsModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<PartnerCommercials>({
    pricing_plan: 'Basic',
    subscription_type: 'prepaid',
    consumer_credit_rate: 10,
    commercial_credit_rate: 15,
    bundled_credits: 0,
    credit_limit: 1000,
    addon_credits: 0,
    notes: '',
  });

  useEffect(() => {
    let cancelled = false;

    const fetchCommercials = async () => {
      setLoading(true);
      setError(null);

      const timeout = setTimeout(() => {
        if (!cancelled) {
          setLoading(false);
        }
      }, 5000);

      try {
        const { data, error: fetchError } = await supabase
          .from('partner_commercials')
          .select('*')
          .eq('partner_id', partner.id)
          .maybeSingle();

        if (cancelled) return;

        if (fetchError) {
          console.warn('[PartnerCommercialsModal] fetch error (showing defaults):', (fetchError as any).message);
        } else if (data) {
          setForm({
            pricing_plan: data.pricing_plan || 'Basic',
            subscription_type: data.subscription_type || 'prepaid',
            consumer_credit_rate: Number(data.consumer_credit_rate ?? data.credit_rate) || 10,
            commercial_credit_rate: Number(data.commercial_credit_rate) || 15,
            bundled_credits: data.bundled_credits || 0,
            credit_limit: data.credit_limit || 1000,
            addon_credits: data.addon_credits || 0,
            notes: data.notes || '',
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[PartnerCommercialsModal] fetch threw:', err);
        }
      } finally {
        clearTimeout(timeout);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCommercials();

    return () => {
      cancelled = true;
    };
  }, [partner.id]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        partner_id: partner.id,
        pricing_plan: form.pricing_plan,
        subscription_type: form.subscription_type,
        consumer_credit_rate: form.consumer_credit_rate,
        commercial_credit_rate: form.commercial_credit_rate,
        bundled_credits: form.bundled_credits,
        credit_limit: form.credit_limit,
        addon_credits: form.addon_credits,
        notes: form.notes,
      };

      const res = await authFetch('/api/save-partner-commercials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        setError(result.error || 'Failed to save. Please try again.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          onSaved();
          onClose();
        }, 1200);
      }
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof PartnerCommercials>(key: K, value: PartnerCommercials[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <DollarSign size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Partner Commercials</h3>
              <p className="text-slate-300 text-xs">{partner.fullName} · {partner.partnerCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Pricing Plan */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  <span className="flex items-center gap-1.5"><TrendingUp size={12} /> Pricing Plan</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRICING_PLANS.map((plan) => (
                    <button
                      key={plan}
                      onClick={() => updateField('pricing_plan', plan)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        form.pricing_plan === plan
                          ? PLAN_COLORS[plan] + 'ring-2 ring-offset-1 ring-current' :'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscription Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  <span className="flex items-center gap-1.5"><CreditCard size={12} /> Subscription Type</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SUBSCRIPTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateField('subscription_type', type.value)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        form.subscription_type === type.value
                          ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-offset-1 ring-blue-400' :'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Credit Rates — two separate fields */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  <span className="flex items-center gap-1.5"><Zap size={12} /> Credit Rates (₹ per pull)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Consumer Pull Rate */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Users size={12} className="text-blue-500" />
                      <span className="text-xs font-medium text-slate-600">Consumer Pull</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={form.consumer_credit_rate}
                        onChange={(e) => updateField('consumer_credit_rate', parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Individual Bureau pull</p>
                  </div>

                  {/* Commercial Pull Rate */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Building2 size={12} className="text-indigo-500" />
                      <span className="text-xs font-medium text-slate-600">Commercial Pull</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={form.commercial_credit_rate}
                        onChange={(e) => updateField('commercial_credit_rate', parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Business Bureau pull</p>
                  </div>
                </div>
              </div>

              {/* Credits Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    <span className="flex items-center gap-1"><Package size={11} /> Bundled</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.bundled_credits}
                    onChange={(e) => updateField('bundled_credits', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <p className="text-xs text-slate-400 mt-1">Included in plan</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    <span className="flex items-center gap-1"><TrendingUp size={11} /> Limit</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.credit_limit}
                    onChange={(e) => updateField('credit_limit', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <p className="text-xs text-slate-400 mt-1">Max credits</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    <span className="flex items-center gap-1"><Zap size={11} /> Add-on</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.addon_credits}
                    onChange={(e) => updateField('addon_credits', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <p className="text-xs text-slate-400 mt-1">Top-up credits</p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={2}
                  placeholder="Internal notes about this partner's commercial arrangement..."
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: 'Plan', value: form.pricing_plan },
                    { label: 'Type', value: SUBSCRIPTION_TYPES.find(t => t.value === form.subscription_type)?.label || form.subscription_type },
                    { label: 'Consumer Rate', value: `₹${form.consumer_credit_rate}/pull` },
                    { label: 'Commercial Rate', value: `₹${form.commercial_credit_rate}/pull` },
                    { label: 'Bundled', value: `${form.bundled_credits} credits` },
                    { label: 'Limit', value: `${form.credit_limit} credits` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between">
                      <span className="text-slate-500">{row.label}</span>
                      <span className="font-medium text-slate-800">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error / Success */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-sm">
                  <CheckCircle2 size={15} />
                  Commercials saved successfully!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || success}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Commercials'}
          </button>
        </div>
      </div>
    </div>
  );
}
