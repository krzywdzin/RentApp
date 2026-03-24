import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const accessToken = request.cookies.get('access_token')?.value;
  const deviceId = request.cookies.get('device_id')?.value;

  if (!refreshToken || !deviceId) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ deviceId, refreshToken }),
  });

  const data = await res.json();

  if (!res.ok) {
    const response = NextResponse.json(data, { status: res.status });
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    response.cookies.delete('device_id');
    return response;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const response = NextResponse.json({ success: true });

  response.cookies.set('access_token', data.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 900,
  });

  response.cookies.set('refresh_token', data.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 86400,
  });

  return response;
}
