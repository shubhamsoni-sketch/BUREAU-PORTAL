import React from 'react';

type BadgeVariant =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'docs_submitted'
  | 'login_pending'
  | 'logged_in'
  | 'approved'
  | 'disbursed'
  | 'rejected'
  | 'lost'
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'credit_check'
  | 'conditional_approval'
  | 'final_approval'
  | 'disbursal_initiated'
  | 'pending'
  | 'verified'
  | 'active'
  | 'inactive'
  | 'bank'
  | 'nbfc'
  | 'home_loan'
  | 'personal_loan'
  | 'business_loan'
  | 'lap'
  | 'car_loan'
  | 'credit_card'
  | 'web'
  | 'reference'
  | 'walk_in'
  | 'campaign'
  | 'social';

const variantMap: Record<BadgeVariant, { label: string; classes: string }> = {
  new: { label: 'New', classes: 'bg-info-bg text-info border-info/20' },
  contacted: {
    label: 'Contacted',
    classes: 'bg-secondary text-secondary-foreground border-primary/20',
  },
  interested: { label: 'Interested', classes: 'bg-warning-bg text-warning border-warning/20' },
  docs_submitted: {
    label: 'Docs Submitted',
    classes: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  login_pending: {
    label: 'Login Pending',
    classes: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  logged_in: { label: 'Logged In', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved: { label: 'Approved', classes: 'bg-success-bg text-success border-success/20' },
  disbursed: { label: 'Disbursed', classes: 'bg-success-bg text-success border-success/20' },
  rejected: { label: 'Rejected', classes: 'bg-danger-bg text-danger border-danger/20' },
  lost: { label: 'Lost', classes: 'bg-muted text-muted-foreground border-border' },
  draft: { label: 'Draft', classes: 'bg-muted text-muted-foreground border-border' },
  submitted: { label: 'Submitted', classes: 'bg-info-bg text-info border-info/20' },
  under_review: { label: 'Under Review', classes: 'bg-warning-bg text-warning border-warning/20' },
  credit_check: {
    label: 'Credit Check',
    classes: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  conditional_approval: {
    label: 'Cond. Approval',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  final_approval: {
    label: 'Final Approval',
    classes: 'bg-success-bg text-success border-success/20',
  },
  disbursal_initiated: {
    label: 'Disbursal Init.',
    classes: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  pending: { label: 'Pending', classes: 'bg-warning-bg text-warning border-warning/20' },
  verified: { label: 'Verified', classes: 'bg-success-bg text-success border-success/20' },
  active: { label: 'Active', classes: 'bg-success-bg text-success border-success/20' },
  inactive: { label: 'Inactive', classes: 'bg-muted text-muted-foreground border-border' },
  bank: { label: 'Bank', classes: 'bg-info-bg text-info border-info/20' },
  nbfc: { label: 'NBFC', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  home_loan: { label: 'Home Loan', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  personal_loan: {
    label: 'Personal Loan',
    classes: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  business_loan: { label: 'Business Loan', classes: 'bg-teal-50 text-teal-700 border-teal-200' },
  lap: { label: 'LAP', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  car_loan: { label: 'Car Loan', classes: 'bg-sky-50 text-sky-700 border-sky-200' },
  credit_card: { label: 'Credit Card', classes: 'bg-pink-50 text-pink-700 border-pink-200' },
  web: { label: 'Web', classes: 'bg-info-bg text-info border-info/20' },
  reference: { label: 'Reference', classes: 'bg-success-bg text-success border-success/20' },
  walk_in: { label: 'Walk-in', classes: 'bg-warning-bg text-warning border-warning/20' },
  campaign: { label: 'Campaign', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  social: { label: 'Social', classes: 'bg-pink-50 text-pink-700 border-pink-200' },
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({ variant, size = 'md', className = '' }: StatusBadgeProps) {
  const config = variantMap[variant] ?? {
    label: variant,
    classes: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        config.classes,
        className,
      ].join(' ')}
    >
      {config.label}
    </span>
  );
}
