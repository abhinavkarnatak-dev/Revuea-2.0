"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconChart, IconStar } from "@/components/icons";
import { accentStyle } from "@/features/forms/components/accents";
import { cn } from "@/lib/utils";
import { TimelineChart } from "./timeline-chart";
import type { FormData } from "./form-tabs";

export interface AnalyticsData {
  responseCount: number;
  completionByQuestion: {
    questionId: string;
    label: string;
    type: string;
    answered: number;
    texts: string[];
    choices: { option: string; count: number; share: number }[];
    average: number | null;
    distribution: number[];
  }[];
  timeline: { bucket: string; count: number }[];
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** Horizontal labeled bar list - single hue (the form's accent), text in ink tokens. */
function ChoiceBars({
  choices,
  color,
}: {
  choices: { option: string; count: number; share: number }[];
  color: string;
}) {
  const max = Math.max(...choices.map((c) => c.share), 0.0001);
  return (
    <div className="space-y-3">
      {choices.map((choice, i) => (
        <div key={i}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-ink-soft">{choice.option}</span>
            <span className="tabular shrink-0 text-[13px] text-muted">
              {choice.count} · {Math.round(choice.share * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink/6">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(choice.share / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: EASE }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RatingBlock({
  average,
  distribution,
  answered,
  color,
  starClass,
}: {
  average: number | null;
  distribution: number[];
  answered: number;
  color: string;
  starClass: string;
}) {
  const max = Math.max(...distribution, 1);
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
      <div className="shrink-0">
        <p className="flex items-baseline gap-1.5">
          <span className="tabular font-display text-5xl font-medium text-ink">
            {average != null ? average.toFixed(1) : "-"}
          </span>
          <span className="text-sm text-muted">/ 5</span>
        </p>
        <p className="mt-1 flex items-center gap-1 text-[13px] text-muted">
          <IconStar size={13} className={starClass} />
          average of {answered} {answered === 1 ? "rating" : "ratings"}
        </p>
      </div>
      <div className="flex h-24 flex-1 items-end gap-2">
        {distribution.map((count, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="tabular text-[11px] text-muted">{count}</span>
            <motion.div
              className="w-full max-w-10 rounded-t-[4px]"
              style={{
                backgroundColor: color,
                minHeight: count > 0 ? 4 : 1,
              }}
              initial={{ height: 0 }}
              whileInView={{ height: Math.max((count / max) * 64, count > 0 ? 4 : 1) }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
            />
            <span className="text-[11px] text-faint">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TextAnswers({ texts, color }: { texts: string[]; color: string }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? texts : texts.slice(0, 5);

  if (texts.length === 0) {
    return <p className="text-sm text-faint">No written answers yet.</p>;
  }

  return (
    <div className="space-y-2.5">
      {visible.map((text, i) => (
        <blockquote
          key={i}
          className="rounded-xl border-l-2 bg-paper px-4 py-3 text-sm leading-relaxed text-ink-soft"
          style={{ borderLeftColor: color }}
        >
          {text}
        </blockquote>
      ))}
      {texts.length > 5 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[13px] font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          {expanded ? "Show fewer" : `Show all ${texts.length} answers`}
        </button>
      )}
    </div>
  );
}

export function AnalyticsPanel({
  analytics,
  questions,
  accent = "evergreen",
}: {
  analytics: AnalyticsData;
  questions: FormData["questions"];
  accent?: string;
}) {
  const style = accentStyle(accent);

  if (analytics.responseCount === 0) {
    return (
      <Card>
        <EmptyState
          icon={<IconChart size={22} />}
          iconClassName={cn(style.tint, style.text)}
          title="No responses yet"
          description="Share the form link with your team - analytics light up with the first response."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-ink">Responses over time</h3>
        <p className="mb-5 mt-0.5 text-[13px] text-faint">
          Times are rounded to the hour to protect anonymity.
        </p>
        <TimelineChart timeline={analytics.timeline} color={style.chart} />
      </Card>

      {analytics.completionByQuestion.map((qa, index) => (
        <Card key={qa.questionId} className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h3 className="text-[15px] font-semibold leading-snug text-ink">
              <span className="mr-2 font-display text-faint">{index + 1}.</span>
              {qa.label}
            </h3>
            <span className="tabular shrink-0 rounded-full bg-ink/5 px-2.5 py-1 text-xs text-muted">
              {qa.answered} answered
            </span>
          </div>

          {qa.type === "TEXT" && (
            <TextAnswers texts={qa.texts} color={style.chart} />
          )}
          {(qa.type === "MCQ" || qa.type === "MULTI" || qa.type === "YES_NO") && (
            <ChoiceBars choices={qa.choices} color={style.chart} />
          )}
          {qa.type === "RATING" && (
            <RatingBlock
              average={qa.average}
              distribution={qa.distribution}
              answered={qa.answered}
              color={style.chart}
              starClass={style.text}
            />
          )}
        </Card>
      ))}
      {/* keep reference to questions for future per-question drill-down */}
      {questions.length === 0 && null}
    </div>
  );
}
