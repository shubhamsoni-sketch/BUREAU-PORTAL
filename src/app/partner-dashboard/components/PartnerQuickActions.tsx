import React from 'react';
import Icon from '@/components/ui/AppIcon';

const actions = [
  {
    id: 'qa-pull-bureau',
    label: 'Pull Bureau Report',
    description: 'Fetch a fresh bureau report',
    icon: 'MagnifyingGlassIcon',
    href: '/pull-bureau',
    primary: true,
  },
  {
    id: 'qa-wallet',
    label: 'Recharge Wallet',
    description: 'Add funds to your account',
    icon: 'WalletIcon',
    href: '/my-wallet',
    primary: false,
  },
  {
    id: 'qa-reports',
    label: 'View Report History',
    description: 'Browse all pulled reports',
    icon: 'ClipboardDocumentListIcon',
    href: '/reports-history',
    primary: false,
  },
  {
    id: 'qa-profile',
    label: 'Update Profile',
    description: 'Edit your DSA information',
    icon: 'UserCircleIcon',
    href: '/profile',
    primary: false,
  },
];

export default function PartnerQuickActions() {
  return (
    <div className="bg-white rounded-xl border border-border shadow-card h-full">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Icon name="BoltIcon" size={18} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
      </div>
      <div className="p-4 space-y-2">
        {actions.map((action) => (
          <a
            key={action.id}
            href={action.href}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-150 group ${
              action.primary
                ? 'bg-primary text-white hover:bg-primary/90' :'hover:bg-muted text-foreground'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${
                action.primary
                  ? 'bg-white/20' :'bg-muted group-hover:bg-white'
              }`}
            >
              <Icon
                name={action.icon as Parameters<typeof Icon>[0]['name']}
                size={18}
                className={action.primary ? 'text-white' : 'text-primary'}
              />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold leading-tight ${action.primary ? 'text-white' : 'text-foreground'}`}>
                {action.label}
              </p>
              <p className={`text-xs leading-tight mt-0.5 ${action.primary ? 'text-white/70' : 'text-muted-foreground'}`}>
                {action.description}
              </p>
            </div>
            <Icon
              name="ChevronRightIcon"
              size={14}
              className={`ml-auto flex-shrink-0 ${action.primary ? 'text-white/60' : 'text-muted-foreground group-hover:text-foreground'}`}
            />
          </a>
        ))}
      </div>
    </div>
  );
}