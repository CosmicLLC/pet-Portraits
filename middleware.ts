import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Edge-level admin gate. Runs BEFORE any /admin/* page or /api/admin/*
// route renders, so:
//   - Non-admin users never download the admin React bundle
//   - The response is a clean 404 (not a 302 redirect or 403) — gives
//     a probing attacker zero signal that the admin path even exists
//   - Per-page auth() checks still run as defense-in-depth (a future
//     middleware bypass or framework regression won't expose admin)
//
// Auth source: NextAuth JWT token (session: { strategy: "jwt" } in
// lib/auth.ts). The token contains `role` per the auth callbacks, set
// to "admin" only for ADMIN_EMAIL. Token verification is purely
// cryptographic via NEXTAUTH_SECRET — no database read needed, fast on
// Vercel Edge.

// Must stay in sync with lib/auth.ts ADMIN_EMAIL. Duplicated here so
// the middleware can do a defense-in-depth check by email when a
// previously-issued JWT didn't carry the `role` claim (this prevents
// stale-token lockout — without this, the admin user would 404 on
// /admin until manually signing out and back in to mint a fresh JWT).
const ADMIN_EMAIL = "cosmic.company.llc@gmail.com"

export async function middleware(req: NextRequest) {
  // In production HTTPS, NextAuth sets the cookie as
  // `__Secure-next-auth.session-token` (note the leading "__Secure-").
  // `getToken()` tries to auto-detect this from req.url, but on Vercel
  // the function may receive the request as http:// internally even
  // though the public URL is https://. Setting secureCookie explicitly
  // based on NEXTAUTH_URL fixes the case where the function-level
  // protocol doesn't match the user-facing protocol.
  const isSecureSite = (process.env.NEXTAUTH_URL || "").startsWith("https://")

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: isSecureSite,
  })

  // Two ways to be considered admin (defense-in-depth):
  //   1) JWT claims role === "admin" (the fresh-sign-in path)
  //   2) JWT email matches the hardcoded ADMIN_EMAIL (the stale-JWT
  //      fallback — happens when the user signed in before the role
  //      claim was being baked into the token)
  // Either way, the JWT itself is cryptographically verified by
  // getToken via NEXTAUTH_SECRET. So trusting either claim is safe —
  // an attacker can't forge a JWT containing the admin email without
  // the secret.
  const claims = token as { role?: string; email?: string } | null
  const isAdmin =
    claims != null && (claims.role === "admin" || claims.email === ADMIN_EMAIL)

  if (!isAdmin) {
    // Log to Edge function logs so prod 404s can be diagnosed via
    // Vercel logs — token-null vs role-missing vs email-mismatch all
    // look identical to the client (clean 404), but only this log
    // tells us which.
    console.warn(
      "[admin-gate] denied",
      JSON.stringify({
        path: req.nextUrl.pathname,
        tokenPresent: !!token,
        hasRoleClaim: !!claims?.role,
        roleValue: claims?.role,
        emailMatches: claims?.email === ADMIN_EMAIL,
        secureCookieMode: isSecureSite,
      })
    )
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    })
  }
  return NextResponse.next()
}

// Match only admin surfaces. Excludes /api/auth/* (NextAuth's own routes
// — those must stay reachable for sign-in flows) and /api/cron/* (those
// have their own CRON_SECRET check, hit by Vercel Cron not browsers).
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
