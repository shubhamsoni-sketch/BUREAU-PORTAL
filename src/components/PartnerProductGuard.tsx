'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { normalizePartnerProductAccess } from '@/lib/partner-access';

type PartnerProductGuardProps = {
  expected: 'bureau_portal' | 'dsa_crm';
};

export default function PartnerProductGuard({ expected }: PartnerProductGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user || user.role !== 'partner') return;
    const productAccess = normalizePartnerProductAccess(user.productAccess);
    if (productAccess === expected) return;
    router.replace(expected === 'bureau_portal' ? '/crm' : '/partner-dashboard');
  }, [expected, isLoading, router, user]);

  return null;
}
