import type { ReactNode } from 'react';
import FintechShell from '@/components/fintech/FintechShell';

export default function AdminFintechLayout({ children }: { children: ReactNode }) {
  return <FintechShell>{children}</FintechShell>;
}
