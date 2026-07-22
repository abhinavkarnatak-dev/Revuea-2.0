"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconMoon, IconSun } from "@/components/icons";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Theme is unknown until the client mounts - render a stable placeholder
  // to avoid a hydration mismatch.
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className="size-9" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink"
    >
      {isDark ? <IconSun size={17} /> : <IconMoon size={17} />}
    </button>
  );
}
