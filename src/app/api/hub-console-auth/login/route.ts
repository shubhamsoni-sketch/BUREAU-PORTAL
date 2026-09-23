import { NextRequest, NextResponse } from 'next/server';
import {
  createHubConsoleToken,
  isHubConsoleConfigured,
  setHubConsoleCookie,
  verifyHubConsoleCredentials,
} from '@/lib/api-hub/console-auth';

export async function POST(request: NextRequest) {
  if (!isHubConsoleConfigured()) {
    return NextResponse.json({ success: false, error: 'Bridge console login is not configured' }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (!verifyHubConsoleCredentials(body.username, body.password)) {
    return NextResponse.json({ success: false, error: 'Invalid Bridge console credentials' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  setHubConsoleCookie(response, createHubConsoleToken());
  return response;
}
