import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

// The email address that automatically receives admin role
const ADMIN_EMAIL = "cosmic.company.llc@gmail.com"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // JWT strategy required for Credentials provider to coexist with OAuth/Email
  session: { strategy: "jwt" },
  providers: [
    // ── Google OAuth ───────────────────────────────────────────────────────
    // Setup: https://console.cloud.google.com → APIs & Services → Credentials
    // Create OAuth 2.0 Client ID (Web application)
    // Add authorized redirect URI: <your-domain>/api/auth/callback/google
    // Then set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your env vars
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    // ── Email magic link (Resend) ──────────────────────────────────────────
    // Sends a passwordless sign-in link via Resend. No password needed.
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: `Pet Portraits <${process.env.FROM_EMAIL || "noreply@petportraits.com"}>`,
    }),

    // ── Credentials (dev fallback) ─────────────────────────────────────────
    // Only active in development when Google OAuth is not yet configured.
    // Use email: test@petportraits.test, password: password123
    Credentials({
      name: "Email & Password (Dev)",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        if (process.env.NODE_ENV !== "development") return null
        // Dev-only hardcoded test account
        if (
          credentials.email === "test@petportraits.test" &&
          credentials.password === "password123"
        ) {
          return {
            id: "dev-test-user",
            email: "test@petportraits.test",
            name: "Test User",
          }
        }
        return null
      },
    }),
  ],

  callbacks: {
    // Runs on every sign-in — attach role to JWT on first sign-in
    async jwt({ token, user }) {
      if (user?.email) {
        // Force admin role for the admin email address
        if (user.email === ADMIN_EMAIL) {
          token.role = "admin"
          // Persist to DB asynchronously (might be first sign-in, silently ignore)
          prisma.user
            .update({ where: { email: ADMIN_EMAIL }, data: { role: "admin" } })
            .catch(() => {})
        } else {
          // Pull role from DB — adapter has already created the user by now
          const dbUser = await prisma.user
            .findUnique({ where: { email: user.email }, select: { role: true } })
            .catch(() => null)
          token.role = dbUser?.role ?? "user"
        }
        token.id = user.id ?? token.sub
      }
      return token
    },

    // Expose role and id on the client-side session object
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.id ?? token.sub) as string
        session.user.role = (token.role as string) ?? "user"
      }
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
})
