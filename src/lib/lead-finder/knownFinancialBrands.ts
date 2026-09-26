import type { BusinessSegment } from './types';

type BrandRule = {
  name: string;
  segment: BusinessSegment;
  corporate: boolean;
  aliases?: string[];
};

export const knownBrandRules: BrandRule[] = [
  { name: 'HDFC Bank', segment: 'bank', corporate: true, aliases: ['hdfc'] },
  {
    name: 'IDFC FIRST Bank',
    segment: 'bank',
    corporate: true,
    aliases: ['idfc first', 'idfc bank'],
  },
  { name: 'Axis Bank', segment: 'bank', corporate: true, aliases: ['axis bank'] },
  { name: 'ICICI Bank', segment: 'bank', corporate: true, aliases: ['icici bank'] },
  {
    name: 'Kotak Mahindra Bank',
    segment: 'bank',
    corporate: true,
    aliases: ['kotak bank', 'kotak mahindra'],
  },
  { name: 'Bajaj Finance', segment: 'lender_nbfc', corporate: true, aliases: ['bajaj finserv'] },
  { name: 'Piramal Finance', segment: 'lender_nbfc', corporate: true },
  { name: 'Shriram Finance', segment: 'lender_nbfc', corporate: true },
  { name: 'IIFL', segment: 'lender_nbfc', corporate: true },
  { name: 'TVS Credit', segment: 'lender_nbfc', corporate: true },
  { name: 'SMFG India Credit', segment: 'lender_nbfc', corporate: true, aliases: ['fullerton'] },
  { name: 'MAS Financial Services', segment: 'lender_nbfc', corporate: true },
  { name: 'Muthoot Finance', segment: 'gold_loan_lender', corporate: true },
  { name: 'Manappuram Finance', segment: 'gold_loan_lender', corporate: true },
  { name: 'Aavas Financiers', segment: 'housing_finance', corporate: true },
  { name: 'PNB Housing Finance', segment: 'housing_finance', corporate: true },
  { name: 'Aditya Birla Housing Finance', segment: 'housing_finance', corporate: true },
  { name: 'Motilal Oswal Home Finance', segment: 'housing_finance', corporate: true },
  {
    name: 'Andromeda Sales',
    segment: 'enterprise_dsa_aggregator',
    corporate: true,
    aliases: ['andromeda'],
  },
  { name: 'Rokadaa', segment: 'enterprise_dsa_aggregator', corporate: true },
];

const suffixRegex =
  /\b(private|pvt|limited|ltd|finance|financial|services|service|india|branch|office)\b/gi;

export function normalizeBrandText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(suffixRegex, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function detectKnownBrand(name?: string | null, website?: string | null) {
  const haystack = normalizeBrandText(`${name || ''} ${website || ''}`);
  for (const rule of knownBrandRules) {
    const candidates = [rule.name, ...(rule.aliases || [])].map(normalizeBrandText);
    if (candidates.some((candidate) => candidate && haystack.includes(candidate))) {
      return {
        parent_brand: rule.name,
        segment: rule.segment,
        is_corporate_branch: rule.corporate,
      };
    }
  }
  return null;
}
