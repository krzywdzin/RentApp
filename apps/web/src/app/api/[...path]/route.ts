import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

const ALLOWED_PATH_PREFIXES = [
  '/vehicles',
  '/customers',
  '/rentals',
  '/contracts',
  '/users',
  '/photos',
  '/walkthroughs',
  '/notifications',
  '/alert-config',
  '/audit',
  '/cepik',
  '/settings',
  '/vehicle-classes',
  '/rental-drivers',
  '/places',
  '/documents',
  '/return-protocols',
  '/ocr',
  '/health',
];

async function proxyRequest(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/api/, '');

  // Block access to paths not in the allowlist
  if (!ALLOWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const token = request.cookies.get('access_token')?.value;

  const incomingContentType = request.headers.get('content-type') ?? '';
  const isMultipart = incomingContentType.startsWith('multipart/form-data');

  const headers: HeadersInit = {};
  if (isMultipart) {
    headers['Content-Type'] = incomingContentType; // preserve boundary
  } else {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (['GET', 'HEAD'].includes(request.method)) {
    body = undefined;
  } else if (isMultipart) {
    body = await request.arrayBuffer();
  } else {
    body = await request.text();
  }

  const res = await fetch(`${API_URL}${path}${request.nextUrl.search}`, {
    method: request.method,
    headers,
    body,
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

  const data = await res
    .json()
    .catch(() => ({ error: 'Non-JSON response from backend', status: res.status }));
  return NextResponse.json(data, { status: res.status });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
