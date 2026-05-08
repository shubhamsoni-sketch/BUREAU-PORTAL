'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  amount: number;
  creditsAdded: number;
  paymentMode: string;
  status: 'paid' | 'Paid' | 'Pending' | 'Cancelled' | 'draft' | 'raised';
  transactionRef: string | null;
  notes: string;
  issuedAt: string;
  utrNumber?: string | null;
  paidAt?: string | null;
}

export interface InvoiceSettings {
  id: string;
  companyName: string;
  companyAddress: string;
  gstNumber: string | null;
  logoUrl: string | null;
}

interface InvoiceContextType {
  invoices: Invoice[];
  settings: InvoiceSettings | null;
  isLoading: boolean;
  fetchInvoices: () => Promise<void>;
  fetchPartnerInvoices: (partnerId: string) => Promise<Invoice[]>;
  createInvoice: (data: Omit<Invoice, 'id'>) => Promise<Invoice | null>;
  updateSettings: (data: Partial<InvoiceSettings>) => Promise<void>;
  fetchSettings: () => Promise<void>;
  raiseInvoice: (invoiceId: string) => Promise<boolean>;
  markAsPaid: (invoiceId: string, paymentMode: string, utrNumber?: string) => Promise<boolean>;
}

const InvoiceContext = createContext<InvoiceContextType | null>(null);

function toInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    invoiceNumber: row.invoice_number as string,
    partnerId: row.partner_id as string,
    partnerName: row.partner_name as string,
    partnerEmail: (row.partner_email as string) || '',
    amount: Number(row.amount),
    creditsAdded: Number(row.credits_added),
    paymentMode: (row.payment_mode as string) || 'UPI',
    status: (row.status as Invoice['status']) || 'Paid',
    transactionRef: (row.transaction_ref as string) || null,
    notes: (row.notes as string) || '',
    issuedAt: row.issued_at as string,
    utrNumber: (row.utr_number as string) || null,
    paidAt: (row.paid_at as string) || null,
  };
}

function toSettings(row: Record<string, unknown>): InvoiceSettings {
  return {
    id: row.id as string,
    companyName: (row.company_name as string) || '',
    companyAddress: (row.company_address as string) || '',
    gstNumber: (row.gst_number as string) || null,
    logoUrl: (row.logo_url as string) || null,
  };
}

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use service-role API route to bypass RLS
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin-invoices-list');
      const json = await res.json();
      if (json.success && json.data) {
        setInvoices(json.data.map((r: Record<string, unknown>) => toInvoice(r)));
      } else {
        console.error('[InvoiceContext] fetchInvoices error:', json.error);
      }
    } catch (err) {
      console.error('[InvoiceContext] fetchInvoices threw:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Partner invoices — use service-role API route with partner_id filter
  const fetchPartnerInvoices = useCallback(async (partnerId: string): Promise<Invoice[]> => {
    try {
      const res = await fetch(`/api/admin-invoices-list?partner_id=${partnerId}&status=raised,paid`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.map((r: Record<string, unknown>) => toInvoice(r));
      }
    } catch (err) {
      console.error('[InvoiceContext] fetchPartnerInvoices threw:', err);
    }
    return [];
  }, []);

  const createInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id'>): Promise<Invoice | null> => {
    try {
      const res = await fetch('/api/admin-invoices-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_number: invoiceData.invoiceNumber,
          partner_id: invoiceData.partnerId,
          partner_name: invoiceData.partnerName,
          partner_email: invoiceData.partnerEmail,
          amount: invoiceData.amount,
          credits_added: invoiceData.creditsAdded,
          payment_mode: invoiceData.paymentMode,
          status: invoiceData.status,
          transaction_ref: invoiceData.transactionRef,
          notes: invoiceData.notes || '',
          issued_at: invoiceData.issuedAt,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newInvoice = toInvoice(json.data as Record<string, unknown>);
        setInvoices((prev) => [newInvoice, ...prev]);
        return newInvoice;
      }
    } catch (err) {
      console.error('[InvoiceContext] createInvoice threw:', err);
    }
    return null;
  }, []);

  const raiseInvoice = useCallback(async (invoiceId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/raise-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setInvoices((prev) =>
          prev.map((inv) => inv.id === invoiceId ? { ...inv, status: 'raised' as const } : inv)
        );
        return true;
      }
    } catch (err) {
      console.error('[InvoiceContext] raiseInvoice threw:', err);
    }
    return false;
  }, []);

  const markAsPaid = useCallback(async (invoiceId: string, paymentMode: string, utrNumber?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/mark-invoice-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoiceId,
          payment_mode: paymentMode,
          utr_number: utrNumber || null,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoiceId
              ? { ...inv, status: 'paid' as const, paymentMode, utrNumber: utrNumber || null }
              : inv
          )
        );
        return true;
      }
    } catch (err) {
      console.error('[InvoiceContext] markAsPaid threw:', err);
    }
    return false;
  }, []);

  // Use service-role API route to bypass RLS
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin-invoice-settings');
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(toSettings(json.data as Record<string, unknown>));
      }
    } catch (err) {
      console.error('[InvoiceContext] fetchSettings threw:', err);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<InvoiceSettings>) => {
    try {
      const body: Record<string, unknown> = {};
      if (settings?.id) body.id = settings.id;
      if (updates.companyName !== undefined) body.company_name = updates.companyName;
      if (updates.companyAddress !== undefined) body.company_address = updates.companyAddress;
      if (updates.gstNumber !== undefined) body.gst_number = updates.gstNumber;
      if (updates.logoUrl !== undefined) body.logo_url = updates.logoUrl;

      const res = await fetch('/api/admin-invoice-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(toSettings(json.data as Record<string, unknown>));
      }
    } catch (err) {
      console.error('[InvoiceContext] updateSettings threw:', err);
    }
  }, [settings]);

  return (
    <InvoiceContext.Provider value={{
      invoices,
      settings,
      isLoading,
      fetchInvoices,
      fetchPartnerInvoices,
      createInvoice,
      updateSettings,
      fetchSettings,
      raiseInvoice,
      markAsPaid,
    }}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice(): InvoiceContextType {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoice must be used within InvoiceProvider');
  return ctx;
}
