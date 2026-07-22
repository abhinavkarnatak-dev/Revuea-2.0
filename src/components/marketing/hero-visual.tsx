"use client";

import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

const cards = [
  {
    quote: "Standups drag on too long - could we timebox them?",
    tag: "Process",
    rotate: -3,
    x: "-6%",
    y: 0,
    delay: 0.55,
  },
  {
    quote: "Honestly, the new review flow is the best change this year.",
    tag: "Praise",
    rotate: 2,
    x: "8%",
    y: 36,
    delay: 0.75,
  },
  {
    quote: "I don't always feel heard in planning meetings.",
    tag: "Culture",
    rotate: -1,
    x: "-2%",
    y: 72,
    delay: 0.95,
  },
] as const;

/**
 * Floating anonymous response cards - the product's essence in one visual.
 * Pure divs + motion; no images, nothing heavy.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto h-[340px] w-full max-w-md select-none sm:h-[380px]">
      {/* Soft evergreen glow behind the stack */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ever/10 blur-3xl"
      />
      {cards.map((card, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 w-[88%] max-w-sm rounded-2xl border border-line bg-raised p-5 shadow-lift"
          style={{ top: card.y, x: "-50%", marginLeft: card.x }}
          initial={{ opacity: 0, y: 32, rotate: 0 }}
          animate={{ opacity: 1, y: 0, rotate: card.rotate }}
          transition={{ duration: 0.7, delay: card.delay, ease: EASE }}
          whileHover={{ rotate: 0, scale: 1.02, zIndex: 10 }}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ever-tint px-2.5 py-0.5 text-[11px] font-medium text-ever-deep">
              <span className="size-1.5 rounded-full bg-ever" />
              Anonymous
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-faint">
              {card.tag}
            </span>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            “{card.quote}”
          </p>
        </motion.div>
      ))}
    </div>
  );
}
