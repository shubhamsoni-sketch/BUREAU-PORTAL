'use client';

import React, { useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export default function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`relative bg-white rounded-xl shadow-dropdown w-full ${sizeClasses[size]} fade-in`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 ml-4 flex-shrink-0"
            aria-label="Close modal"
          >
            <Icon name="XMarkIcon" size={18} />
          </button>
        </div>
        {/* Body */}
        {children && <div className="p-5">{children}</div>}
      </div>
    </div>
  );
}