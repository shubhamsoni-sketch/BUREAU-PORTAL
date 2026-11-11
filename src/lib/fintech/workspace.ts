export const fintechSections = [
  {
    slug: 'lenders',
    title: 'Lender onboarding',
    navLabel: 'Lenders',
    description: 'Manage lender identity, agreements, contacts, and activation approvals.',
    items: ['Lender profiles', 'Agreements and approvals', 'UAT and production status'],
  },
  {
    slug: 'products',
    title: 'Loan products',
    navLabel: 'Loan products',
    description: 'Configure the products and terms permitted to appear in customer journeys.',
    items: ['Eligibility rules', 'Amount and tenure limits', 'Customer disclosures'],
  },
  {
    slug: 'enquiries',
    title: 'Customer enquiries',
    navLabel: 'Enquiries',
    description: 'Follow verified, consented enquiries from the CreditTrust website.',
    items: ['Enquiry status', 'Consent reference', 'Sharing history'],
  },
  {
    slug: 'offers',
    title: 'Offers and applications',
    navLabel: 'Offers & applications',
    description: 'Review lender responses and application progress in one place.',
    items: ['Lender responses', 'Offer comparison', 'Application callbacks'],
  },
  {
    slug: 'integrations',
    title: 'Lender integrations',
    navLabel: 'Integrations',
    description: 'Keep lender connectivity separate from bureau and partner APIs.',
    items: ['Credential configuration', 'UAT connectivity', 'Signed callbacks'],
  },
  {
    slug: 'audit',
    title: 'Consent and audit',
    navLabel: 'Consent & audit',
    description: 'Track permission, disclosures, data sharing, and operator changes.',
    items: ['Consent version and timestamp', 'Admin change log', 'Data-sharing audit'],
  },
] as const;

export type FintechSection = (typeof fintechSections)[number];
