import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        // Normalized the same way as registration (see api/auth/register) —
        // without this, casing mismatches between signup and login produce
        // this same generic error.
        const email = (credentials.email as string).trim().toLowerCase();

        let user;
        try {
          user = await prisma.user.findUnique({ where: { email } });
        } catch (err) {
          // NextAuth catches anything thrown in authorize() and returns the
          // same generic "doesn't look right" message to the client — by
          // design, so a failed DB connection isn't distinguishable from a
          // wrong password to an attacker either. But that means a real
          // infra problem (e.g. Postgres/docker not running) is otherwise
          // invisible. This log is server-side only — it shows up in the
          // terminal running `next dev`, never in the browser.
          console.error("[auth] Failed to reach the database during login:", err);
          return null;
        }

        // No passwordHash means the account was created via an OAuth
        // provider later — credentials login isn't valid for it.
        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
