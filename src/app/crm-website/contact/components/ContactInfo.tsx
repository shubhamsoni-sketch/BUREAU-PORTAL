import React from 'react';

export default function ContactInfo() {
  return (
    <div className="space-y-5">
      <div className="bg-white border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-2">Contact</h3>
        <a
          href="mailto:support@credittrust.in"
          className="text-base font-bold text-primary hover:text-accent transition-colors break-all"
        >
          support@credittrust.in
        </a>
      </div>
    </div>
  );
}
