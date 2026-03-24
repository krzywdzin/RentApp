import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Portal paths have their own auth -- skip admin auth check
  if (pathname.startsWith('/portal')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token');
  const isLoginPage = pathname === '/login';

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
