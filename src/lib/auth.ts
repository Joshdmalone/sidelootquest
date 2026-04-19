import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * NextAuth v5 (beta) config. Uses Prisma adapter + GitHub OAuth.
 *
 * To enable on a new env:
 *   1. Create a GitHub OAuth App at https://github.com/settings/developers
 *      Callback URL: http(s)://your-host/api/auth/callback/github
 *   2. Set env vars: AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, AUTH_SECRET
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});

/** Guard a server component / action — redirects to /signin if no session. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    const { redirect } = await import("next/navigation");
    redirect("/signin");
  }
  return session!.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}
