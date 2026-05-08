import React from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import PartnersTableSection from './components/PartnersTableSection';
import PartnerPageHeader from './components/PartnerPageHeader';

export default function PartnersPage() {
  return (
    <AppLayout role="admin">
      <Topbar
        title="Partner Management"
        subtitle="Manage DSA agents and their platform access"
        role="admin"
      />
      <div className="fade-in">
        <PartnerPageHeader />
        <PartnersTableSection />
      </div>
    </AppLayout>
  );
}