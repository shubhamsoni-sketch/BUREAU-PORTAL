import type { Metadata } from 'next';
import ProfilePreview from './ProfilePreview';

export const metadata: Metadata = {
  title: 'Your Profile | CreditTrust Preview',
  description: 'Preview your CreditTrust enquiry profile.',
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfilePreview />;
}
