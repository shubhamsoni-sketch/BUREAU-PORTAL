import type { Metadata } from 'next';
import ApplyPreview from './ApplyPreview';

export const metadata: Metadata = {
  title: 'Start Your Enquiry | CreditTrust Preview',
  description: 'Explore a clear, consent-led start to your personal loan enquiry.',
  robots: { index: false, follow: false },
};

export default function ApplyPage() {
  return <ApplyPreview />;
}
