import { customAlphabet } from "nanoid";

/** Tiny className combiner - enough for this codebase, no dependency needed. */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Public share slugs. Unambiguous lowercase alphabet, 12 chars
 * → ~4×10^18 combinations, practically unguessable and unenumerable
 * (the old app used sequential integer ids - fixed here).
 */
const slugAlphabet = "23456789abcdefghjkmnpqrstuvwxyz";
export const generateFormSlug = customAlphabet(slugAlphabet, 12);

/** Round a date DOWN to the hour - used to coarsen response timestamps. */
export function floorToHour(date: Date): Date {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : (plural ?? singular + "s")}`;
}
