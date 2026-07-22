"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { submitResponseAction } from "@/features/responses/actions";
import type { AnswerInput } from "@/features/responses/service";
import { ACCENT_STYLES } from "@/features/forms/components/accents";
import type { AccentValue } from "@/features/forms/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconMaskOff,
  IconStar,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

interface PublicQuestion {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options: string[];
}

interface PublicForm {
  slug: string;
  title: string;
  description: string;
  accent: string;
  creatorName: string | null;
  questions: PublicQuestion[];
}

interface DraftAnswer {
  textValue?: string;
  optionIndexes?: number[];
  ratingValue?: number;
}

function hasContent(answer: DraftAnswer | undefined): boolean {
  return Boolean(
    answer &&
      (answer.textValue?.trim() ||
        (answer.optionIndexes?.length ?? 0) > 0 ||
        answer.ratingValue != null)
  );
}

export function FillForm({ form }: { form: PublicForm }) {
  const accent =
    ACCENT_STYLES[(form.accent as AccentValue) in ACCENT_STYLES ? (form.accent as AccentValue) : "evergreen"];

  // step -1 = intro, 0..n-1 = questions, n = success
  const [step, setStep] = useState(-1);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, DraftAnswer>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  // Duplicate-submission memory lives ONLY on this device (localStorage) -
  // the server deliberately stores nothing that could identify a respondent.
  const submittedKey = `revuea:submitted:${form.slug}`;
  useEffect(() => {
    try {
      if (localStorage.getItem(submittedKey)) setAlreadySubmitted(true);
    } catch {
      // storage unavailable (private mode) - degrade to allowing the form
    }
  }, [submittedKey]);

  const total = form.questions.length;
  const progress = done ? 1 : Math.max(0, step) / total;
  const estMinutes = useMemo(() => Math.max(1, Math.round(total * 0.4)), [total]);

  const patch = (questionId: string, value: DraftAnswer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError(null);
  };

  const goTo = (next: number, dir: 1 | -1) => {
    setDirection(dir);
    setError(null);
    setStep(next);
  };

  const advance = () => {
    const question = form.questions[step];
    if (question.required && !hasContent(answers[question.id])) {
      setError("This one needs an answer before you continue.");
      return;
    }
    if (step < total - 1) {
      goTo(step + 1, 1);
    } else {
      submit();
    }
  };

  const submit = () => {
    const payload: { slug: string; answers: AnswerInput[] } = {
      slug: form.slug,
      answers: form.questions
        .filter((q) => hasContent(answers[q.id]))
        .map((q) => ({ questionId: q.id, ...answers[q.id] })),
    };
    if (payload.answers.length === 0) {
      setError("Answer at least one question before submitting.");
      return;
    }
    startTransition(async () => {
      const result = await submitResponseAction(payload);
      if (result.ok) {
        setDone(true);
        try {
          localStorage.setItem(submittedKey, new Date().toISOString());
        } catch {
          // best-effort only
        }
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <main className="flex min-h-dvh flex-col bg-paper">
      {/* Progress bar */}
      <div className="fixed inset-x-0 top-0 z-40 h-1 bg-line/60">
        <motion.div
          className={cn("h-full", accent.solid)}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.4, ease: EASE }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ── Already submitted (this device) ─────────── */}
          {alreadySubmitted && !done ? (
            <motion.div
              key="already"
              className="flex flex-1 flex-col items-center justify-center py-16 text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <span
                className={cn(
                  "flex size-14 items-center justify-center rounded-2xl",
                  accent.tint,
                  accent.text
                )}
              >
                <IconCheck size={26} />
              </span>
              <h1 className="mt-5 font-display text-3xl font-medium tracking-tight text-ink">
                You've already responded
              </h1>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
                A response was already submitted from this device - and it was
                recorded completely anonymously, so there's nothing more to do.
              </p>
              <button
                onClick={() => setAlreadySubmitted(false)}
                className="mt-8 text-[13px] text-faint underline-offset-4 transition-colors hover:text-muted hover:underline"
              >
                Someone else using this device? Fill it out again
              </button>
              <p className="mt-12 text-xs text-faint">
                Powered by Revuea - anonymous team feedback
              </p>
            </motion.div>
          ) : done ? (
            <motion.div
              key="success"
              className="flex flex-1 flex-col items-center justify-center py-16 text-center"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <motion.span
                className={cn(
                  "flex size-16 items-center justify-center rounded-full text-white",
                  accent.solid
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
              >
                <IconCheck size={30} />
              </motion.span>
              <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-ink">
                Thank you - truly.
              </h1>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
                Your feedback was submitted completely anonymously. There is no
                record of who wrote it - not even for the person who asked.
              </p>
              <p className="mt-12 text-xs text-faint">
                Powered by Revuea - anonymous team feedback
              </p>
            </motion.div>
          ) : step === -1 ? (
            /* ── Intro ─────────────────────────────────── */
            <motion.div
              key="intro"
              className="flex flex-1 flex-col justify-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium",
                  accent.tint,
                  accent.text
                )}
              >
                <IconMaskOff size={14} />
                100% anonymous
              </span>
              <h1 className="mt-5 font-display text-4xl font-medium leading-tight tracking-tight text-ink">
                {form.title}
              </h1>
              {form.description && (
                <p className="mt-4 text-[16px] leading-relaxed text-muted">
                  {form.description}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-faint">
                {form.creatorName && <span>Asked by {form.creatorName}</span>}
                <span>
                  {total} {total === 1 ? "question" : "questions"} · ~{estMinutes} min
                </span>
              </div>

              <div className="mt-8">
                <Button
                  size="lg"
                  variant="accent"
                  className={cn(accent.solid, accent.solidHover)}
                  onClick={() => goTo(0, 1)}
                >
                  Start
                  <IconArrowRight size={16} />
                </Button>
              </div>

              <p className="mt-10 max-w-md text-[13px] leading-relaxed text-faint">
                Your answers can't be traced back to you. No account, no name,
                no IP address - submission times are even blurred to the hour.
              </p>
            </motion.div>
          ) : (
            /* ── Question steps ────────────────────────── */
            <motion.div
              key={`q-${step}`}
              custom={direction}
              className="flex flex-1 flex-col justify-center py-16"
              initial={{ opacity: 0, x: direction * 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -48 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <p className="text-[13px] font-medium text-faint">
                {step + 1} of {total}
                {!form.questions[step].required && " · optional"}
              </p>
              <h2 className="mt-2 font-display text-[26px] font-medium leading-snug tracking-tight text-ink sm:text-3xl">
                {form.questions[step].label}
              </h2>

              <div className="mt-7">
                <QuestionField
                  question={form.questions[step]}
                  value={answers[form.questions[step].id]}
                  onChange={(v) => patch(form.questions[step].id, v)}
                  accentSolid={accent.solid}
                  accentText={accent.text}
                  accentTint={accent.tint}
                />
              </div>

              {error && (
                <p className="mt-4 text-sm font-medium text-clay">{error}</p>
              )}

              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => (step === 0 ? goTo(-1, -1) : goTo(step - 1, -1))}
                  className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
                >
                  <IconArrowLeft size={15} />
                  Back
                </button>
                <Button
                  size="lg"
                  variant="accent"
                  className={cn(accent.solid, accent.solidHover)}
                  onClick={advance}
                  loading={pending}
                >
                  {step === total - 1 ? "Submit anonymously" : "Next"}
                  {step < total - 1 && <IconArrowRight size={16} />}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ── Per-type inputs ─────────────────────────────────────── */

function QuestionField({
  question,
  value,
  onChange,
  accentSolid,
  accentText,
  accentTint,
}: {
  question: PublicQuestion;
  value: DraftAnswer | undefined;
  onChange: (v: DraftAnswer) => void;
  accentSolid: string;
  accentText: string;
  accentTint: string;
}) {
  switch (question.type) {
    case "TEXT":
      return (
        <Textarea
          value={value?.textValue ?? ""}
          onChange={(e) => onChange({ textValue: e.target.value })}
          placeholder="Say what you actually think…"
          rows={5}
          maxLength={5000}
          autoFocus
          className="text-base"
        />
      );

    case "MCQ":
    case "YES_NO": {
      const options = question.type === "YES_NO" ? ["Yes", "No"] : question.options;
      const selected = value?.optionIndexes?.[0];
      return (
        <div className="space-y-2.5" role="radiogroup" aria-label={question.label}>
          {options.map((option, i) => (
            <button
              key={i}
              role="radio"
              aria-checked={selected === i}
              onClick={() => onChange({ optionIndexes: [i] })}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] transition-all duration-150",
                selected === i
                  ? cn("border-transparent font-medium", accentTint, accentText)
                  : "border-line-strong bg-raised text-ink-soft hover:border-faint"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  selected === i ? cn("border-transparent", accentSolid) : "border-line-strong"
                )}
              >
                {selected === i && <span className="size-1.5 rounded-full bg-white" />}
              </span>
              {option}
            </button>
          ))}
        </div>
      );
    }

    case "MULTI": {
      const selected = new Set(value?.optionIndexes ?? []);
      return (
        <div className="space-y-2.5">
          {question.options.map((option, i) => {
            const checked = selected.has(i);
            return (
              <button
                key={i}
                role="checkbox"
                aria-checked={checked}
                onClick={() => {
                  const next = new Set(selected);
                  if (checked) next.delete(i);
                  else next.add(i);
                  onChange({ optionIndexes: [...next].sort((a, b) => a - b) });
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] transition-all duration-150",
                  checked
                    ? cn("border-transparent font-medium", accentTint, accentText)
                    : "border-line-strong bg-raised text-ink-soft hover:border-faint"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                    checked
                      ? cn("border-transparent text-white", accentSolid)
                      : "border-line-strong"
                  )}
                >
                  {checked && <IconCheck size={13} />}
                </span>
                {option}
              </button>
            );
          })}
          <p className="pt-1 text-[13px] text-faint">Select all that apply</p>
        </div>
      );
    }

    case "RATING": {
      const rating = value?.ratingValue;
      return (
        <div>
          <div className="flex gap-2.5" role="radiogroup" aria-label="Rating from 1 to 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <motion.button
                key={n}
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} of 5`}
                onClick={() => onChange({ ratingValue: n })}
                whileTap={{ scale: 0.92 }}
                className={cn(
                  "flex size-13 flex-1 items-center justify-center rounded-2xl border text-lg font-medium transition-all duration-150 sm:size-14",
                  rating != null && n <= rating
                    ? cn("border-transparent text-white", accentSolid)
                    : "border-line-strong bg-raised text-muted hover:border-faint"
                )}
              >
                <IconStar
                  size={20}
                  className={rating != null && n <= rating ? "fill-current" : ""}
                />
              </motion.button>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[12px] text-faint">
            <span>Not great</span>
            <span>Excellent</span>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
