import LegalPage from '@/components/legal/LegalPage';

const sections = [
  {
    title: 'Authorized Use Only',
    body: 'The platform may be used only for lawful, consent-based financial health report workflows, partner operations, customer support, payments, invoices, and related administrative activities.',
    bullets: [
      'Individuals may request their own financial health report using their own valid details and consent.',
      'Partners may request a customer report only after obtaining valid authorization from that customer.',
      'Admins may access customer, partner, payment, and report records only for operational, support, audit, compliance, or dispute-resolution purposes.',
    ],
  },
  {
    title: 'Strictly Prohibited Activities',
    bullets: [
      "Requesting, attempting to request, viewing, storing, or sharing another person's report without valid authorization.",
      'Using fake, stolen, borrowed, purchased, or incorrect identity details, PAN, mobile number, OTP, consent, or payment information.',
      'Bypassing OTP, consent, payment, wallet deduction, rate limit, agreement, role restriction, or admin approval workflows.',
      'Scraping, bulk extraction, reverse engineering, credential sharing, automated abuse, bot activity, or unauthorized API access.',
      'Using the platform for harassment, profiling, discrimination, blackmail, fraud, illegal lending, illegal recovery, or any activity prohibited by law.',
      'Uploading malicious files, injecting scripts, attacking infrastructure, probing vulnerabilities, or attempting unauthorized access.',
    ],
  },
  {
    title: 'Consent And Record Responsibility',
    bullets: [
      'Every report request must have clear, traceable, and voluntary consent from the concerned person.',
      'Submitting the form, verifying mobile/OTP, accepting consent, or completing payment means the concerned person authorizes the report request for the stated purpose.',
      'Partners are responsible for retaining consent proof where required by their business process or applicable law.',
      'Consent must not be bundled with misleading claims, hidden terms, coercion, or unauthorized data collection.',
      'We may ask for consent proof before supporting disputed report requests.',
    ],
  },
  {
    title: 'Partner Account Rules',
    bullets: [
      'Partner accounts are issued to approved businesses or users and must not be shared outside authorized staff.',
      'Partners must keep credentials secure and immediately report suspicious access.',
      'Wallet credits, pricing, report access, and invoices are subject to approval, reconciliation, and account status.',
      'Partner access may be suspended or terminated for misuse, unpaid dues, false information, unauthorized pulls, or policy violations.',
    ],
  },
  {
    title: 'Payment And Wallet Use',
    bullets: [
      'Payments must be made only through authorized checkout, invoice, bank, UPI, or payment gateway methods shown by the platform.',
      'Users must not use unauthorized cards, bank accounts, UPI IDs, wallets, or payment credentials.',
      'Wallet credits are platform usage credits and may be subject to commercial terms, invoice rules, and misuse review.',
      'Chargebacks, payment disputes, or suspicious payment patterns may lead to account review or service hold.',
    ],
  },
  {
    title: 'Report Interpretation',
    body: 'Financial health reports and insights are informational. They are not a guarantee of loan approval, credit approval, financial outcome, or regulatory decision. Users should verify information independently and consult qualified professionals where needed.',
  },
  {
    title: 'Monitoring And Enforcement',
    bullets: [
      'We may log activity, device, IP, payment, report, consent, and admin actions to prevent misuse and resolve disputes.',
      'We may restrict, suspend, reject, reverse, or terminate access where misuse or risk is detected.',
      'We may report suspected fraud, unauthorized access, or illegal activity to payment partners, banks, regulators, law enforcement, or affected users where appropriate.',
    ],
  },
  {
    title: 'User And Partner Responsibility',
    body: 'Users and partners are responsible for the accuracy of submitted information, lawful basis for report requests, secure use of credentials, compliance with this policy, and cooperation during support or investigation.',
  },
];

export default function UsagePolicyPage() {
  return (
    <LegalPage
      eyebrow="Acceptable Use"
      title="Usage Policy"
      intro="This Usage Policy defines what is allowed and prohibited on InsightIQ. It is designed to prevent unauthorized financial report access, payment abuse, fraud, and misuse of sensitive data."
      updatedAt="12 May 2026"
      sections={sections}
    />
  );
}
