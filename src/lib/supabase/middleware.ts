import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const pinVerified = request.cookies.get('pin_verified')?.value === 'true';

  // Protect dashboard routes - require PIN
  if (
    !pinVerified &&
    !request.nextUrl.pathname.startsWith('/login') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect verified users away from login
  if (pinVerified && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
