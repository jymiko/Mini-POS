import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = ['/dashboard', '/admin', '/cashier']
const authPaths = ['/login']

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('pos_session')
  const { pathname } = request.nextUrl

  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path))

  if (isProtectedPath && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPath && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
