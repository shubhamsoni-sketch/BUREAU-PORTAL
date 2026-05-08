import React from 'react';
import Sidebar from './Sidebar';

type AppLayoutProps = {
  children: React.ReactNode;
  role: 'admin' | 'partner';
};

export default function AppLayout({ children, role }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={role} />
      {/* Main content — offset by sidebar width on desktop */}
      <main
        className="min-h-screen transition-all duration-300"
        style={{
          paddingLeft: 'var(--sidebar-width)',
          paddingTop: 'var(--header-height)',
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}