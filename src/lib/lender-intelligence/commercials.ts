export type PayoutBasis = 'flat' | 'percentage' | 'slab' | 'custom';

type PayoutSlab = {
  min?: number;
  max?: number;
  basis?: 'flat' | 'percentage';
  value?: number;
};

export function validateCommercialPayoutTerms(input: {
  basis: string;
  value?: unknown;
  slabs?: unknown;
}) {
  const errors: string[] = [];
  if (!['flat', 'percentage', 'slab', 'custom'].includes(input.basis))
    return ['Invalid payout basis'];
  if (input.basis === 'custom') return errors;
  if (input.basis !== 'slab') {
    const value = Number(input.value);
    if (!Number.isFinite(value) || value <= 0)
      errors.push('Payout value must be greater than zero');
    if (input.basis === 'percentage' && value > 100)
      errors.push('Payout percentage cannot exceed 100');
    return errors;
  }
  if (!Array.isArray(input.slabs) || !input.slabs.length)
    return ['At least one payout slab is required'];
  let priorMax = -1;
  let openEndedSeen = false;
  for (const [index, raw] of input.slabs.entries()) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      errors.push(`Slab ${index + 1} must be an object`);
      continue;
    }
    const slab = raw as PayoutSlab;
    const min = Number(slab.min);
    const max = slab.max === null || slab.max === undefined ? null : Number(slab.max);
    const value = Number(slab.value);
    if (!Number.isFinite(min) || min < 0)
      errors.push(`Slab ${index + 1} minimum must be zero or more`);
    if (max !== null && (!Number.isFinite(max) || max < min))
      errors.push(`Slab ${index + 1} maximum must be at least its minimum`);
    if (!['flat', 'percentage'].includes(slab.basis || ''))
      errors.push(`Slab ${index + 1} basis must be flat or percentage`);
    if (!Number.isFinite(value) || value <= 0 || (slab.basis === 'percentage' && value > 100))
      errors.push(`Slab ${index + 1} value is invalid`);
    if (openEndedSeen || (Number.isFinite(min) && min <= priorMax))
      errors.push(`Slab ${index + 1} overlaps or follows an open-ended slab`);
    if (max === null) openEndedSeen = true;
    else if (Number.isFinite(max)) priorMax = max;
  }
  return errors;
}

export function calculateExpectedPayout(input: {
  basis: PayoutBasis;
  value?: number | null;
  slabs?: unknown;
  disbursedAmount: number;
}) {
  const amount = Math.max(0, Number(input.disbursedAmount || 0));
  const value = Math.max(0, Number(input.value || 0));
  if (input.basis === 'flat') return Math.round(value * 100) / 100;
  if (input.basis === 'percentage') return Math.round(amount * (value / 100) * 100) / 100;
  if (input.basis !== 'slab' || !Array.isArray(input.slabs)) return 0;

  const slab = (input.slabs as PayoutSlab[]).find((item) => {
    const min = Math.max(0, Number(item.min || 0));
    const max =
      item.max === null || item.max === undefined ? Number.POSITIVE_INFINITY : Number(item.max);
    return amount >= min && amount <= max;
  });
  if (!slab) return 0;
  const slabValue = Math.max(0, Number(slab.value || 0));
  return slab.basis === 'flat'
    ? Math.round(slabValue * 100) / 100
    : Math.round(amount * (slabValue / 100) * 100) / 100;
}

export type CommercialTaxTerms = {
  ratePercent?: number;
  reverseCharge?: boolean;
};

export function calculateCommercialTax(payoutAmount: number, terms: unknown) {
  const payout = Math.max(0, Number(payoutAmount || 0));
  if (!terms || typeof terms !== 'object' || Array.isArray(terms)) return 0;
  const tax = terms as CommercialTaxTerms;
  if (tax.reverseCharge) return 0;
  const rate = Number(tax.ratePercent || 0);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) return 0;
  return Math.round(payout * (rate / 100) * 100) / 100;
}

export type ClawbackTerms = {
  windowDays?: number;
  basis?: 'full' | 'percentage' | 'fixed';
  value?: number;
};

export function calculateClawback(input: {
  payoutAmount: number;
  terms: unknown;
  disbursedAt: string | Date;
  triggerAt: string | Date;
}) {
  if (!input.terms || typeof input.terms !== 'object' || Array.isArray(input.terms)) return 0;
  const terms = input.terms as ClawbackTerms;
  const windowDays = Number(terms.windowDays);
  const disbursedAt = new Date(input.disbursedAt).getTime();
  const triggerAt = new Date(input.triggerAt).getTime();
  if (
    !Number.isFinite(windowDays) ||
    windowDays < 0 ||
    !Number.isFinite(disbursedAt) ||
    !Number.isFinite(triggerAt)
  )
    return 0;
  const elapsedDays = (triggerAt - disbursedAt) / 86_400_000;
  if (elapsedDays < 0 || elapsedDays > windowDays) return 0;
  const payout = Math.max(0, Number(input.payoutAmount || 0));
  const value = Math.max(0, Number(terms.value || 0));
  if (terms.basis === 'full') return Math.round(payout * 100) / 100;
  if (terms.basis === 'percentage')
    return Math.round(Math.min(payout, payout * (value / 100)) * 100) / 100;
  if (terms.basis === 'fixed') return Math.round(Math.min(payout, value) * 100) / 100;
  return 0;
}
