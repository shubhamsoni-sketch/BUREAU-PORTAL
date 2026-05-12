import LegalPage from '@/components/legal/LegalPage';

const sections = [
  {
    title: 'Digital Service Nature',
    body: 'Credit Trust provides digital financial health report services and partner platform services. Once a report request is processed, data-provider costs, payment gateway charges, technical processing, and compliance logging may already be incurred.',
  },
  {
    title: 'B2C Financial Health Report Payments',
    bullets: [
      'A customer may request a refund if payment is deducted but the report request is not accepted by our system due to a technical failure.',
      'A refund may be considered if duplicate payment is made for the same mobile number, PAN, and report request within the same transaction window.',
      'No refund is normally available after the report has been generated, displayed, delivered, or made available for viewing, unless required by applicable law or a verified platform error.',
      'Incorrect details entered by the customer, unauthorized use by the customer, or refusal to complete required consent/verification after payment may not qualify for refund.',
    ],
  },
  {
    title: 'Partner Wallet, Invoice, And Credit Payments',
    bullets: [
      'Partner wallet recharge, invoice, or credit payments are business payments and are normally adjusted against wallet balance, invoices, or future usage.',
      'Refunds for partner payments are reviewed case by case based on unused balance, contractual terms, invoice status, reconciliation records, and any applicable taxes or gateway charges.',
      'If a partner account is suspended due to misuse, unauthorized report access, fraud, or policy violation, refund eligibility may be denied or adjusted against dues, losses, chargebacks, or investigation costs.',
    ],
  },
  {
    title: 'Refund Request Process',
    bullets: [
      'Raise a refund request at contact@credittrust.in within 7 calendar days of payment.',
      'Include registered mobile number, email, payment/order ID, amount, date of payment, report request ID if available, and reason for refund.',
      'We may ask for additional verification before processing requests involving identity, PAN, payment, or report data.',
      'Approved refunds will be initiated to the original payment method wherever supported by the payment gateway.',
    ],
  },
  {
    title: 'Refund Timelines',
    body: 'Eligible refunds are normally reviewed within 3 to 5 business days. Once approved and initiated, the amount may take 5 to 10 business days to reflect in the original payment method depending on bank, card network, UPI provider, wallet, or payment gateway timelines.',
  },
  {
    title: 'Failed, Pending, Or Duplicate Transactions',
    bullets: [
      'If money is debited but payment status remains failed or pending, wait for bank/gateway reconciliation before raising a duplicate payment.',
      'If the gateway confirms failed status and no service was delivered, we will help initiate refund or closure based on the gateway record.',
      'Duplicate successful payments for the same service may be refunded or adjusted after verification.',
    ],
  },
  {
    title: 'Non-Refundable Cases',
    bullets: [
      'Report generated, delivered, displayed, or made available after successful payment.',
      'Customer entered wrong PAN, DOB, mobile number, address, or identity details.',
      'Customer or partner attempted unauthorized report access or violated consent requirements.',
      'Service could not be completed because the customer did not provide mandatory verification, consent, or required information.',
      'Payment disputes raised without providing requested verification documents or transaction details.',
    ],
  },
  {
    title: 'Chargebacks And Disputes',
    body: 'If a chargeback, bank dispute, or payment gateway dispute is raised, we may share transaction records, consent logs, access logs, report status, invoice data, and support communication with the payment gateway, bank, or relevant authority to resolve the matter.',
  },
  {
    title: 'Cancellation',
    body: 'Because the product is a digital report and workflow service, cancellation is possible only before payment or before processing starts. Once processing starts or the report is generated, cancellation may not be available.',
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Refund And Cancellation"
      title="Refund And Cancellation Policy"
      intro="This policy explains when refunds, cancellations, duplicate payment reversals, partner wallet adjustments, and payment disputes may be accepted or rejected."
      updatedAt="12 May 2026"
      sections={sections}
    />
  );
}
