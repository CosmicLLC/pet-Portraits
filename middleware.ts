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

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })
  if (!token || token.role !== "admin") {
    // Render the platform's 404 page. Casting because NextAuth's token
    // type doesn't declare custom claims; ours has role per auth callbacks.
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
