import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

async function proxyRequest(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/api/, '');
  const token = request.cookies.get('access_token')?.value;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}${request.nextUrl.search}`, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
  });

  const contentType = res.headers.get('content-type') ?? '';

  // Pass through binary responses (PDF, images, etc.) without JSON parsing
  if (!contentType.includes('application/json')) {
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        'Content-Type': contentType,
        ...(res.headers.get('content-disposition')
          ? { 'Content-Disposition': res.headers.get('content-disposition')! }
          : {}),
      },
    });
  }

  const data = await res.json().catch(() => ({ error: 'Non-JSON response from backend', status: res.status }));
  return NextResponse.json(data, { status: res.status });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
