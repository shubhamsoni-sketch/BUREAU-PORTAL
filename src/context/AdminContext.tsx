'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { normalizePartnerProductAccess, type PartnerProductAccess } from '@/lib/partner-access';
import { authFetch } from '@/lib/supabase/auth-fetch';

export type PartnerStatus = 'Active' | 'Pending' | 'Suspended' | 'Terminated';

export interface Partner {
  id: string;
  partnerCode: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: PartnerStatus;
  walletBalance: number;
  reportsPulled: number;
  reportsThisMonth: number;
  joinedDate: string;
  lastActive: string;
  pricingPlan: string;
  productAccess: PartnerProductAccess;
  generatedPassword?: string;
}

export interface PendingRegistration {
  id: string;
  name: string;
  companyName: string;
  mobile: string;
  email: string;
  city: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface WalletTransaction {
  id: string;
  partnerId: string;
  partnerName: string;
  date: string;
  type: 'Credit' | 'Debit';
  description: string;
  amount: number;
  status: 'Success' | 'Pending' | 'Failed';
}

export interface PaymentRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  date: string;
  status: 'Success' | 'Pending' | 'Failed';
  method: string;
  reference: string;
}

export interface Agreement {
  id: string;
  partnerId: string;
  partnerName: string;
  templateName: string;
  assignedDate: string;
  status: 'Pending' | 'Signed' | 'Expired';
}

export interface AuditLog {
  id: string;
  action: 'Login' | 'Bureau Pull' | 'Wallet Recharge' | 'Partner Approval' | 'Partner Rejection' | 'Partner Deactivation';
  actor: string;
  actorRole: 'Admin' | 'Partner';
  target: string;
  timestamp: string;
  details: string;
}

export interface IntegrationService {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  apiKey: string;
  apiSecret: string;
  endpoint?: string;
  lastTested?: string;
  testStatus?: 'success' | 'failed' | null;
}

