import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: Missing or invalid token format' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7); // Extract "Bearer "

  if (token === 'mock-session-token-xyz789') {
    return NextResponse.json({
      success: true,
      user: {
        name: 'Demo Admin',
        role: 'Administrator',
        email: 'admin@demo-sandbox.io',
        bio: 'This profile is served via SSR-rendered dynamic HTML. The Authorization header was added by the Service Worker after reading the demo token from IndexedDB.',
      },
    });
  }

  return NextResponse.json(
    { success: false, message: 'Unauthorized: Invalid token' },
    { status: 401 }
  );
}
