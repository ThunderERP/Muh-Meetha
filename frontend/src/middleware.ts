import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth middleware — runs on the Edge before any page renders.
 *
 * Reads the Zustand persisted auth store from the `thundererp_auth` cookie
 * (Zustand persist with localStorage doesn't set a cookie, so we check the
 * cookie set by the login page — see note below).
 *
 * Strategy:
 *  - Public routes (/login, /register) → always allowed through.
 *  - All other routes → require `thundererp_auth_token` cookie.
 *    If missing → redirect to /login immediately (no blank flash).
 *
 * Note: localStorage is not accessible in middleware (Edge runtime).
 * The login page must also set a lightweight cookie alongside the Zustand
 * localStorage write so middleware can read it:
 *
 *   document.cookie = `thundererp_auth_token=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
 *
 * This cookie carries no sensitive data — it's just a presence signal.
 * The actual JWT stays in localStorage and is attached per-request by api-client.ts.
 */

const PUBLIC_PATHS = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public auth routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for auth presence cookie
  const hasAuth = request.cookies.has('thundererp_auth_token')

  if (!hasAuth) {
    const loginUrl = new URL('/login', request.url)
    // Preserve the original destination so login can redirect back
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
