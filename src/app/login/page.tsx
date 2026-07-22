import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";
import { IconMaskOff } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="flex h-16 items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-ever text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 6h16M4 12h10M4 18h6"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="font-display text-[19px] font-medium tracking-tight text-ink">
            Revuea
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-24">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink">
            Welcome back
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            Sign in - or sign up - with your email. No password to remember.
          </p>

          {error === "google" && (
            <p className="mt-4 rounded-field bg-clay-tint px-3.5 py-2.5 text-sm text-clay">
              Google sign-in didn't complete. Try again or use email.
            </p>
          )}

          <div className="mt-8">
            <LoginForm
              googleEnabled={env.googleEnabled}
              nextPath={next?.startsWith("/") ? next : "/dashboard"}
            />
          </div>

          <p className="mt-10 flex items-start gap-2.5 text-[13px] leading-relaxed text-faint">
            <IconMaskOff size={16} className="mt-0.5 shrink-0 text-ever" />
            Accounts are only for people collecting feedback. Respondents never
            sign in - their answers stay fully anonymous.
          </p>
        </div>
      </main>
    </div>
  );
}
