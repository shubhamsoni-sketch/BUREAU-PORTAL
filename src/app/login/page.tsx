import type { Metadata } from 'next';
import SignUpLoginContent from '@/app/crm/sign-up-login-screen/components/SignUpLoginContent';

export const metadata: Metadata = {
  title: 'CreditTrust CRM Login',
  description: 'Sign in to your CreditTrust CRM workspace.',
};

export default function LoginPage() {
  return <SignUpLoginContent />;
}
