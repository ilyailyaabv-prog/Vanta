import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Skip middleware for the login page
// For all other /admin/* routes, redirect to login if no session cookie
// The actual session verification happens in the layout/page components
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page to render without auth check
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Check for the next-auth session token cookie
  const sessionCookie = request.cookies.get("next-auth.session-token")?.value
    ?? request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};