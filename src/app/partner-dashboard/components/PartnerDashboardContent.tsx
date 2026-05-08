import React from 'react';
import PartnerStatCards from './PartnerStatCards';
import PendingInvoiceBanner from './PendingInvoiceBanner';
import BureauPullsChart from './BureauPullsChart';
import WalletHealthBar from './WalletHealthBar';
import MiniRecentReports from './MiniRecentReports';

export default function PartnerDashboardContent() {
  return (
    <div className="space-y-6">
      {/* Pending Invoice Banner */}
      <PendingInvoiceBanner />

      {/* Stat Cards */}
      <PartnerStatCards />

      {/* Chart + Wallet Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BureauPullsChart />
        <WalletHealthBar />
      </div>

      {/* Mini Recent Reports */}
      <MiniRecentReports />
    </div>
  );
}