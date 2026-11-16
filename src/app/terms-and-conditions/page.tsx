import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms & Conditions | CreditTrust',
  description: 'Terms for using the CreditTrust digital loan assistance journey, lender referrals and separate credit-related services.',
};

const sections = [
  {
    title: 'About CreditTrust',
    body: 'CreditTrust is a brand/platform owned, operated, and managed by Fin Coopers Tech India Private Limited. CreditTrust provides a digital journey to explore loan options and may help connect eligible customers with lending partners. CreditTrust also operates separate credit report and partner workflow services where offered.',
  },
  {
    title: 'Using the loan journey',
    body: 'By using the website or submitting an enquiry, you agree to provide accurate, current information and review the relevant consent and privacy notices before continuing. You must use your own information unless you are expressly authorized to act for another person.',
  },
  {
    title: 'Lender decisions and offers',
    body: 'Submitting an enquiry does not guarantee a loan or a particular rate, amount or timeline. Any offer depends on the lender\'s eligibility assessment, documents, credit profile and policies. The lender makes the final credit, pricing, approval and disbursal decisions. Review the lender\'s terms, charges, repayment schedule and disclosures before accepting an offer.',
  },
  {
    title: 'Consent and credit information',
    body: 'We process and share information for the specific journey you authorize. Where a separate credit report or bureau-based service is offered, its request requires the applicable consent, verification and service terms. Do not submit another person\'s details or attempt to access their credit information without authority.',
  },
  {
    title: 'Fees and payments',
    body: 'CreditTrust will show any fee for its own paid service before payment. Loan-related charges collected by a lender or third party are governed by that provider\'s disclosures and agreement, not by a CreditTrust service fee. Refunds for amounts paid directly to CreditTrust are handled under our Refund and Cancellation Policy.',
  },
  {
    title: 'Responsible use',
    body: 'Do not submit false information, misuse another person\'s identity, bypass security controls, scrape or disrupt the website, or use the service for unlawful or fraudulent purposes. We may suspend or decline access where misuse, security or compliance concerns arise.',
  },
  {
    title: 'Service availability and updates',
    body: 'Journeys and partner availability may change. Third-party lender, payment, verification and communication systems may have their own terms and occasional interruptions. We may update these terms and will publish the revised version here. No loan approval, credit score improvement, credit correction or lender decision is guaranteed.',
  },
];

export default function TermsAndConditionsPage() {
  return <LegalPage eyebrow="Terms & Conditions" title="Terms & Conditions" intro="Simple rules for a responsible journey. Here is what to expect when you use CreditTrust to explore a loan or request a separate service." updatedAt="16 November 2026" sections={sections} />;
}
