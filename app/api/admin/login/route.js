import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(request) {
  try {
    const { password } = await request.json();

    // Check password against environment variable (server-side only)
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Create a JWT token for the session
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ admin: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    // Set the token as an HTTP-only cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin-token', token, {
      httpOnly: true,  // Cannot be accessed by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24  // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to process login' },
      { status: 500 }
    );
  }
}
