'use client';

import React, { useState, useRef, useEffect } from 'react';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/AppIcon';

type PartnerStatus = 'Active' | 'Pending' | 'Suspended' | 'Terminated';

type Props = {
  partnerId: string;
  currentStatus: PartnerStatus;
  onStatusChange: (partnerId: string, newStatus: PartnerStatus) => void;
};

const STATUS_OPTIONS: { value: PartnerStatus; label: string; variant: 'active' | 'pending' | 'suspended' | 'terminated' }[] = [
  { value: 'Active', label: 'Active', variant: 'active' },
  { value: 'Pending', label: 'Pending', variant: 'pending' },
  { value: 'Suspended', label: 'Suspended', variant: 'suspended' },
  { value: 'Terminated', label: 'Terminated', variant: 'terminated' },
];

export default function PartnerStatusDropdown({ partnerId, currentStatus, onStatusChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = STATUS_OPTIONS.find((o) => o.value === currentStatus)!;

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-1 cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Badge variant={current.variant} dot>{currentStatus}</Badge>
        <Icon name="ChevronDownIcon" size={10} className="text-muted-foreground" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 bg-white border border-border rounded-lg shadow-dropdown z-20 py-1 min-w-[140px] fade-in"
          role="listbox"
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={`status-opt-${opt.value}`}
              role="option"
              aria-selected={opt.value === currentStatus}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors duration-100 ${
                opt.value === currentStatus ? 'bg-muted/60' : ''
              }`}
              onClick={() => {
                onStatusChange(partnerId, opt.value);
                setOpen(false);
              }}
            >
              <Badge variant={opt.variant} dot>{opt.label}</Badge>
              {opt.value === currentStatus && (
                <Icon name="CheckIcon" size={12} className="ml-auto text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}