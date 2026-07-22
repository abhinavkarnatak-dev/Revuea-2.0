import Link from "next/link";
import { getCurrentUser } from "@/features/auth/session";
import { Button } from "@/components/ui/button";

function Wordmark() {
  return (
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
  );
}

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Wordmark />
          <nav className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard">
                <Button size="sm">Open dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center">
          <div>
            <Wordmark />
            <p className="mt-2 text-sm text-muted">
              Honest feedback, safely anonymous.
            </p>
          </div>
          <p className="text-xs text-faint">
            © {new Date().getFullYear()} Revuea. Responses are never traceable
            to a person.
          </p>
        </div>
      </footer>
    </div>
  );
}
