import { cn } from "@/lib/utils";

type Tone = "neutral" | "green" | "amber" | "clay" | "sky" | "ink";

const tones: Record<Tone, string> = {
  neutral: "bg-ink/6 text-ink-soft",
  green: "bg-ever-tint text-ever-deep",
  amber: "bg-amber-tint text-amber",
  clay: "bg-clay-tint text-clay",
  sky: "bg-sky-tint text-sky",
  ink: "bg-inkwell text-paper-text",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  dot = false,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
