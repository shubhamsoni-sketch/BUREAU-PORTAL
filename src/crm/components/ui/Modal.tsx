'use client';
import React, { useEffect } from 'react';

interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ open, isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  const visible = Boolean(open ?? isOpen);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className={[
          'relative w-full rounded-xl bg-card border border-border shadow-modal scale-in flex flex-col max-h-[90vh]',
          sizeMap[size],
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 id="modal-title" className="text-base font-700 text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Close modal"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto scrollbar-thin flex-1 px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-end gap-2 shrink-0 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
