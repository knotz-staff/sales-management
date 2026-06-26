import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const isLoggedIn = request.cookies.get('is_logged_in')?.value === 'true'
  
  if (!isLoggedIn && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/api/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  if (isLoggedIn && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
