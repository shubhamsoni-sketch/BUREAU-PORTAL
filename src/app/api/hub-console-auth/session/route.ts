import { NextRequest, NextResponse } from 'next/server';
import { hasHubConsoleSession, isHubConsoleConfigured } from '@/lib/api-hub/console-auth';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    configured: isHubConsoleConfigured(),
    authenticated: hasHubConsoleSession(request),
  });
}
