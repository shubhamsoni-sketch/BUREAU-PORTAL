'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Transaction {
  id: string;
  date: string;
  type: 'Recharge' | 'Deduction';
  description: string;
  amount: number;
  status: 'Success' | 'Pending' | 'Failed';
}

interface WalletContextType {
  balance: number;
  totalCredits: number;
  creditsUsed: number;
  transactions: Transaction[];
  recharge: (amount: number) => void;
  deduct: (amount: number, description: string) => boolean;
  LOW_BALANCE_THRESHOLD: number;
  CREDIT_COST: number;
}

const WalletContext = createContext<WalletContextType | null>(null);

const INITIAL_BALANCE = 350;
const TOTAL_CREDITS = 5000;
const LOW_BALANCE_THRESHOLD = 200;
const CREDIT_COST = 50;

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'txn-001', date: '2026-03-28 10:15', type: 'Recharge', description: 'Wallet Recharge', amount: 1000, status: 'Success' },
  { id: 'txn-002', date: '2026-03-28 11:02', type: 'Deduction', description: 'Consumer Bureau Pull – Amit Sharma', amount: -50, status: 'Success' },
  { id: 'txn-003', date: '2026-03-27 14:30', type: 'Deduction', description: 'Consumer Bureau Pull – Priya Mehta', amount: -50, status: 'Success' },
  { id: 'txn-004', date: '2026-03-27 09:45', type: 'Recharge', description: 'Wallet Recharge', amount: 500, status: 'Success' },
  { id: 'txn-005', date: '2026-03-26 16:20', type: 'Deduction', description: 'Commercial Bureau Pull – Sunrise Traders', amount: -50, status: 'Success' },
  { id: 'txn-006', date: '2026-03-25 13:10', type: 'Deduction', description: 'Consumer Bureau Pull – Ravi Patel', amount: -50, status: 'Success' },
  { id: 'txn-007', date: '2026-03-24 11:55', type: 'Recharge', description: 'Wallet Recharge', amount: 2000, status: 'Success' },
  { id: 'txn-008', date: '2026-03-23 15:40', type: 'Deduction', description: 'Consumer Bureau Pull – Neha Singh', amount: -50, status: 'Success' },
  { id: 'txn-009', date: '2026-03-22 10:05', type: 'Deduction', description: 'Commercial Bureau Pull – Alpha Corp', amount: -50, status: 'Success' },
  { id: 'txn-010', date: '2026-03-21 17:30', type: 'Deduction', description: 'Consumer Bureau Pull – Suresh Nair', amount: -50, status: 'Success' },
];

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  const creditsUsed = transactions
    .filter((t) => t.type === 'Deduction' && t.status === 'Success')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const recharge = useCallback((amount: number) => {
    setBalance((prev) => prev + amount);
    const newTxn: Transaction = {
      id: `txn-${Date.now()}`,
      date: new Date().toLocaleString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ''),
      type: 'Recharge',
      description: 'Wallet Recharge',
      amount,
      status: 'Success',
    };
    setTransactions((prev) => [newTxn, ...prev]);
  }, []);

  const deduct = useCallback((amount: number, description: string): boolean => {
    if (balance < amount) return false;
    setBalance((prev) => prev - amount);
    const newTxn: Transaction = {
      id: `txn-${Date.now()}`,
      date: new Date().toLocaleString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ''),
      type: 'Deduction',
      description,
      amount: -amount,
      status: 'Success',
    };
    setTransactions((prev) => [newTxn, ...prev]);
    return true;
  }, [balance]);

  return (
    <WalletContext.Provider
      value={{
        balance,
        totalCredits: TOTAL_CREDITS,
        creditsUsed,
        transactions,
        recharge,
        deduct,
        LOW_BALANCE_THRESHOLD,
        CREDIT_COST,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
