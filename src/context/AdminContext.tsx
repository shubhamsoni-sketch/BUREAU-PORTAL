'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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

const SEED_AGREEMENTS: Agreement[] = [
  { id: 'agr-001', partnerId: 'partner-001', partnerName: 'Rajesh Kumar Sharma', templateName: 'DSA Partner Agreement v2.1', assignedDate: '2024-01-12', status: 'Signed' },
  { id: 'agr-002', partnerId: 'partner-002', partnerName: 'Priya Nair', templateName: 'DSA Partner Agreement v2.1', assignedDate: '2024-02-03', status: 'Signed' },
  { id: 'agr-003', partnerId: 'partner-003', partnerName: 'Amit Verma', templateName: 'DSA Partner Agreement v2.2', assignedDate: '2026-03-28', status: 'Pending' },
  { id: 'agr-004', partnerId: 'partner-004', partnerName: 'Sunita Agarwal', templateName: 'DSA Partner Agreement v2.0', assignedDate: '2023-08-15', status: 'Signed' },
  { id: 'agr-005', partnerId: 'partner-006', partnerName: 'Kavitha Rajan', templateName: 'DSA Partner Agreement v2.1', assignedDate: '2024-03-11', status: 'Signed' },
  { id: 'agr-006', partnerId: 'partner-008', partnerName: 'Ankita Singh', templateName: 'DSA Partner Agreement v2.2', assignedDate: '2026-03-30', status: 'Pending' },
  { id: 'agr-007', partnerId: 'partner-011', partnerName: 'Harpreet Singh Bedi', templateName: 'DSA Partner Agreement v2.2', assignedDate: '2026-04-01', status: 'Pending' },
  { id: 'agr-008', partnerId: 'partner-010', partnerName: 'Meenakshi Iyer', templateName: 'DSA Partner Agreement v1.9', assignedDate: '2022-09-07', status: 'Expired' },
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-001', action: 'Login', actor: 'Super Admin', actorRole: 'Admin', target: 'Admin Panel', timestamp: '2026-04-03 09:00', details: 'Admin logged in from 192.168.1.1' },
  { id: 'log-002', action: 'Partner Approval', actor: 'Super Admin', actorRole: 'Admin', target: 'Rajesh Kumar Sharma', timestamp: '2026-04-02 14:30', details: 'Partner DSA-2024-001 approved and activated' },
  { id: 'log-003', action: 'Bureau Pull', actor: 'Rajesh Kumar Sharma', actorRole: 'Partner', target: 'Amit Sharma (PAN: ABCPS1234A)', timestamp: '2026-03-28 11:02', details: 'Consumer Bureau pulled. Score: 742. ₹50 deducted.' },
  { id: 'log-004', action: 'Wallet Recharge', actor: 'Rajesh Kumar Sharma', actorRole: 'Partner', target: 'Wallet (partner-001)', timestamp: '2026-04-01 10:15', details: '₹5000 recharged via UPI. Ref: UPI2026040100123' },
  { id: 'log-005', action: 'Login', actor: 'Priya Nair', actorRole: 'Partner', target: 'Partner Portal', timestamp: '2026-03-31 09:15', details: 'Partner logged in from 10.0.0.5' },
  { id: 'log-006', action: 'Bureau Pull', actor: 'Priya Nair', actorRole: 'Partner', target: 'Ravi Patel (PAN: DRPAT3456D)', timestamp: '2026-03-25 13:10', details: 'Consumer Bureau pulled. Score: 785. ₹50 deducted.' },
  { id: 'log-007', action: 'Partner Rejection', actor: 'Super Admin', actorRole: 'Admin', target: 'Mohammed Farhan', timestamp: '2026-03-20 11:00', details: 'Partner DSA-2023-054 suspended due to policy violation' },
  { id: 'log-008', action: 'Wallet Recharge', actor: 'Kavitha Rajan', actorRole: 'Partner', target: 'Wallet (partner-006)', timestamp: '2026-03-29 16:20', details: '₹10000 recharged via UPI. Ref: UPI2026032900789' },
  { id: 'log-009', action: 'Partner Approval', actor: 'Super Admin', actorRole: 'Admin', target: 'Kavitha Rajan', timestamp: '2024-03-11 10:00', details: 'Partner DSA-2024-008 approved and activated' },
  { id: 'log-010', action: 'Login', actor: 'Super Admin', actorRole: 'Admin', target: 'Admin Panel', timestamp: '2026-04-02 08:45', details: 'Admin logged in from 192.168.1.1' },
  { id: 'log-011', action: 'Bureau Pull', actor: 'Kavitha Rajan', actorRole: 'Partner', target: 'Neha Singh (PAN: ENSGH7890E)', timestamp: '2026-03-23 15:40', details: 'Consumer Bureau pulled. Score: 540. ₹50 deducted.' },
  { id: 'log-012', action: 'Partner Deactivation', actor: 'Super Admin', actorRole: 'Admin', target: 'Meenakshi Iyer', timestamp: '2026-01-03 12:00', details: 'Partner DSA-2022-044 terminated' },
];

