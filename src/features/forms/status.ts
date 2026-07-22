import type { Form } from "@prisma/client";

/**
 * A form's *effective* availability, derived from its stored status plus
 * schedule and response-limit settings. Computed, never stored, so it can't
 * drift.
 */
export type EffectiveStatus =
  | "draft"
  | "scheduled" // OPEN but opensAt is in the future
  | "open"
  | "closed"; // explicitly closed, past deadline, or at response limit

export function getEffectiveStatus(
  form: Pick<
    Form,
    "status" | "opensAt" | "closesAt" | "responseLimit"
  >,
  responseCount: number
): EffectiveStatus {
  if (form.status === "DRAFT") return "draft";
  if (form.status === "CLOSED") return "closed";

  const now = new Date();
  if (form.opensAt && now < form.opensAt) return "scheduled";
  if (form.closesAt && now > form.closesAt) return "closed";
  if (form.responseLimit != null && responseCount >= form.responseLimit) {
    return "closed";
  }
  return "open";
}

export const STATUS_META: Record<
  EffectiveStatus,
  { label: string; tone: "neutral" | "green" | "amber" | "clay" | "sky" }
> = {
  draft: { label: "Draft", tone: "neutral" },
  scheduled: { label: "Scheduled", tone: "sky" },
  open: { label: "Collecting", tone: "green" },
  closed: { label: "Closed", tone: "amber" },
};
