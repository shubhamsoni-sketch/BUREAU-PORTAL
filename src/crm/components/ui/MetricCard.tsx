import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: { value: string; positive: boolean };
  icon: React.ReactNode;
  variant?: 'default' | 'alert' | 'warning' | 'success' | 'info';
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  default: 'bg-card border-border',
  alert: 'bg-danger-bg border-danger/20',
  warning: 'bg-warning-bg border-warning/20',
  success: 'bg-success-bg border-success/20',
  info: 'bg-info-bg border-info/20',
};

const iconStyles: Record<string, string> = {
  default: 'bg-primary/10 text-primary',
  alert: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
};

export default function MetricCard({
  label,
  value,
  subtext,
  trend,
  icon,
  variant = 'default',
  className = '',
  children,
}: MetricCardProps) {
  return (
    <div
      className={[
        'rounded-lg border p-4 shadow-card flex flex-col gap-3',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        <div
          className={[
            'w-9 h-9 rounded-sm flex items-center justify-center shrink-0',
            iconStyles[variant],
          ].join(' ')}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={[
              'flex items-center gap-0.5 text-xs font-semibold',
              trend.positive ? 'text-success' : 'text-danger',
            ].join(' ')}
          >
            {trend.positive ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-600 uppercase tracking-wider text-muted-foreground mb-1">
          {label}
        </p>
        <p className="text-2xl font-800 text-foreground inr-value tabular-nums">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
      </div>
      {children}
    </div>
  );
}
