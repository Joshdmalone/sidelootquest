import Link from "next/link";
import { redirect } from "next/navigation";
import { Swords, Zap } from "lucide-react";
import { auth, signIn, devSignInEnabled } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.78-.25.78-.56 0-.27-.01-1-.02-1.96-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.73 0c2.18-1.49 3.14-1.18 3.14-1.18.63 1.59.24 2.76.12 3.05.73.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.27 5.7.41.36.78 1.07.78 2.16 0 1.56-.02 2.82-.02 3.2 0 .31.2.67.79.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/tasks");

  const githubConfigured = !!(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Swords className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight">SideLootQuest</span>
        </Link>

        <Card>
          <CardContent className="p-8">
            <h1 className="mb-2 text-center text-2xl font-bold">Start your quest</h1>
            <p className="mb-8 text-center text-sm text-muted-foreground">
              {githubConfigured
                ? "Sign in with GitHub to track tasks, hours, and revenue."
                : "Running locally? Use Dev Sign-in — no accounts required."}
            </p>

            <div className="space-y-3">
              {githubConfigured && (
                <form
                  action={async () => {
                    "use server";
                    await signIn("github", { redirectTo: "/tasks" });
                  }}
                >
                  <Button type="submit" className="w-full" size="lg">
                    <GitHubIcon className="h-4 w-4" />
                    Continue with GitHub
                  </Button>
                </form>
              )}

              {devSignInEnabled && (
                <form
                  action={async () => {
                    "use server";
                    await signIn("dev", { redirectTo: "/tasks" });
                  }}
                >
                  <Button type="submit" variant="gold" className="w-full" size="lg">
                    <Zap className="h-4 w-4" />
                    Dev sign in (no account)
                  </Button>
                </form>
              )}

              {!githubConfigured && !devSignInEnabled && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  No auth provider configured. Set <code>AUTH_GITHUB_ID</code> +{" "}
                  <code>AUTH_GITHUB_SECRET</code> in .env, or set{" "}
                  <code>ALLOW_DEV_SIGNIN=true</code> for dev bypass.
                </div>
              )}
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing in you agree to be a cool and kind person. That&apos;s it.
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            ← Back home
          </Link>
        </p>
      </div>
    </div>
  );
}
