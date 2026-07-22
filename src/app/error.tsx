"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-5 text-center">
      <h1 className="font-display text-2xl font-medium tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
        An unexpected error occurred. It's been logged - try again in a moment.
      </p>
      <Button className="mt-8" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