interface AdminContextType {
  partners: Partner[];
  partnersLoading: boolean;
  refreshPartners: () => Promise<void>;
  updatePartnerStatus: (id: string, status: PartnerStatus) => void;
  updatePartnerPricing: (id: string, plan: string) => void;
  updatePartnerProductAccess: (id: string, access: PartnerProductAccess) => void;
  adjustWallet: (partnerId: string, amount: number, type: 'Credit' | 'Debit', description: string) => Promise<void>;
  walletTransactions: WalletTransaction[];
  payments: PaymentRecord[];
  agreements: Agreement[];
  addAgreement: (agreement: Omit<Agreement, 'id'>) => void;
  updateAgreementStatus: (id: string, status: Agreement['status']) => void;
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id'>) => void;
  integrations: IntegrationService[];
  updateIntegration: (id: string, updates: Partial<IntegrationService>) => void;
  addPartner: (partner: Partner) => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

function mapDbStatus(dbStatus: string): PartnerStatus {
  switch (dbStatus) {
    case 'approved': return 'Active';
    case 'pending': return 'Pending';
    case 'suspended': return 'Suspended';
    case 'terminated': return 'Terminated';
    case 'rejected': return 'Terminated';
    default: return 'Pending';
  }
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [payments] = useState<PaymentRecord[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationService[]>([]);

  const loadPartners = useCallback(async () => {
    setPartnersLoading(true);
    try {
      const res = await authFetch('/api/admin-partners-list');
      const json = await res.json();

      if (res.ok && json.success && json.data && json.data.length > 0) {
        const mapped: Partner[] = json.data.map((row: any) => ({
          id: row.id,
          partnerCode: row.partner_code ?? '',
          fullName: row.name ?? '',
          email: row.email ?? '',
          phone: row.mobile ?? '',
          city: row.city ?? '',
          state: '',
          status: mapDbStatus(row.status),
          walletBalance: Number(row.wallet_balance ?? 0),
          reportsPulled: Number(row.reports_pulled ?? 0),
          reportsThisMonth: 0,
          joinedDate: row.created_at
            ? new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—',
          lastActive: '—',
          pricingPlan: row.pricing_plan ?? 'Basic',
          productAccess: normalizePartnerProductAccess(row.product_access),
        }));
        setPartners(mapped);
      } else {
        setPartners([]);
      }
    } catch (err) {
      console.error('[AdminContext] loadPartners threw:', err);
      setPartners([]);
    } finally {
      setPartnersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const updatePartnerStatus = useCallback((id: string, status: PartnerStatus) => {
    setPartners((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    // Persist to DB
    authFetch('/api/update-partner-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: id, status }),
    }).catch((err) => console.error('[AdminContext] updatePartnerStatus persist error:', err));
  }, []);

  const updatePartnerPricing = useCallback((id: string, plan: string) => {
    setPartners((prev) => prev.map((p) => p.id === id ? { ...p, pricingPlan: plan } : p));
    // Persist to DB
    authFetch('/api/update-partner-pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: id, pricing_plan: plan }),
    }).catch((err) => console.error('[AdminContext] updatePartnerPricing persist error:', err));
  }, []);

  const updatePartnerProductAccess = useCallback((id: string, access: PartnerProductAccess) => {
    setPartners((prev) => prev.map((p) => p.id === id ? { ...p, productAccess: access } : p));
    authFetch('/api/update-partner-product-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: id, product_access: access }),
    }).catch((err) => {
      console.error('[AdminContext] updatePartnerProductAccess persist error:', err);
      loadPartners();
    });
  }, [loadPartners]);

  const adjustWallet = useCallback(async (partnerId: string, amount: number, type: 'Credit' | 'Debit', description: string) => {
    const supabase = createClient();
    const partner = partners.find((p) => p.id === partnerId);
    const newBalance = type === 'Credit'
      ? (partner?.walletBalance ?? 0) + amount
      : Math.max(0, (partner?.walletBalance ?? 0) - amount);

    // Optimistically update UI
    setPartners((prev) => prev.map((p) => {
      if (p.id !== partnerId) return p;
      return { ...p, walletBalance: newBalance };
    }));

    const newTxn: WalletTransaction = {
      id: `wt-${Date.now()}`,
      partnerId,
      partnerName: partner?.fullName ?? 'Unknown',
      date: new Date().toLocaleString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ''),
      type,
      description,
      amount,
      status: 'Success',
    };
    setWalletTransactions((prev) => [newTxn, ...prev]);

    // Persist to Supabase
    try {
      // 1. Update wallet_balance on partners table
      await supabase
        .from('partners')
        .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', partnerId);

      // 2. Insert wallet_transaction row
      const { data: { session } } = await supabase.auth.getSession();
      await supabase
        .from('wallet_transactions')
        .insert({
          partner_id: partnerId,
          type: type === 'Credit' ? 'credit' : 'debit',
          amount,
          description,
          transaction_type: 'manual_adjustment',
          performed_by: session?.user?.id ?? null,
          metadata: { source: 'admin_manual_adjustment' },
        });
    } catch (err) {
      console.error('[AdminContext] adjustWallet persist error:', err);
    }
  }, [partners]);

  const addAgreement = useCallback((agreement: Omit<Agreement, 'id'>) => {
    setAgreements((prev) => [{ ...agreement, id: `agr-${Date.now()}` }, ...prev]);
  }, []);

  const updateAgreementStatus = useCallback((id: string, status: Agreement['status']) => {
    setAgreements((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
  }, []);

  const addAuditLog = useCallback((log: Omit<AuditLog, 'id'>) => {
    setAuditLogs((prev) => [{ ...log, id: `log-${Date.now()}` }, ...prev]);
  }, []);

  const addPartner = useCallback((partner: Partner) => {
    // Optimistically add to list, then refresh from Supabase to get the real persisted data
    setPartners((prev) => [partner, ...prev]);
    // Re-fetch after a short delay to sync with DB
    setTimeout(() => {
      loadPartners();
    }, 1000);
  }, [loadPartners]);

  const updateIntegration = useCallback((id: string, updates: Partial<IntegrationService>) => {
    setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, ...updates } : i));
  }, []);

  return (
    <AdminContext.Provider value={{
      partners, partnersLoading, refreshPartners: loadPartners,
      updatePartnerStatus, updatePartnerPricing, updatePartnerProductAccess,
      adjustWallet, walletTransactions, payments,
      agreements, addAgreement, updateAgreementStatus,
      auditLogs, addAuditLog,
      integrations, updateIntegration,
      addPartner,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
