import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | CreditTrust',
  description: 'How CreditTrust handles refund requests for its own paid services and where lender or third-party payment policies apply.',
};

const sections = [
  {
    title: 'Loan enquiries and lender charges',
    body: 'Submitting a loan enquiry through CreditTrust does not itself create a refundable loan fee. Any fee, charge or repayment collected directly by a lender or other third party is governed by that provider\'s agreement and refund process. Contact that provider for a payment you made to them.',
  },
  {
    title: 'Payments made to CreditTrust',
    body: 'If you pay CreditTrust directly for a separately priced digital service, such as a credit report, refund eligibility depends on the payment record, service status and applicable terms shown before purchase.',
    bullets: [
      'We may approve a refund if payment was taken but a technical failure prevented the service request from being accepted or fulfilled.',
      'A duplicate successful payment for the same service may be refunded or adjusted after verification.',
      'Once a digital report has been generated, delivered or made available, a refund is normally not available unless applicable law or a verified platform error requires it.',
    ],
  },
  {
    title: 'Cancellation',
    body: 'You may stop a loan enquiry before submission. For a separately purchased digital service, cancellation may be possible before processing begins; it may not be possible after a report request is processed or a report is made available. A lender application or loan cancellation follows the lender\'s own process.',
  },
  {
    title: 'How to request a refund',
    body: 'Email support@credittrust.in within 7 calendar days of a payment made directly to CreditTrust. Include your registered mobile number, payment or order reference, amount, payment date and a brief explanation. Do not send passwords or OTPs. We may request additional information to verify the transaction.',
  },
  {
    title: 'Review and payment timeline',
    body: 'Eligible requests are normally reviewed within 3 to 5 business days. Once an approved refund is initiated to the original payment method where supported, your bank, UPI provider, card network or gateway may take another 5 to 10 business days to reflect it.',
  },
  {
    title: 'Failed or disputed payments',
    body: 'If money was debited but the payment appears failed or pending, allow bank and gateway reconciliation before paying again. We review duplicate or disputed transactions against payment and service records. If you paid a lender or another third party, their own policy applies.',
  },
];

export default function RefundPolicyPage() {
  return <LegalPage eyebrow="Refund & Cancellation" title="Refund & Cancellation Policy" intro="Transparent refund handling for CreditTrust service payments, plus guidance on when a lender's policy applies instead." updatedAt="16 November 2026" sections={sections} />;
}
