import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request) {
  try {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Verify the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);

    return NextResponse.json({ authenticated: true }, { status: 200 });
  } catch (error) {
    // Token is invalid or expired
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
