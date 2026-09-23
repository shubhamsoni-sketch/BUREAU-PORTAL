import { NextResponse } from 'next/server';
import { clearClientPortalCookie } from '@/lib/api-hub/client-portal-auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearClientPortalCookie(response);
  return response;
}
