import React from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import PartnerDashboardContent from './components/PartnerDashboardContent';

export default function PartnerDashboardPage() {
  return (
    <AppLayout role="partner">
      <Topbar
        title="Partner Dashboard"
        subtitle="Welcome back, Rajesh Kumar — DSA-2024-001"
        role="partner"
        actions={
          <a
            href="/pull-cibil"
            className="btn-primary"
          >
            Pull CIBIL Report
          </a>
        }
      />
      <div className="fade-in">
        <PartnerDashboardContent />
      </div>
    </AppLayout>
  );
}