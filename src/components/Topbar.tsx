'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

type TopbarProps = {
  title: string;
  subtitle?: string;
  role: 'admin' | 'partner';
  actions?: React.ReactNode;
};

export default function Topbar({ title, subtitle, role, actions }: TopbarProps) {
  return (
    <header
      className="fixed top-0 right-0 bg-white border-b border-border z-30 flex items-center justify-between px-6 transition-all duration-300"
      style={{
        height: 'var(--header-height)',
        left: 'var(--sidebar-width)',
      }}
    >
      {/* Left: Page Title */}
      <div className="flex flex-col justify-center min-w-0">
        <h1 className="text-lg font-semibold text-foreground leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {/* Right: Actions + User */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {actions}

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
          aria-label="Notifications"
        >
          <Icon name="BellIcon" size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* Help */}
        <button
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
          aria-label="Help"
        >
          <Icon name="QuestionMarkCircleIcon" size={20} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* User Avatar */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
            {role === 'admin' ? 'A' : 'R'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-foreground leading-none">
              {role === 'admin' ? 'Admin' : 'Rajesh K.'}
            </p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">
              {role === 'admin' ? 'Super Admin' : 'DSA Partner'}
            </p>
          </div>
          <Icon name="ChevronDownIcon" size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </header>
  );
}