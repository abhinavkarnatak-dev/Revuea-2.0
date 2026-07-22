"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { accentStyle } from "@/features/forms/components/accents";
import { AnalyticsPanel, type AnalyticsData } from "./analytics-panel";
import { ResponsesPanel, type ResponseData } from "./responses-panel";
import { SummaryPanel } from "./summary-panel";

const REFRESH_INTERVAL_MS = 10_000;

export interface FormData {
  id: string;
  responseCount: number;
  questions: {
    id: string;
    type: string;
    label: string;
    options: string[];
  }[];
}

const TABS = [
  { id: "analytics", label: "Analytics" },
  { id: "responses", label: "Responses" },
  { id: "summary", label: "AI summary" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function FormTabs({
  form,
  analytics,
  responses,
  accent = "evergreen",
}: {
  form: FormData;
  analytics: AnalyticsData;
  responses: ResponseData[];
  accent?: string;
}) {
  const [active, setActive] = useState<TabId>("analytics");
  const router = useRouter();
  const style = accentStyle(accent);

  // Live data: re-fetch the server component's props on an interval and on
  // tab focus, so new responses show up without a manual reload.
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) router.refresh();
    };
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);

  return (
    <div>
      <div
        role="tablist"
        className="flex items-center gap-1 border-b border-line"
        aria-label="Form views"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              active === tab.id ? "text-ink" : "text-muted hover:text-ink-soft"
            )}
          >
            {tab.label}
            {tab.id === "responses" && (
              <span className="tabular ml-1.5 rounded-full bg-ink/6 px-1.5 py-0.5 text-[11px] text-ink-soft">
                {form.responseCount}
              </span>
            )}
            {active === tab.id && (
              <motion.span
                layoutId="tab-underline"
                className={cn(
                  "absolute inset-x-3 -bottom-px h-0.5 rounded-full",
                  style.solid
                )}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </button>
        ))}
        <span className="ml-auto mr-1 hidden items-center gap-1.5 text-[11px] font-medium text-faint sm:flex">
          <span className="relative flex size-1.5">
            <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", style.solid)} />
            <span className={cn("relative inline-flex size-1.5 rounded-full", style.solid)} />
          </span>
          Live - updates automatically
        </span>
      </div>

      <div className="pt-6">
        {active === "analytics" && (
          <AnalyticsPanel
            analytics={analytics}
            questions={form.questions}
            accent={accent}
          />
        )}
        {active === "responses" && (
          <ResponsesPanel
            responses={responses}
            questions={form.questions}
            accent={accent}
          />
        )}
        {active === "summary" && (
          <SummaryPanel
            formId={form.id}
            responseCount={form.responseCount}
            accent={accent}
          />
        )}
      </div>
    </div>
  );
}
