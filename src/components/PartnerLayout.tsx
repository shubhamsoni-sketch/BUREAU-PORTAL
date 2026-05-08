import React from 'react';
import PartnerSidebar from './PartnerSidebar';
import PartnerTopbar from './PartnerTopbar';

export default function PartnerLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <PartnerSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <PartnerTopbar title={title} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}