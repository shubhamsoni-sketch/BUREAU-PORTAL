export type CrmLender = {
  id: string;
  name: string;
  type: 'bank' | 'nbfc';
  products: string[];
  roiMin: number;
  roiMax: number;
  maxLoan: number;
  processingFee: string;
  approvalRate: number;
  activeApps: number;
  scoreCutoff: number;
  minIncome: number;
  maxTenure: number;
  foirLimit: number;
  ltvMax: number;
  states: string[];
  status: 'active' | 'inactive';
  contact: string;
  rm: string;
  avgTat: string;
};

export type LenderMatchInput = {
  score: number | null;
  loanType: string;
  loanAmount: number;
  monthlyIncome: number;
  tenure: number;
  foir: number;
  state: string;
  maxLoanAmount: number;
};

export const defaultCrmLenders: CrmLender[] = [
  {
    id: 'lndr-001',
    name: 'HDFC Bank',
    type: 'bank',
    products: ['home_loan', 'lap', 'personal_loan'],
    roiMin: 8.5,
    roiMax: 12,
    maxLoan: 100000000,
    processingFee: '0.50%',
    approvalRate: 84.2,
    activeApps: 28,
    scoreCutoff: 700,
    minIncome: 50000,
    maxTenure: 360,
    foirLimit: 55,
    ltvMax: 80,
    states: [],
    status: 'active',
    contact: '+91 22 6652 6652',
    rm: 'Sunil Kapoor',
    avgTat: '4-6 days',
  },
  {
    id: 'lndr-002',
    name: 'ICICI Bank',
    type: 'bank',
    products: ['home_loan', 'personal_loan', 'car_loan', 'business_loan'],
    roiMin: 8.75,
    roiMax: 13.5,
    maxLoan: 50000000,
    processingFee: '0.50%',
    approvalRate: 78.6,
    activeApps: 19,
    scoreCutoff: 700,
    minIncome: 45000,
    maxTenure: 300,
    foirLimit: 50,
    ltvMax: 75,
    states: [],
    status: 'active',
    contact: '+91 22 2653 1414',
    rm: 'Meera Pillai',
    avgTat: '5-7 days',
  },
  {
    id: 'lndr-003',
    name: 'Bajaj Finserv',
    type: 'nbfc',
    products: ['personal_loan', 'business_loan'],
    roiMin: 11,
    roiMax: 24,
    maxLoan: 4000000,
    processingFee: '1.00-3.00%',
    approvalRate: 91.4,
    activeApps: 34,
    scoreCutoff: 685,
    minIncome: 30000,
    maxTenure: 84,
    foirLimit: 60,
    ltvMax: 0,
    states: [],
    status: 'active',
    contact: '+91 20 3957 5152',
    rm: 'Rohit Sharma',
    avgTat: '1-2 days',
  },
  {
    id: 'lndr-004',
    name: 'Tata Capital',
    type: 'nbfc',
    products: ['business_loan', 'personal_loan', 'lap'],
    roiMin: 10.99,
    roiMax: 18,
    maxLoan: 30000000,
    processingFee: '1.50-2.50%',
    approvalRate: 82.7,
    activeApps: 22,
    scoreCutoff: 680,
    minIncome: 35000,
    maxTenure: 120,
    foirLimit: 55,
    ltvMax: 70,
    states: [],
    status: 'active',
    contact: '+91 22 6606 5100',
    rm: 'Priya Bhat',
    avgTat: '3-5 days',
  },
  {
    id: 'lndr-005',
    name: 'Fullerton India',
    type: 'nbfc',
    products: ['personal_loan', 'business_loan'],
    roiMin: 14,
    roiMax: 24,
    maxLoan: 2500000,
    processingFee: '2.00-3.00%',
    approvalRate: 88.9,
    activeApps: 9,
    scoreCutoff: 650,
    minIncome: 25000,
    maxTenure: 60,
    foirLimit: 65,
    ltvMax: 0,
    states: [],
    status: 'active',
    contact: '+91 44 6656 0000',
    rm: 'Kiran Rao',
    avgTat: '1-2 days',
  },
];

export function normalizeLenders(value: unknown): CrmLender[] {
  if (!Array.isArray(value)) return defaultCrmLenders;
  return value
    .filter((item): item is Partial<CrmLender> => Boolean(item && typeof item === 'object'))
    .map(
      (lender): CrmLender => ({
        id: String(lender.id || crypto.randomUUID()),
        name: String(lender.name || ''),
        type: lender.type === 'nbfc' ? 'nbfc' : 'bank',
        products: Array.isArray(lender.products) ? lender.products.map(String) : [],
        roiMin: Number(lender.roiMin || 0),
        roiMax: Number(lender.roiMax || 0),
        maxLoan: Number(lender.maxLoan || 0),
        processingFee: String(lender.processingFee || ''),
        approvalRate: Number(lender.approvalRate || 0),
        activeApps: Number(lender.activeApps || 0),
        scoreCutoff: Number(lender.scoreCutoff || 0),
        minIncome: Number(lender.minIncome || 0),
        maxTenure: Number(lender.maxTenure || 0),
        foirLimit: Number(lender.foirLimit || 0),
        ltvMax: Number(lender.ltvMax || 0),
        states: Array.isArray(lender.states) ? lender.states.map(String) : [],
        status: lender.status === 'inactive' ? 'inactive' : 'active',
        contact: String(lender.contact || ''),
        rm: String(lender.rm || ''),
        avgTat: String(lender.avgTat || ''),
      })
    )
    .filter((lender) => lender.name);
}

export function matchLenders(lenders: CrmLender[], input: LenderMatchInput) {
  const state = input.state.toUpperCase();
  return lenders
    .filter((lender) => {
      if (lender.status !== 'active') return false;
      if (!lender.products.includes(input.loanType)) return false;
      if (!input.score || input.score < lender.scoreCutoff) return false;
      if (input.loanAmount > lender.maxLoan) return false;
      if (lender.minIncome > 0 && input.monthlyIncome < lender.minIncome) return false;
      if (lender.maxTenure > 0 && input.tenure > lender.maxTenure) return false;
      if (lender.foirLimit > 0 && input.foir > lender.foirLimit) return false;
      if (
        lender.states.length &&
        state &&
        !lender.states.map((s) => s.toUpperCase()).includes(state)
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.roiMin - b.roiMin || b.approvalRate - a.approvalRate)
    .map((lender) => ({
      name: lender.name,
      roi: `${lender.roiMin}-${lender.roiMax}%`,
      maxLoan: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(
        Math.min(input.loanAmount || input.maxLoanAmount || lender.maxLoan, lender.maxLoan)
      ),
      approvalRate: lender.approvalRate,
      tat: lender.avgTat,
    }));
}
