'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import PartnerDashboardContent from './components/PartnerDashboardContent';
import ForcePasswordChangeModal from './components/ForcePasswordChangeModal';
import { useAuth } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function PartnerDashboardPage() {
  const { user } = useAuth();
  const [passwordChanged, setPasswordChanged] = useState(false);

  const subtitle = user
    ? `Welcome back, ${user?.name}${user?.partnerCode ? ` — ${user?.partnerCode}` : ''}`
    : 'Welcome back';

  // Show forced password change modal if user has a temp password and hasn't changed it yet this session
  const showForceModal = !passwordChanged && user?.isTempPassword === true;

  return (
    <ErrorBoundary label="Partner Dashboard">
      <AppLayout role="partner">
        <Topbar
          title="Partner Dashboard"
          subtitle={subtitle}
          role="partner"
        />
        <div className="fade-in">
          <PartnerDashboardContent />
        </div>

        {/* Forced password change — cannot be dismissed */}
        {showForceModal && (
          <ForcePasswordChangeModal onSuccess={() => setPasswordChanged(true)} />
        )}
      </AppLayout>
    </ErrorBoundary>
  );
}
