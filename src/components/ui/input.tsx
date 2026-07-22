import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.ComponentPropsWithRef<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-field border border-line-strong bg-raised px-3.5 text-[15px] text-ink",
        "placeholder:text-faint",
        "transition-colors duration-150",
        "hover:border-faint",
        "focus:border-ever focus:outline-none focus:ring-2 focus:ring-ever/15",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full rounded-field border border-line-strong bg-raised px-3.5 py-3 text-[15px] text-ink",
        "placeholder:text-faint resize-none",
        "transition-colors duration-150",
        "hover:border-faint",
        "focus:border-ever focus:outline-none focus:ring-2 focus:ring-ever/15",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-ink-soft">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-[13px] text-clay">{error}</span>}
    </label>
  );
}
