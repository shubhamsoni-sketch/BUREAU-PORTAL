'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type RiskLevel = 'Low' | 'Medium' | 'High';
export type ReportType = 'Consumer CIBIL' | 'Commercial CIBIL';

export interface CustomerRecord {
  id: string;
  customerName: string;
  mobile: string;
  pan: string;
  aadhaar: string;
  partnerId: string;
  partnerName: string;
  reportType: ReportType;
  creditScore: number;
  riskLevel: RiskLevel;
  reportId: string;
  pulledAt: string;
  rawJson: Record<string, unknown>;
}

interface CustomerMasterContextType {
  records: CustomerRecord[];
  addRecord: (record: Omit<CustomerRecord, 'id'>) => void;
  getRecordsByPartner: (partnerId: string) => CustomerRecord[];
}

const CustomerMasterContext = createContext<CustomerMasterContextType | null>(null);

// ─── Seed Data ─────────────────────────────────────────────────────────────────
const SEED_RECORDS: CustomerRecord[] = [
  {
    id: 'cm-001',
    customerName: 'Amit Sharma',
    mobile: '9876543210',
    pan: 'ABCPS1234A',
    aadhaar: '234567890123',
    partnerId: 'partner-001',
    partnerName: 'Rajesh Kumar (DSA)',
    reportType: 'Consumer CIBIL',
    creditScore: 742,
    riskLevel: 'Low',
    reportId: 'CIB-2026-00847',
    pulledAt: '2026-03-28 11:02',
    rawJson: { score: 742, riskLevel: 'Low', bureau: 'CIBIL', version: '3.1', enquiries: 2, accounts: 5 },
  },
  {
    id: 'cm-002',
    customerName: 'Priya Mehta',
    mobile: '9812345678',
    pan: 'BCDPM5678B',
    aadhaar: '345678901234',
    partnerId: 'partner-001',
    partnerName: 'Rajesh Kumar (DSA)',
    reportType: 'Consumer CIBIL',
    creditScore: 610,
    riskLevel: 'Medium',
    reportId: 'CIB-2026-00831',
    pulledAt: '2026-03-27 14:30',
    rawJson: { score: 610, riskLevel: 'Medium', bureau: 'CIBIL', version: '3.1', enquiries: 5, accounts: 3 },
  },
  {
    id: 'cm-003',
    customerName: 'Sunrise Traders',
    mobile: '9900112233',
    pan: 'CSTPL9012C',
    aadhaar: '456789012345',
    partnerId: 'partner-001',
    partnerName: 'Rajesh Kumar (DSA)',
    reportType: 'Commercial CIBIL',
    creditScore: 68,
    riskLevel: 'Medium',
    reportId: 'COM-2026-00312',
    pulledAt: '2026-03-26 16:20',
    rawJson: { score: 68, riskLevel: 'Medium', bureau: 'CIBIL', version: '2.0', tradelines: 4, overdues: 2 },
  },
  {
    id: 'cm-004',
    customerName: 'Ravi Patel',
    mobile: '9988776655',
    pan: 'DRPAT3456D',
    aadhaar: '567890123456',
    partnerId: 'partner-002',
    partnerName: 'Sunita Verma (DSA)',
    reportType: 'Consumer CIBIL',
    creditScore: 785,
    riskLevel: 'Low',
    reportId: 'CIB-2026-00820',
    pulledAt: '2026-03-25 13:10',
    rawJson: { score: 785, riskLevel: 'Low', bureau: 'CIBIL', version: '3.1', enquiries: 1, accounts: 7 },
  },
  {
    id: 'cm-005',
    customerName: 'Neha Singh',
    mobile: '9871234560',
    pan: 'ENSGH7890E',
    aadhaar: '678901234567',
    partnerId: 'partner-002',
    partnerName: 'Sunita Verma (DSA)',
    reportType: 'Consumer CIBIL',
    creditScore: 540,
    riskLevel: 'High',
    reportId: 'CIB-2026-00798',
    pulledAt: '2026-03-23 15:40',
    rawJson: { score: 540, riskLevel: 'High', bureau: 'CIBIL', version: '3.1', enquiries: 9, accounts: 2 },
  },
  {
    id: 'cm-006',
    customerName: 'Alpha Corp',
    mobile: '9700123456',
    pan: 'FALPC2345F',
    aadhaar: '789012345678',
    partnerId: 'partner-003',
    partnerName: 'Mohan Lal (DSA)',
    reportType: 'Commercial CIBIL',
    creditScore: 82,
    riskLevel: 'Low',
    reportId: 'COM-2026-00289',
    pulledAt: '2026-03-22 10:05',
    rawJson: { score: 82, riskLevel: 'Low', bureau: 'CIBIL', version: '2.0', tradelines: 6, overdues: 0 },
  },
  {
    id: 'cm-007',
    customerName: 'Suresh Nair',
    mobile: '9654321098',
    pan: 'GSNAI6789G',
    aadhaar: '890123456789',
    partnerId: 'partner-003',
    partnerName: 'Mohan Lal (DSA)',
    reportType: 'Consumer CIBIL',
    creditScore: 670,
    riskLevel: 'Medium',
    reportId: 'CIB-2026-00775',
    pulledAt: '2026-03-21 17:30',
    rawJson: { score: 670, riskLevel: 'Medium', bureau: 'CIBIL', version: '3.1', enquiries: 3, accounts: 4 },
  },
];

export function CustomerMasterProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<CustomerRecord[]>(SEED_RECORDS);

  const addRecord = useCallback((record: Omit<CustomerRecord, 'id'>) => {
    const newRecord: CustomerRecord = {
      ...record,
      id: `cm-${Date.now()}`,
    };
    setRecords((prev) => [newRecord, ...prev]);
  }, []);

  const getRecordsByPartner = useCallback(
    (partnerId: string) => records.filter((r) => r.partnerId === partnerId),
    [records]
  );

  return (
    <CustomerMasterContext.Provider value={{ records, addRecord, getRecordsByPartner }}>
      {children}
    </CustomerMasterContext.Provider>
  );
}

export function useCustomerMaster(): CustomerMasterContextType {
  const ctx = useContext(CustomerMasterContext);
  if (!ctx) throw new Error('useCustomerMaster must be used within CustomerMasterProvider');
  return ctx;
}
