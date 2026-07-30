import LegalPage from '@/components/legal/LegalPage';

const sections = [
  {
    title: 'Legal Entity',
    body: 'CreditTrust is operated and managed by Fin Coopers Tech India Private Limited. References to Credit Trust, CreditTrust, the website, partner portal, customer journey, and related services mean services operated by Fin Coopers Tech India Private Limited.',
  },
  {
    title: 'Acceptance Of Terms',
    body: 'By accessing the website, creating an account, submitting a report request, using the partner portal, making a payment, or using any platform service, you agree to these Terms and Conditions, Privacy Policy, Refund Policy, and Usage Policy.',
  },
  {
    title: 'Services',
    bullets: [
      'Credit Trust provides digital financial health report workflows for individuals.',
      'Credit Trust provides partner tools for approved partners, including wallet, invoices, report requests, report history, agreements, and customer master workflows.',
      'Services may depend on third-party payment gateways, data providers, banks, cloud infrastructure, communication providers, and verification systems.',
      'Availability of any service may depend on user eligibility, payment status, consent, provider response, account status, and compliance checks.',
    ],
  },
  {
    title: 'User Eligibility And Accuracy',
    bullets: [
      'You must provide true, accurate, current, and complete information.',
      'You must use your own mobile number, PAN, identity details, and payment method unless you are an authorized partner acting with valid customer consent.',
      'We may reject, hold, suspend, or review any request that appears incomplete, suspicious, unauthorized, or non-compliant.',
    ],
  },
  {
    title: 'Consent Requirement',
    body: 'Financial health report processing is consent-based. By submitting your details, verifying your mobile number, accepting consent, making payment, or asking an approved partner to process your request, you expressly authorize Credit Trust and its authorized service/data partners to use the submitted information to create, fetch, process, store, and display your financial health report for the requested purpose. A report request must not be initiated for any person without valid authorization. Unauthorized report access is strictly prohibited and may lead to account suspension, denial of refund, legal action, and reporting to relevant parties.',
  },
  {
    title: 'Credit Information And Consent Compliance',
    bullets: [
      'Where a financial health report uses credit information, the request must be made by the concerned individual or by an approved partner acting with clear authorization from that individual.',
      'You understand that your submitted identity, contact, PAN, address, payment, and consent details may be shared with authorized service providers, payment gateways, verification systems, and report/data providers only for processing the requested service, reconciliation, audit, dispute handling, fraud prevention, and compliance.',
      'You confirm that the information submitted by you is true and belongs to you, or that you are legally authorized to submit it on behalf of the concerned person.',
      'You agree that the report and related insights are generated based on data made available by third-party sources and providers, and errors or gaps in source data may need to be resolved with the relevant data source or institution.',
    ],
  },
  {
    title: 'Payments',
    bullets: [
      'Prices, taxes, gateway charges, wallet deductions, and invoice amounts may vary by service, partner plan, or commercial agreement.',
      'A transaction is treated as successful only after confirmation by our payment gateway, bank, or internal reconciliation process.',
      'We are not responsible for delays caused by banks, UPI providers, card networks, payment gateways, or incorrect payment details provided by the user.',
      'Refunds and cancellations are governed by our Refund and Cancellation Policy.',
    ],
  },
  {
    title: 'Partner Terms',
    bullets: [
      'Partners must complete onboarding, provide accurate business details, sign required agreements, and follow all platform policies.',
      'Partners are responsible for customer authorization, lawful use of reports, secure handling of data, staff access controls, and payment obligations.',
      'We may modify partner pricing, wallet rules, credit limits, report access, or account status based on commercial terms, risk, compliance, or misuse.',
    ],
  },
  {
    title: 'No Misuse Or Unauthorized Access',
    body: 'You must not misuse the platform, attempt unauthorized access, bypass security controls, abuse payments, scrape data, share credentials, submit false data, or use the service for unlawful, discriminatory, coercive, or fraudulent purposes.',
  },
  {
    title: 'Third-Party Services',
    body: 'Payment gateways, banks, report/data providers, hosting providers, communication providers, and analytics tools may have their own terms and privacy practices. We are not responsible for third-party failures, outages, declines, delays, or policy decisions outside our reasonable control.',
  },
  {
    title: 'Disclaimers',
    bullets: [
      'Reports and insights are informational and do not guarantee loan approval, credit approval, employment, financial benefit, or any specific decision by a bank, NBFC, lender, or institution.',
      'We do not provide legal, tax, investment, or regulated financial advice through the website unless explicitly stated in a separate written agreement.',
      'We do not guarantee that third-party data will always be complete, current, or error-free.',
    ],
  },
  {
    title: 'Limitation Of Liability',
    body: 'To the maximum extent permitted by law, our liability is limited to the amount paid for the specific disputed service giving rise to the claim. We are not liable for indirect, incidental, consequential, punitive, business, reputation, data, or opportunity losses.',
  },
  {
    title: 'Account Suspension Or Termination',
    body: 'We may suspend, restrict, or terminate access for policy violations, suspicious activity, non-payment, misuse, unauthorized report requests, legal risk, gateway risk, or security concerns.',
  },
  {
    title: 'Changes To Terms',
    body: 'We may update these Terms from time to time. Continued use of the platform after changes means you accept the revised Terms.',
  },
];

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms And Conditions"
      intro="These Terms and Conditions govern access to Credit Trust website, customer financial health report journey, partner portal, admin-supported workflows, payments, invoices, and related services."
      updatedAt="12 May 2026"
      sections={sections}
    />
  );
}