const SEED_INTEGRATIONS: IntegrationService[] = [
  { id: 'int-stripe', name: 'Stripe', category: 'Payment Gateway', enabled: false, apiKey: '', apiSecret: '', endpoint: 'https://api.stripe.com/v1', lastTested: undefined, testStatus: null },
  { id: 'int-001', name: 'Razorpay', category: 'Payment Gateway', enabled: true, apiKey: 'rzp_live_xxxxxxxxxxxx', apiSecret: '', endpoint: 'https://api.razorpay.com/v1', lastTested: '2026-04-01', testStatus: 'success' },
  { id: 'int-002', name: 'MSG91', category: 'SMS/OTP Service', enabled: true, apiKey: 'msg91_api_key_here', apiSecret: '', endpoint: 'https://api.msg91.com', lastTested: '2026-03-30', testStatus: 'success' },
  { id: 'int-003', name: 'SendGrid', category: 'Email Service', enabled: false, apiKey: '', apiSecret: '', endpoint: 'https://api.sendgrid.com/v3', lastTested: undefined, testStatus: null },
  { id: 'int-004', name: 'Leegality', category: 'eSign Service', enabled: false, apiKey: '', apiSecret: '', endpoint: 'https://api.leegality.com', lastTested: undefined, testStatus: null },
  { id: 'int-005', name: 'Bureau API', category: 'Bureau API', enabled: true, apiKey: 'bureau_api_key_here', apiSecret: 'bureau_secret_here', endpoint: 'https://api.bureau.example/v2', lastTested: '2026-04-01', testStatus: 'success' },
];

function generatePassword(name: string): string {
  const base = name.split(' ')[0].replace(/[^a-zA-Z]/g, '');
  const cap = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${cap}@${num}`;
}

function generatePartnerCode(existingCount: number): string {
  const year = new Date().getFullYear();
  const num = String(existingCount + 1).padStart(3, '0');
  return `DSA-${year}-${num}`;
}

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
  const [agreements, setAgreements] = useState<Agreement[]>(SEED_AGREEMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(SEED_AUDIT_LOGS);
  const [integrations, setIntegrations] = useState<IntegrationService[]>(SEED_INTEGRATIONS);

  const loadPartners = useCallback(async () => {
    setPartnersLoading(true);
    try {
      const res = await fetch('/api/admin-partners-list');
      const json = await res.json();

      console.log('[AdminContext] partners fetch:', { count: json.data?.length ?? 0, error: json.error });

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
        }));
        setPartners(mapped);
      } else {
        console.warn('[AdminContext] No partners returned or error — using empty array', json.error);
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
    fetch('/api/update-partner-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: id, status }),
    }).catch((err) => console.error('[AdminContext] updatePartnerStatus persist error:', err));
  }, []);

  const updatePartnerPricing = useCallback((id: string, plan: string) => {
    setPartners((prev) => prev.map((p) => p.id === id ? { ...p, pricingPlan: plan } : p));
    // Persist to DB
    fetch('/api/update-partner-pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: id, pricing_plan: plan }),
    }).catch((err) => console.error('[AdminContext] updatePartnerPricing persist error:', err));
  }, []);

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
      updatePartnerStatus, updatePartnerPricing,
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
