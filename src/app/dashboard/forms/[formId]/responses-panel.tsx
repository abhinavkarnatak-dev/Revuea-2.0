"use client";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconInbox, IconStar } from "@/components/icons";
import { accentStyle } from "@/features/forms/components/accents";
import { cn } from "@/lib/utils";
import type { FormData } from "./form-tabs";

export interface ResponseData {
  id: string;
  submittedAt: string;
  answers: {
    questionId: string;
    textValue: string | null;
    optionIndexes: number[];
    ratingValue: number | null;
  }[];
}

function formatBucket(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
  });
}

function AnswerValue({
  answer,
  question,
  starClass,
}: {
  answer: ResponseData["answers"][number] | undefined;
  question: FormData["questions"][number];
  starClass: string;
}) {
  if (!answer) return <span className="text-faint">- skipped</span>;

  switch (question.type) {
    case "TEXT":
      return <span className="whitespace-pre-wrap">{answer.textValue}</span>;
    case "RATING":
      return (
        <span className="inline-flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <IconStar
              key={i}
              size={14}
              className={
                i < (answer.ratingValue ?? 0)
                  ? cn("fill-current", starClass)
                  : "text-line-strong"
              }
            />
          ))}
          <span className="tabular ml-1 text-[13px] text-muted">
            {answer.ratingValue}/5
          </span>
        </span>
      );
    case "YES_NO":
      return <span>{answer.optionIndexes[0] === 0 ? "Yes" : "No"}</span>;
    default:
      return (
        <span>
          {answer.optionIndexes
            .map((i) => question.options[i])
            .filter(Boolean)
            .join(", ")}
        </span>
      );
  }
}

export function ResponsesPanel({
  responses,
  questions,
  accent = "evergreen",
}: {
  responses: ResponseData[];
  questions: FormData["questions"];
  accent?: string;
}) {
  const style = accentStyle(accent);

  if (responses.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<IconInbox size={22} />}
          iconClassName={cn(style.tint, style.text)}
          title="Nothing here yet"
          description="Individual responses appear here as they come in - always without any identifying information."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-faint">
        Responses are shown newest first. Submission times are rounded to the
        hour - this is deliberate, to protect respondent anonymity.
      </p>
      {responses.map((response, index) => {
        const byQuestion = new Map(
          response.answers.map((a) => [a.questionId, a])
        );
        return (
          <Card key={response.id} className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-sm font-medium text-muted">
                Response #{responses.length - index}
              </span>
              <span className="text-xs text-faint">
                ~{formatBucket(response.submittedAt)}
              </span>
            </div>
            <dl className="space-y-3.5">
              {questions.map((question) => (
                <div key={question.id}>
                  <dt className="text-[13px] font-medium text-muted">
                    {question.label}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink">
                    <AnswerValue
                      answer={byQuestion.get(question.id)}
                      question={question}
                      starClass={style.text}
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        );
      })}
    </div>
  );
}
