import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const deviceId = request.cookies.get('device_id')?.value;

  if (accessToken && deviceId) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ deviceId }),
      });
    } catch {
      // Best-effort logout on API side
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
  response.cookies.delete('device_id');

  return response;
}
