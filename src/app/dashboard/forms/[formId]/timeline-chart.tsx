"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";

interface DayBucket {
  date: string; // yyyy-mm-dd
  label: string;
  count: number;
}

/**
 * Responses-over-time - daily bars, single series in the validated chart hue.
 * Per-mark hover tooltip; text stays in ink/muted tokens per the viz rules.
 */
export function TimelineChart({
  timeline,
  color = "var(--color-chart)",
}: {
  timeline: { bucket: string; count: number }[];
  /** Data-ink color - the form's accent chart hex. */
  color?: string;
}) {
  const days = useMemo<DayBucket[]>(() => {
    if (timeline.length === 0) return [];
    const byDay = new Map<string, number>();
    for (const t of timeline) {
      const d = new Date(t.bucket);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + t.count);
    }
    // Fill the full range so quiet days render as gaps, not missing bars.
    const keys = [...byDay.keys()].sort();
    const start = new Date(keys[0]);
    const end = new Date(keys[keys.length - 1]);
    const out: DayBucket[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      out.push({
        date: key,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: byDay.get(key) ?? 0,
      });
    }
    return out.slice(-45); // cap at 45 days so bars stay readable
  }, [timeline]);

  const [hover, setHover] = useState<number | null>(null);

  if (days.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-faint">
        The timeline appears once responses arrive.
      </p>
    );
  }

  const max = Math.max(...days.map((d) => d.count), 1);
  const H = 120;

  return (
    <div>
      <div className="relative">
        {hover != null && (
          <div
            className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-inkwell px-2.5 py-1.5 text-xs text-paper-text shadow-lift"
            style={{ left: `${((hover + 0.5) / days.length) * 100}%` }}
          >
            <span className="font-medium">{days[hover].count}</span>{" "}
            {days[hover].count === 1 ? "response" : "responses"} ·{" "}
            {days[hover].label}
          </div>
        )}
        <div
          className="flex items-end gap-[2px]"
          style={{ height: H }}
          onMouseLeave={() => setHover(null)}
        >
          {days.map((day, i) => (
            <div
              key={day.date}
              className="group relative flex h-full flex-1 items-end"
              onMouseEnter={() => setHover(i)}
            >
              {/* Hit target spans full height; visible mark is the bar */}
              <motion.div
                className="w-full rounded-t-[4px]"
                style={{
                  backgroundColor: color,
                  filter: hover === i ? "brightness(0.8)" : undefined,
                  minHeight: day.count > 0 ? 4 : 0,
                }}
                initial={{ height: 0 }}
                animate={{ height: Math.max((day.count / max) * H, day.count > 0 ? 4 : 0) }}
                transition={{ duration: 0.5, delay: i * 0.012, ease: [0.22, 1, 0.36, 1] }}
              />
              {day.count === 0 && (
                <div className="absolute bottom-0 h-px w-full bg-line" />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between border-t border-line pt-1.5 text-[11px] text-faint">
        <span>{days[0].label}</span>
        <span>{days[days.length - 1].label}</span>
      </div>
    </div>
  );
}
