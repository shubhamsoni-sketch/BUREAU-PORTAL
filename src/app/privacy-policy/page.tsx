import LegalPage from '@/components/legal/LegalPage';

const sections = [
  {
    title: 'Information We Collect',
    body: 'We collect only the information required to provide financial health report services, partner services, payment processing, security controls, and customer support.',
    bullets: [
      'Identity and contact details such as name, mobile number, email address, date of birth, address, PIN code, PAN, gender, and consent confirmation.',
      'Transaction information such as order ID, payment ID, amount, payment status, invoice details, wallet ledger entries, refund status, and gateway response data.',
      'Report request information such as submitted form data, report status, generated report ID, normalized report insights, and raw provider response where required for audit and support.',
      'Technical information such as IP address, device/browser metadata, timestamps, session data, logs, fraud signals, and security events.',
    ],
  },
  {
    title: 'Why We Use Your Information',
    bullets: [
      'To verify the user, capture explicit consent, process payment, generate the requested financial health report, and show the result to the authorized user.',
      'To maintain legally and operationally required records for payment reconciliation, dispute handling, report audit, fraud prevention, and customer support.',
      'To operate partner accounts, wallet balances, invoices, agreements, notifications, and admin workflows.',
      'To detect unauthorized access, suspicious activity, misuse, duplicate attempts, chargeback risk, and policy violations.',
    ],
  },
  {
    title: 'Consent-Based Report Access',
    body: 'A financial health report must be requested only by the concerned individual or by an authorized partner with valid consent. When you submit details and provide consent, you authorize us to use and share the required information with authorized verification, payment, and report/data partners to process the requested report. We do not permit any user or partner to obtain, attempt to obtain, or store a report for another person without authorization.',
    bullets: [
      'Users must provide accurate personal details and consent before report processing.',
      'Partners must collect and retain valid customer authorization before initiating any report request.',
      'We may suspend, reject, or report accounts that attempt unauthorized report access.',
    ],
  },
  {
    title: 'Data Sharing',
    body: 'We do not sell personal data. Data may be shared only when required to deliver the service, comply with law, process payments, prevent fraud, or resolve support requests.',
    bullets: [
      'Payment gateway or banking partners receive payment-related information required to process and verify transactions.',
      'Report/data providers receive only the fields required to process an authorized report request.',
      'Technology vendors may process limited data under security and confidentiality obligations.',
      'Authorities, courts, regulators, or law enforcement may receive information when legally required.',
    ],
  },
  {
    title: 'Sensitive Data Protection',
    bullets: [
      'PAN, report request data, payment identifiers, and raw provider responses are treated as sensitive records.',
      'Admin access to sensitive records is restricted to operational need, audit, support, reconciliation, and compliance purposes.',
      'Public user interfaces should mask sensitive values wherever full display is not required.',
      'Production credentials, service keys, and payment secrets must never be exposed in frontend code.',
    ],
  },
  {
    title: 'Retention',
    body: 'We retain records for as long as needed for service delivery, payment reconciliation, legal compliance, audit, fraud prevention, dispute handling, and customer support. Retention periods may vary depending on the record type and legal requirements.',
  },
  {
    title: 'User Rights',
    bullets: [
      'You may request access, correction, support, or deletion review for your personal information subject to legal, contractual, payment, audit, and fraud-prevention retention requirements.',
      'You may withdraw future consent, but withdrawal may not affect reports already generated, payments already processed, or records required for compliance.',
      'We may verify identity before acting on any request involving sensitive financial or identity data.',
    ],
  },
  {
    title: 'Security',
    body: 'We use reasonable administrative, technical, and operational safeguards to protect customer data. No online system is risk-free, so users and partners must also protect their login credentials and avoid sharing OTPs, passwords, or report access with unauthorized persons.',
  },
  {
    title: 'Policy Updates',
    body: 'We may update this Privacy Policy from time to time. Continued use of the platform after an update means you accept the revised policy.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title="Privacy Policy"
      intro="This Privacy Policy explains how InsightIQ collects, uses, protects, stores, and shares information when individuals, partners, admins, or website visitors use our financial health report and partner workflow platform."
      updatedAt="12 May 2026"
      sections={sections}
    />
  );
}
