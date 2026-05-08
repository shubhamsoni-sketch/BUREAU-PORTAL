import React from 'react';
import Icon from '@/components/ui/AppIcon';

type EmptyStateProps = {
  iconName: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export default function EmptyState({ iconName, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon name={iconName as Parameters<typeof Icon>[0]['name']} size={28} className="text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}