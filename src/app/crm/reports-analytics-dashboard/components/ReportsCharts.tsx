'use client';
import dynamic from 'next/dynamic';

const ReportsChartsInner = dynamic(() => import('./ReportsChartsInner'), { ssr: false });

export default function ReportsCharts() {
  return <ReportsChartsInner />;
}
