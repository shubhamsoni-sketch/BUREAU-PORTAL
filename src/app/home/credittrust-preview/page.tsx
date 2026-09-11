import type { Metadata } from 'next';
import CreditTrustPreview from './CreditTrustPreview';

export const metadata: Metadata = {
  title: 'CreditTrust | Understand Your Credit Clearly',
  description:
    'Understand the reasons affecting your credit profile with a clear bilingual credit analysis and practical action plan.',
};

export default function CreditTrustPreviewPage() {
  return <CreditTrustPreview />;
}
