import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Simple mock authentication
    if (username === 'admin' && password === 'password') {
      return NextResponse.json({
        success: true,
        token: 'mock-session-token-xyz789',
        user: {
          name: 'Demo Admin',
          role: 'Administrator',
          email: 'admin@demo-sandbox.io',
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid username or password (use admin / password)' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
