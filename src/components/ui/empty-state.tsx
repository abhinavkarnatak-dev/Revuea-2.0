import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  iconClassName,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Override the icon chip colors (e.g. to match a form's accent). */
  iconClassName?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <div
          className={cn(
            "mb-4 flex size-12 items-center justify-center rounded-2xl",
            iconClassName ?? "bg-ever-tint text-ever"
          )}
        >
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
