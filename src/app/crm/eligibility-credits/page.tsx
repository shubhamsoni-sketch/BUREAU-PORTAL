import { redirect } from 'next/navigation';

export default function EligibilityCreditsRedirect() {
  redirect('/crm/setup?tab=wallet');
}
