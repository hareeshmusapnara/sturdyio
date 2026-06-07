import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions: { timeout: 15000 },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/" },
  callbacks: {
    // ── Attach user id to session ─────────────────────────────────────────
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },

    // ── Upsert user into DB on every sign-in ──────────────────────────────
    async signIn({ user, account }) {
      try {
        if (!user.email) return true; // can't store without email

        const existing = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (existing.length > 0) {
          // User exists — update last login
          await db
            .update(users)
            .set({ lastLogin: new Date(), name: user.name ?? undefined, image: user.image ?? undefined })
            .where(eq(users.email, user.email));
        } else {
          // New user — insert
          await db.insert(users).values({
            id: account?.providerAccountId ?? user.id ?? user.email,
            name: user.name ?? null,
            email: user.email,
            image: user.image ?? null,
            provider: account?.provider ?? "google",
          });
        }
      } catch (e) {
        console.error("[auth] DB signIn error:", e);
        // Don't block sign-in if DB write fails
      }
      return true;
    },
  },
};
