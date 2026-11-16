import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | CreditTrust',
  description: 'How CreditTrust handles information shared during loan enquiries, lender journeys, credit report requests and customer support.',
};

const sections = [
  {
    title: 'Who operates CreditTrust',
    body: 'CreditTrust is a brand/platform owned, operated, and managed by Fin Coopers Tech India Private Limited. This policy covers information shared on the CreditTrust website, loan enquiry journey, customer and partner workspaces, and related support channels.',
  },
  {
    title: 'Information we collect',
    body: 'To help you explore loan options or request a separate credit-related service, we may collect:',
    bullets: [
      'Name, mobile number, email address, date of birth, PAN, address, PIN code, employment and income details supplied by you.',
      'Loan amount, purpose, application details, verification inputs, documents and consent records where relevant to the journey.',
      'Payment references and service status if you purchase a CreditTrust service, plus device, IP and security logs needed to operate the website.',
    ],
  },
  {
    title: 'How we use your information',
    body: 'We use information to respond to your enquiry, verify your details, present relevant journey steps, facilitate a request with an authorized lender or service provider, provide customer support, prevent misuse and maintain required records. We do not treat a loan enquiry as a promise of eligibility or approval.',
  },
  {
    title: 'Consent and sharing',
    body: 'We may share the details needed for a requested service with relevant lenders, verification providers, technology partners or payment providers, subject to the consent and disclosures shown in the applicable journey. A credit report or bureau request requires its own applicable authorization; entering a loan enquiry alone does not authorize an unrelated report pull.',
  },
  {
    title: 'Data protection and retention',
    body: 'We limit access to teams and providers that need the information for the stated purpose and use reasonable technical and organizational safeguards. Records may be retained for service delivery, consent evidence, disputes, fraud prevention and applicable legal requirements. No internet service can promise absolute security.',
  },
  {
    title: 'Your choices',
    body: 'You may ask for access, correction, support, deletion review or withdrawal of future consent by writing to support@credittrust.in. We may verify your identity first and may retain records that must be kept for legal, payment or dispute purposes. You can also opt out of optional communications through the available channel.',
  },
  {
    title: 'Updates and contact',
    body: 'We may update this policy as our journeys, providers or legal requirements change. The updated version will appear here. For privacy questions, write to support@credittrust.in or use our Contact page.',
  },
];

export default function PrivacyPolicyPage() {
  return <LegalPage eyebrow="Privacy Policy" title="Privacy Policy" intro="Your data should feel protected. Here is how we handle information shared while exploring a loan or using a CreditTrust service." updatedAt="16 November 2026" sections={sections} />;
}
