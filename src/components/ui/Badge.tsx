import React from 'react';

type BadgeVariant = 'active' | 'pending' | 'suspended' | 'terminated' | 'blue' | 'purple' | 'default';

type BadgeProps = {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
};

const variantClasses: Record<BadgeVariant, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  suspended: 'bg-red-50 text-red-700',
  terminated: 'bg-gray-100 text-gray-600',
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
  default: 'bg-gray-100 text-gray-700',
};

const dotColors: Record<BadgeVariant, string> = {
  active: 'bg-emerald-500',
  pending: 'bg-amber-500',
  suspended: 'bg-red-500',
  terminated: 'bg-gray-400',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  default: 'bg-gray-400',
};

export default function Badge({ variant = 'default', children, className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}