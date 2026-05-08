import React from 'react';
import Icon from '@/components/ui/AppIcon';
import Badge from '@/components/ui/Badge';

const accountDetails = [
  { id: 'detail-code', label: 'Partner Code', value: 'DSA-2024-001', mono: true },
  { id: 'detail-name', label: 'Full Name', value: 'Rajesh Kumar Sharma', mono: false },
  { id: 'detail-email', label: 'Email', value: 'rajesh.sharma@creditdsa.in', mono: false },
  { id: 'detail-phone', label: 'Mobile', value: '+91 98201 44321', mono: false },
  { id: 'detail-city', label: 'City / State', value: 'Mumbai, Maharashtra', mono: false },
  { id: 'detail-joined', label: 'Member Since', value: '12 Jan 2024', mono: false },
];

const usageItems = [
  { id: 'usage-apr', month: 'Apr 2026', reports: 47, spend: '₹2,350', pct: 78 },
  { id: 'usage-mar', month: 'Mar 2026', reports: 35, spend: '₹1,750', pct: 58 },
  { id: 'usage-feb', month: 'Feb 2026', reports: 52, spend: '₹2,600', pct: 87 },
  { id: 'usage-jan', month: 'Jan 2026', reports: 41, spend: '₹2,050', pct: 68 },
];

export default function PartnerAccountHealth() {
  return (
    <div className="bg-white rounded-xl border border-border shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="UserCircleIcon" size={18} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Account Overview</h2>
        </div>
        <Badge variant="active" dot>Active</Badge>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Account Details */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Account Details
          </p>
          <div className="space-y-2.5">
            {accountDetails?.map((item) => (
              <div key={item?.id} className="flex items-start justify-between gap-3">
                <span className="text-xs text-muted-foreground flex-shrink-0 w-28">{item?.label}</span>
                <span className={`text-xs font-medium text-foreground text-right ${item?.mono ? 'font-mono text-blue-700' : ''}`}>
                  {item?.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Usage */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Monthly Usage
          </p>
          <div className="space-y-3">
            {usageItems?.map((item) => (
              <div key={item?.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{item?.month}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{item?.reports} reports</span>
                    <span className="text-xs font-semibold text-foreground font-tabular">{item?.spend}</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${item?.pct}%` }}
                    role="progressbar"
                    aria-valuenow={item?.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Wallet Summary Footer */}
      <div className="border-t border-border px-5 py-3 bg-muted/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon name="WalletIcon" size={15} className="text-emerald-600" />
          <span className="text-xs text-muted-foreground">Current Wallet Balance</span>
          <span className="text-sm font-bold text-foreground font-tabular">₹12,450</span>
        </div>
        <button className="btn-primary text-xs px-3 py-1.5">
          <Icon name="PlusIcon" size={13} />
          Recharge Wallet
        </button>
      </div>
    </div>
  );
}