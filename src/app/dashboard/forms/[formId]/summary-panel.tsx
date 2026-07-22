"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { generateSummaryAction } from "@/features/summary/actions";
import { accentStyle } from "@/features/forms/components/accents";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Markdown } from "@/components/ui/markdown";
import { IconSparkles } from "@/components/icons";
import { cn, formatDateTime } from "@/lib/utils";

interface SummaryState {
  content: string;
  generatedAt: string;
  cached: boolean;
}

export function SummaryPanel({
  formId,
  responseCount,
  accent = "evergreen",
}: {
  formId: string;
  responseCount: number;
  accent?: string;
}) {
  const style = accentStyle(accent);
  const [summary, setSummary] = useState<SummaryState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const generate = (force = false) => {
    setError(null);
    startTransition(async () => {
      const result = await generateSummaryAction(formId, { force });
      if (result.ok) {
        setSummary({
          content: result.content,
          generatedAt: new Date(result.generatedAt).toISOString(),
          cached: result.cached,
        });
      } else {
        setError(result.error);
      }
    });
  };

  if (responseCount === 0) {
    return (
      <Card>
        <EmptyState
          icon={<IconSparkles size={22} />}
          iconClassName={cn(style.tint, style.text)}
          title="Nothing to summarize yet"
          description="Once responses arrive, Gemini distills them into themes, sentiment, and suggested next steps."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!summary && (
        <Card>
          <EmptyState
            icon={<IconSparkles size={22} />}
            iconClassName={cn(style.tint, style.text)}
            title="Distill the feedback"
            description={`Gemini reads all responses and surfaces what's working, what needs attention, and what to do next.`}
            action={
              <Button
                variant="accent"
                onClick={() => generate()}
                loading={pending}
                className={cn(style.solid, style.solidHover)}
              >
                <IconSparkles size={15} />
                Generate summary
              </Button>
            }
          />
          {error && (
            <p className="pb-6 text-center text-sm text-clay">{error}</p>
          )}
        </Card>
      )}

      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="p-6 sm:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg",
                    style.tint,
                    style.text
                  )}
                >
                  <IconSparkles size={14} />
                </span>
                Feedback digest
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-faint">
                  {summary.cached ? "From " : "Generated "}
                  {formatDateTime(summary.generatedAt)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => generate(true)}
                  loading={pending}
                >
                  Regenerate
                </Button>
              </div>
            </div>
            {error && <p className="mb-4 text-sm text-clay">{error}</p>}
            <Markdown content={summary.content} />
          </Card>
        </motion.div>
      )}
    </div>
  );
}
