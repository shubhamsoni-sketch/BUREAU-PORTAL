'use client';

import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, Users, Package, Zap } from 'lucide-react';

interface PartnerData {
  partner_code: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  created_at: string;
  wallet_balance: number;
  status: string;
}

interface Commercials {
  pricing_plan: string;
  subscription_type: string;
  consumer_credit_rate: number;
  commercial_credit_rate: number;
  bundled_credits: number;
  credit_limit: number;
}

export default function PartnerAccountHealth() {
  const { user } = useAuth();
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [commercials, setCommercials] = useState<Commercials | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();

    supabase
      .from('partners')
      .select('partner_code, name, email, mobile, city, created_at, wallet_balance, status, id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPartnerData(data);
          // Fetch commercials using partner.id
          supabase
            .from('partner_commercials')
            .select('pricing_plan, subscription_type, consumer_credit_rate, commercial_credit_rate, bundled_credits, credit_limit, credit_rate')
            .eq('partner_id', (data as any).id)
            .maybeSingle()
            .then(({ data: comm }) => {
              if (comm) {
                setCommercials({
                  pricing_plan: comm.pricing_plan ?? 'Basic',
                  subscription_type: comm.subscription_type ?? 'prepaid',
                  consumer_credit_rate: Number(comm.consumer_credit_rate ?? comm.credit_rate ?? 10),
                  commercial_credit_rate: Number(comm.commercial_credit_rate ?? comm.credit_rate ?? 15),
                  bundled_credits: comm.bundled_credits ?? 0,
                  credit_limit: comm.credit_limit ?? 1000,
                });
              }
            });
        }
      });
  }, [user?.id]);

  const accountDetails = partnerData
    ? [
        { id: 'detail-code', label: 'Partner Code', value: partnerData.partner_code ?? '—', mono: true },
        { id: 'detail-name', label: 'Full Name', value: partnerData.name ?? user?.name ?? '—', mono: false },
        { id: 'detail-email', label: 'Email', value: partnerData.email ?? user?.email ?? '—', mono: false },
        { id: 'detail-phone', label: 'Mobile', value: partnerData.mobile ?? '—', mono: false },
        { id: 'detail-city', label: 'City', value: partnerData.city ?? '—', mono: false },
        {
          id: 'detail-joined',
          label: 'Member Since',
          value: partnerData.created_at
            ? new Date(partnerData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—',
          mono: false,
        },
      ]
    : [
        { id: 'detail-code', label: 'Partner Code', value: user?.partnerCode ?? '—', mono: true },
        { id: 'detail-name', label: 'Full Name', value: user?.name ?? '—', mono: false },
        { id: 'detail-email', label: 'Email', value: user?.email ?? '—', mono: false },
        { id: 'detail-phone', label: 'Mobile', value: '—', mono: false },
        { id: 'detail-city', label: 'City', value: '—', mono: false },
        { id: 'detail-joined', label: 'Member Since', value: '—', mono: false },
      ];

  const walletBalance = partnerData?.wallet_balance ?? 0;
  const isActive = partnerData?.status === 'approved';

  const PLAN_COLORS: Record<string, string> = {
    Basic: 'bg-slate-100 text-slate-700',
    Standard: 'bg-blue-100 text-blue-700',
    Premium: 'bg-purple-100 text-purple-700',
    Custom: 'bg-amber-100 text-amber-700',
  };

  const SUB_LABELS: Record<string, string> = {
    prepaid: 'Prepaid',
    monthly_fixed: 'Monthly Fixed',
    hybrid: 'Hybrid',
  };

  return (
    <div className="bg-white rounded-xl border border-border shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="UserCircleIcon" size={18} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Account Overview</h2>
        </div>
        <Badge variant={isActive ? 'active' : 'pending'} dot>{isActive ? 'Active' : 'Pending'}</Badge>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Account Details */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Account Details
          </p>
          <div className="space-y-2.5">
            {accountDetails.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <span className="text-xs text-muted-foreground flex-shrink-0 w-28">{item.label}</span>
                <span className={`text-xs font-medium text-foreground text-right ${item.mono ? 'font-mono text-blue-700' : ''}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet + Plan Info */}
        <div className="space-y-4">
          {/* Wallet Balance */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Wallet Summary
            </p>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex items-center gap-3">
              <Icon name="WalletIcon" size={22} className="text-emerald-600" />
              <div>
                <p className="text-xs text-emerald-700">Available Balance</p>
                <p className="text-2xl font-bold text-emerald-800 font-tabular">
                  ₹{walletBalance.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Plan Details from Commercials */}
          {commercials && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Your Plan
              </p>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp size={11} /> Pricing Plan
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[commercials.pricing_plan] ?? 'bg-slate-100 text-slate-700'}`}>
                    {commercials.pricing_plan}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Package size={11} /> Subscription
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {SUB_LABELS[commercials.subscription_type] ?? commercials.subscription_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Users size={11} /> Consumer Rate
                  </span>
                  <span className="text-xs font-semibold text-blue-700">₹{commercials.consumer_credit_rate}/pull</span>
                </div>
                {commercials.bundled_credits > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Zap size={11} /> Bundled Credits
                    </span>
                    <span className="text-xs font-medium text-foreground">₹{commercials.bundled_credits}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3 bg-muted/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon name="WalletIcon" size={15} className="text-emerald-600" />
          <span className="text-xs text-muted-foreground">Current Wallet Balance</span>
          <span className="text-sm font-bold text-foreground font-tabular">
            ₹{walletBalance.toLocaleString('en-IN')}
          </span>
        </div>
        <a href="/my-wallet" className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
          <Icon name="WalletIcon" size={13} />
          My Wallet
        </a>
      </div>
    </div>
  );
}
