import { z } from "zod";

/**
 * Shared validation for the form builder - used by both the client
 * (inline errors) and server actions (source of truth).
 */

export const QUESTION_TYPES = [
  "TEXT",
  "MCQ",
  "MULTI",
  "RATING",
  "YES_NO",
] as const;

export type QuestionTypeValue = (typeof QUESTION_TYPES)[number];

export const ACCENTS = ["evergreen", "ink", "amber", "sky", "clay"] as const;
export type AccentValue = (typeof ACCENTS)[number];

const questionSchema = z
  .object({
    id: z.string().optional(), // present when editing existing questions
    type: z.enum(QUESTION_TYPES),
    label: z
      .string()
      .trim()
      .min(1, "Question can't be empty")
      .max(500, "Keep questions under 500 characters"),
    required: z.boolean(),
    options: z
      .array(z.string().trim().min(1, "Option can't be empty").max(200))
      .max(10, "At most 10 options"),
  })
  .superRefine((q, ctx) => {
    if ((q.type === "MCQ" || q.type === "MULTI") && q.options.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Choice questions need at least 2 options",
        path: ["options"],
      });
    }
  });

export const formSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title needs at least 3 characters")
      .max(120, "Keep the title under 120 characters"),
    description: z
      .string()
      .trim()
      .max(1000, "Keep the description under 1000 characters"),
    accent: z.enum(ACCENTS),
    opensAt: z.iso.datetime({ offset: true }).nullable(),
    closesAt: z.iso.datetime({ offset: true }).nullable(),
    responseLimit: z
      .number()
      .int()
      .min(1)
      .max(10000)
      .nullable(),
    questions: z
      .array(questionSchema)
      .min(1, "Add at least one question")
      .max(30, "At most 30 questions per form"),
  })
  .superRefine((form, ctx) => {
    if (
      form.opensAt &&
      form.closesAt &&
      new Date(form.closesAt) <= new Date(form.opensAt)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Deadline must be after the open time",
        path: ["closesAt"],
      });
    }
  });

export type FormInput = z.infer<typeof formSchema>;
export type QuestionInput = z.infer<typeof formSchema>["questions"][number];

export const QUESTION_TYPE_META: Record<
  QuestionTypeValue,
  { label: string; hint: string }
> = {
  TEXT: { label: "Open text", hint: "Free-form written answer" },
  MCQ: { label: "Multiple choice", hint: "Pick one option" },
  MULTI: { label: "Checkboxes", hint: "Pick any that apply" },
  RATING: { label: "Rating", hint: "Scale of 1 to 5" },
  YES_NO: { label: "Yes / No", hint: "A simple binary" },
};
