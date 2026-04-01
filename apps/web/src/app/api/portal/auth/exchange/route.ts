import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${API_URL}/portal/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const isProduction = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({ success: true });
  response.cookies.set('portal_token', data.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 86400, // 24h matching JWT expiry
  });
  return response;
}
