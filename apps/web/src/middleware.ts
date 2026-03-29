import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Portal paths have their own auth -- skip admin auth check
  if (pathname.startsWith('/portal')) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token');
  const refreshToken = request.cookies.get('refresh_token');
  const isLoginPage = pathname === '/login';

  if (!accessToken && !refreshToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (accessToken && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
