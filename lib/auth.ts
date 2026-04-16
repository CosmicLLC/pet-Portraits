import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "cosmic.company.llc@gmail.com";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        // Auto-promote admin email
        const role =
          user.email === ADMIN_EMAIL
            ? "admin"
            : (user as { role?: string }).role ?? "user";
        token.role = role;

        // Persist admin role in DB if not already set
        if (user.email === ADMIN_EMAIL && (user as { role?: string }).role !== "admin") {
          await prisma.user
            .update({ where: { email: ADMIN_EMAIL }, data: { role: "admin" } })
            .catch(() => null);
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        (session.user as { id: string; role: string } & typeof session.user).id = token.id as string;
        (session.user as { id: string; role: string } & typeof session.user).role = token.role as string;
      }
      return session;
    },
  },
};
