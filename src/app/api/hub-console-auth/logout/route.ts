import { NextResponse } from 'next/server';
import { clearHubConsoleCookie } from '@/lib/api-hub/console-auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearHubConsoleCookie(response);
  return response;
}
