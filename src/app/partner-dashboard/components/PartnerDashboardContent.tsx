import React from 'react';
import PartnerStatCards from './PartnerStatCards';
import PartnerAccountHealth from './PartnerAccountHealth';
import RecentReportsList from './RecentReportsList';
import PartnerQuickActions from './PartnerQuickActions';

export default function PartnerDashboardContent() {
  return (
    <div className="space-y-6">
      {/* Top: Stat Cards */}
      <PartnerStatCards />

      {/* Middle: Account Health + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PartnerAccountHealth />
        </div>
        <div>
          <PartnerQuickActions />
        </div>
      </div>

      {/* Bottom: Recent Reports */}
      <RecentReportsList />
    </div>
  );
}