import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "inverted"
  | "accent";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-ever text-white hover:bg-ever-deep active:scale-[0.98] shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]",
  secondary:
    "bg-raised text-ink border border-line-strong hover:border-faint hover:bg-surface active:scale-[0.98]",
  ghost: "text-ink-soft hover:text-ink hover:bg-ink/5 active:scale-[0.98]",
  danger: "bg-clay-tint text-clay hover:bg-clay hover:text-white active:scale-[0.98]",
  inverted:
    "bg-paper-text text-inkwell hover:bg-white active:scale-[0.98]",
  /* No background of its own - caller supplies the form-accent bg classes
     via className (avoids bg-ever vs bg-<accent> class conflicts). */
  accent:
    "text-white active:scale-[0.98] shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4.5 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium",
        "transition-all duration-200 select-none whitespace-nowrap",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
