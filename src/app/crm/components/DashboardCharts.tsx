'use client';
import dynamic from 'next/dynamic';

const DashboardChartsInner = dynamic(() => import('./DashboardChartsInner'), { ssr: false });

export default function DashboardCharts() {
  return <DashboardChartsInner />;
}
