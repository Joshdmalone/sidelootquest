import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * NextAuth v5 (beta) config.
 *
 * Two providers:
 *   - GitHub OAuth (prod path) — requires AUTH_GITHUB_ID + AUTH_GITHUB_SECRET
 *   - Dev Credentials (local path) — no external service needed
 *
 * The Dev provider is automatically enabled when ALLOW_DEV_SIGNIN=true
 * (defaults to true if NODE_ENV=development). It signs in as the seeded
 * dev user (dev@sidelootquest.local). NEVER enable in production without
 * intentional testing — it's a no-password bypass.
 */

const DEV_EMAIL = "dev@sidelootquest.local";

const allowDevSignIn =
  process.env.ALLOW_DEV_SIGNIN === "true" ||
  (process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_SIGNIN !== "false");

const providers: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}

if (allowDevSignIn) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev",
      credentials: {},
      async authorize() {
        // Upsert the dev user on demand so devs don't HAVE to seed first.
        const user = await prisma.user.upsert({
          where: { email: DEV_EMAIL },
          update: {},
          create: {
            email: DEV_EMAIL,
            name: "Dev Hustler",
            taxRatePct: 28,
            weeklyGoalCents: 50000,
          },
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  // Credentials provider requires JWT sessions; GitHub path would prefer DB sessions.
  // Using JWT for both keeps the config simple.
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

/** Exposed so the /signin page can decide whether to show the Dev button. */
export const devSignInEnabled = allowDevSignIn;

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
