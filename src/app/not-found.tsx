import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-5 text-center">
      <p className="font-display text-7xl font-medium text-line-strong">404</p>
      <h1 className="mt-4 font-display text-2xl font-medium tracking-tight text-ink">
        This page doesn't exist
      </h1>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
        The link may be wrong, or the form it pointed to was deleted by its
        creator.
      </p>
      <Link href="/" className="mt-8">
        <Button variant="secondary">Back to Revuea</Button>
      </Link>
    </main>
  );
}
