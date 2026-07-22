"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  formSchema,
  QUESTION_TYPES,
  QUESTION_TYPE_META,
  ACCENTS,
  type FormInput,
  type QuestionTypeValue,
  type AccentValue,
} from "../schema";
import { createFormAction, updateFormAction } from "../actions";
import { ACCENT_STYLES } from "./accents";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  IconPlus,
  IconTrash,
  IconX,
  IconChevronDown,
} from "@/components/icons";
import { cn } from "@/lib/utils";

interface BuilderQuestion {
  key: string; // stable client-side key
  id?: string; // db id when editing
  type: QuestionTypeValue;
  label: string;
  required: boolean;
  options: string[];
}

export interface BuilderInitial {
  title: string;
  description: string;
  accent: AccentValue;
  opensAt: string | null; // ISO
  closesAt: string | null; // ISO
  responseLimit: number | null;
  questions: Omit<BuilderQuestion, "key">[];
}

let keyCounter = 0;
const nextKey = () => `q${++keyCounter}`;

function newQuestion(type: QuestionTypeValue): BuilderQuestion {
  return {
    key: nextKey(),
    type,
    label: "",
    required: true,
    options: type === "MCQ" || type === "MULTI" ? ["", ""] : [],
  };
}

/** ISO string → value usable by <input type="datetime-local"> (local tz). */
function isoToLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function FormBuilder({
  mode,
  formId,
  initial,
  questionsLocked = false,
}: {
  mode: "create" | "edit";
  formId?: string;
  initial?: BuilderInitial;
  questionsLocked?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [accent, setAccent] = useState<AccentValue>(initial?.accent ?? "evergreen");
  const [opensAt, setOpensAt] = useState(isoToLocal(initial?.opensAt ?? null));
  const [closesAt, setClosesAt] = useState(isoToLocal(initial?.closesAt ?? null));
  const [responseLimit, setResponseLimit] = useState(
    initial?.responseLimit?.toString() ?? ""
  );
  const [questions, setQuestions] = useState<BuilderQuestion[]>(
    initial?.questions.map((q) => ({ ...q, key: nextKey() })) ?? [
      newQuestion("TEXT"),
    ]
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const patchQuestion = (key: string, patch: Partial<BuilderQuestion>) => {
    setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  };

  const move = (index: number, dir: -1 | 1) => {
    setQuestions((qs) => {
      const next = [...qs];
      const target = index + dir;
      if (target < 0 || target >= next.length) return qs;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const submit = () => {
    setError(null);
    const payload: FormInput = {
      title,
      description,
      accent,
      opensAt: localToIso(opensAt),
      closesAt: localToIso(closesAt),
      responseLimit: responseLimit ? Number(responseLimit) : null,
      questions: questions.map((q) => ({
        id: q.id,
        type: q.type,
        label: q.label,
        required: q.required,
        options:
          q.type === "MCQ" || q.type === "MULTI"
            ? q.options.filter((o) => o.trim())
            : [],
      })),
    };

    const parsed = formSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form for errors.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createFormAction(parsed.data)
          : await updateFormAction(formId!, parsed.data);
      if (result.ok) {
        router.push(`/dashboard/forms/${result.formId}`);
        router.refresh();
      } else {
        setError(result.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      {error && (
        <div className="mb-6 rounded-field border border-clay/20 bg-clay-tint px-4 py-3 text-sm text-clay">
          {error}
        </div>
      )}

      {/* ── Basics ─────────────────────────────────────── */}
      <Card className="p-6">
        <div className="space-y-5">
          <Field label="Form title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q3 team health check"
              maxLength={120}
              autoFocus={mode === "create"}
            />
          </Field>
          <Field label="Description" hint="Optional - shown to respondents">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A quick pulse on how the quarter felt. Fully anonymous - say what you actually think."
              rows={3}
              maxLength={1000}
            />
          </Field>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">
              Accent color
            </span>
            <div className="flex gap-2.5">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAccent(a)}
                  aria-label={`Accent ${a}`}
                  className={cn(
                    "size-8 rounded-full transition-all duration-150",
                    ACCENT_STYLES[a].swatch,
                    accent === a
                      ? "ring-2 ring-offset-2 ring-offset-surface " + ACCENT_STYLES[a].ring
                      : "opacity-60 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Questions ──────────────────────────────────── */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-medium text-ink">Questions</h2>
        {questionsLocked && (
          <span className="text-[13px] text-amber">
            Locked - this form already has responses
          </span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <AnimatePresence initial={false}>
          {questions.map((q, index) => (
            <motion.div
              key={q.key}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className={cn("p-5", questionsLocked && "opacity-60")}>
                <div className="flex items-start gap-3">
                  <span className="mt-2.5 w-6 shrink-0 text-center font-display text-sm font-medium text-faint">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={q.type}
                        disabled={questionsLocked}
                        onChange={(e) => {
                          const type = e.target.value as QuestionTypeValue;
                          patchQuestion(q.key, {
                            type,
                            options:
                              type === "MCQ" || type === "MULTI"
                                ? q.options.length >= 2
                                  ? q.options
                                  : ["", ""]
                                : [],
                          });
                        }}
                        className="h-8 rounded-lg border border-line-strong bg-raised px-2.5 text-[13px] font-medium text-ink-soft focus:border-ever focus:outline-none"
                      >
                        {QUESTION_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {QUESTION_TYPE_META[t].label}
                          </option>
                        ))}
                      </select>
                      <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-muted">
                        <input
                          type="checkbox"
                          checked={q.required}
                          disabled={questionsLocked}
                          onChange={(e) =>
                            patchQuestion(q.key, { required: e.target.checked })
                          }
                          className="size-3.5 accent-(--color-ever)"
                        />
                        Required
                      </label>
                      <div className="ml-auto flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={index === 0 || questionsLocked}
                          aria-label="Move up"
                          className="rounded-lg p-1.5 text-faint transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30"
                        >
                          <IconChevronDown size={15} className="rotate-180" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={index === questions.length - 1 || questionsLocked}
                          aria-label="Move down"
                          className="rounded-lg p-1.5 text-faint transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30"
                        >
                          <IconChevronDown size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setQuestions((qs) => qs.filter((x) => x.key !== q.key))
                          }
                          disabled={questions.length === 1 || questionsLocked}
                          aria-label="Delete question"
                          className="rounded-lg p-1.5 text-faint transition-colors hover:bg-clay-tint hover:text-clay disabled:opacity-30"
                        >
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </div>

                    <Input
                      value={q.label}
                      disabled={questionsLocked}
                      onChange={(e) => patchQuestion(q.key, { label: e.target.value })}
                      placeholder={
                        q.type === "RATING"
                          ? "How would you rate team communication this quarter?"
                          : q.type === "YES_NO"
                            ? "Would you recommend working on this team?"
                            : "What should we start, stop, or continue doing?"
                      }
                      maxLength={500}
                    />

                    {(q.type === "MCQ" || q.type === "MULTI") && (
                      <div className="space-y-2">
                        {q.options.map((option, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <span
                              className={cn(
                                "size-3.5 shrink-0 border border-line-strong",
                                q.type === "MCQ" ? "rounded-full" : "rounded-[4px]"
                              )}
                            />
                            <Input
                              value={option}
                              disabled={questionsLocked}
                              onChange={(e) => {
                                const options = [...q.options];
                                options[oi] = e.target.value;
                                patchQuestion(q.key, { options });
                              }}
                              placeholder={`Option ${oi + 1}`}
                              className="h-9 text-sm"
                              maxLength={200}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                patchQuestion(q.key, {
                                  options: q.options.filter((_, x) => x !== oi),
                                })
                              }
                              disabled={q.options.length <= 2 || questionsLocked}
                              aria-label="Remove option"
                              className="shrink-0 rounded-lg p-1.5 text-faint transition-colors hover:text-clay disabled:opacity-30"
                            >
                              <IconX size={14} />
                            </button>
                          </div>
                        ))}
                        {q.options.length < 10 && !questionsLocked && (
                          <button
                            type="button"
                            onClick={() =>
                              patchQuestion(q.key, { options: [...q.options, ""] })
                            }
                            className="inline-flex items-center gap-1.5 pl-5.5 text-[13px] font-medium text-ever transition-colors hover:text-ever-deep"
                          >
                            <IconPlus size={13} />
                            Add option
                          </button>
                        )}
                      </div>
                    )}

                    {q.type === "RATING" && (
                      <p className="text-[13px] text-faint">
                        Respondents pick a rating from 1 to 5.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add question */}
      {!questionsLocked && (
        <div className="relative mt-4">
          <Button
            variant="secondary"
            className="w-full"
            type="button"
            onClick={() => setAddMenuOpen((v) => !v)}
          >
            <IconPlus size={16} />
            Add question
          </Button>
          <AnimatePresence>
            {addMenuOpen && (
              <motion.div
                className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-raised shadow-modal"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <div className="grid gap-1 p-2 sm:grid-cols-2">
                  {QUESTION_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setQuestions((qs) => [...qs, newQuestion(t)]);
                        setAddMenuOpen(false);
                      }}
                      className="rounded-xl px-3.5 py-2.5 text-left transition-colors hover:bg-ever-wash"
                    >
                      <span className="block text-sm font-medium text-ink">
                        {QUESTION_TYPE_META[t].label}
                      </span>
                      <span className="block text-[13px] text-muted">
                        {QUESTION_TYPE_META[t].hint}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Settings ───────────────────────────────────── */}
      <h2 className="mt-8 font-display text-xl font-medium text-ink">
        Collection settings
      </h2>
      <Card className="mt-4 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Opens" hint="Optional">
            <Input
              type="datetime-local"
              value={opensAt}
              onChange={(e) => setOpensAt(e.target.value)}
            />
          </Field>
          <Field label="Deadline" hint="Optional">
            <Input
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
            />
          </Field>
          <Field
            label="Response limit"
            hint="Optional - form closes automatically"
          >
            <Input
              type="number"
              min={1}
              max={10000}
              value={responseLimit}
              onChange={(e) => setResponseLimit(e.target.value)}
              placeholder="No limit"
            />
          </Field>
        </div>
      </Card>

      {/* ── Submit ─────────────────────────────────────── */}
      <div className="mt-8 flex items-center justify-end gap-3 border-t border-line pt-6">
        <Button
          variant="ghost"
          type="button"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button onClick={submit} loading={pending} size="lg">
          {mode === "create" ? "Create form" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
