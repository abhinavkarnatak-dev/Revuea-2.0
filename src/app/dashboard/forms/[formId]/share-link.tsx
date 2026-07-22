"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ACCENT_STYLES } from "@/features/forms/components/accents";
import type { AccentValue } from "@/features/forms/schema";
import { IconCheck, IconCopy, IconLink } from "@/components/icons";
import { cn } from "@/lib/utils";

export function ShareLink({
  url,
  open,
  accent = "evergreen",
}: {
  url: string;
  open: boolean;
  accent?: string;
}) {
  const [copied, setCopied] = useState(false);
  const style = ACCENT_STYLES[accent as AccentValue] ?? ACCENT_STYLES.evergreen;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (http, permissions) - select-able input remains.
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-card border border-line p-4 sm:flex-row sm:items-center",
        style.tint
      )}
    >
      <span className={cn("flex items-center gap-2 text-sm font-medium", style.text)}>
        <IconLink size={16} />
        {open ? "Share with your team" : "Share link (form is closed)"}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3 text-[13px] text-ink-soft focus:outline-none"
        />
        <Button
          size="sm"
          variant="accent"
          onClick={copy}
          className={cn("shrink-0", style.solid, style.solidHover)}
        >
          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
