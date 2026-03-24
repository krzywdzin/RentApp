import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const deviceId = crypto.randomUUID();

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, deviceId }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const response = NextResponse.json({ success: true });

  response.cookies.set('access_token', data.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 900, // 15 min
  });

  response.cookies.set('refresh_token', data.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 86400, // 24h
  });

  response.cookies.set('device_id', deviceId, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 86400,
  });

  return response;
}
