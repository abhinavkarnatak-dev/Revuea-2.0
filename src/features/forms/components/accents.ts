import type { AccentValue } from "../schema";

/**
 * Visual identity per form accent - used in the builder picker, the public
 * form, and the creator dashboard (cards, tabs, buttons, charts).
 * `chart` is the data-ink hex for bars/marks - each validated against the
 * light surface with the dataviz palette checker (ink is deliberate
 * monochrome: single-series labeled bars, color carries no identity).
 */
export const ACCENT_STYLES: Record<
  AccentValue,
  {
    swatch: string;
    solid: string;
    solidHover: string;
    tint: string;
    text: string;
    ring: string;
    chart: string;
  }
> = {
  evergreen: {
    swatch: "bg-ever",
    solid: "bg-ever",
    solidHover: "hover:bg-ever-deep",
    tint: "bg-ever-tint",
    text: "text-ever-deep",
    ring: "ring-ever",
    chart: "#0e8a5f",
  },
  ink: {
    swatch: "bg-inkwell",
    solid: "bg-inkwell",
    solidHover: "hover:bg-inkwell-soft",
    tint: "bg-ink/6",
    text: "text-ink",
    ring: "ring-inkwell",
    chart: "#2e312c",
  },
  amber: {
    swatch: "bg-amber",
    solid: "bg-amber",
    solidHover: "hover:brightness-90",
    tint: "bg-amber-tint",
    text: "text-amber",
    ring: "ring-amber",
    chart: "#c07f10",
  },
  sky: {
    swatch: "bg-sky",
    solid: "bg-sky",
    solidHover: "hover:brightness-90",
    tint: "bg-sky-tint",
    text: "text-sky",
    ring: "ring-sky",
    chart: "#3d6ea5",
  },
  clay: {
    swatch: "bg-clay",
    solid: "bg-clay",
    solidHover: "hover:brightness-90",
    tint: "bg-clay-tint",
    text: "text-clay",
    ring: "ring-clay",
    chart: "#b0462e",
  },
};

/** Safe lookup with evergreen fallback for any stored accent string. */
export function accentStyle(accent: string | null | undefined) {
  return ACCENT_STYLES[accent as AccentValue] ?? ACCENT_STYLES.evergreen;
}
