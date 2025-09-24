export const runtime = "edge";

import { stackServerApp } from "@/stack/server";

export default function LoginPage() {
  const { signIn, signUp } = stackServerApp.urls;

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This app expects Neon Auth (Stack) handlers at <code>/handler/*</code>. If you have not
        run the setup yet, see the README section "Neon Data API & Auth setup".
      </p>
      <div className="mt-6 grid gap-3">
        <a
          href={signIn}
          className="inline-flex items-center justify-center rounded-md border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Continue to Sign In
        </a>
        <a
          href={signUp}
          className="inline-flex items-center justify-center rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90"
        >
          Create an account
        </a>
      </div>
    </main>
  );
}
