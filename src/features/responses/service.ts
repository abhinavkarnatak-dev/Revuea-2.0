import "server-only";
import { prisma } from "@/lib/prisma";
import { floorToHour } from "@/lib/utils";
import { getEffectiveStatus } from "@/features/forms/status";
import type { QuestionType } from "@prisma/client";

export interface ResponseWithAnswers {
  id: string;
  submittedAt: Date;
  answers: {
    questionId: string;
    textValue: string | null;
    optionIndexes: number[];
    ratingValue: number | null;
  }[];
}

/** Individual responses for the creator's "Responses" tab, newest first. */
export async function listResponses(
  formId: string
): Promise<ResponseWithAnswers[]> {
  return prisma.response.findMany({
    where: { formId },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      submittedAt: true,
      answers: {
        select: {
          questionId: true,
          textValue: true,
          optionIndexes: true,
          ratingValue: true,
        },
      },
    },
  });
}

export interface AnswerInput {
  questionId: string;
  textValue?: string;
  optionIndexes?: number[];
  ratingValue?: number;
}

export type SubmitResult =
  | { ok: true }
  | {
      ok: false;
      error: "not-found" | "not-open" | "invalid";
      message: string;
    };

function validateAnswer(
  type: QuestionType,
  optionCount: number,
  answer: AnswerInput
): boolean {
  switch (type) {
    case "TEXT":
      return (
        typeof answer.textValue === "string" &&
        answer.textValue.trim().length > 0 &&
        answer.textValue.length <= 5000
      );
    case "MCQ":
    case "YES_NO": {
      const idxs = answer.optionIndexes ?? [];
      const max = type === "YES_NO" ? 2 : optionCount;
      return idxs.length === 1 && idxs[0] >= 0 && idxs[0] < max;
    }
    case "MULTI": {
      const idxs = answer.optionIndexes ?? [];
      return (
        idxs.length >= 1 &&
        idxs.length <= optionCount &&
        new Set(idxs).size === idxs.length &&
        idxs.every((i) => Number.isInteger(i) && i >= 0 && i < optionCount)
      );
    }
    case "RATING":
      return (
        Number.isInteger(answer.ratingValue) &&
        answer.ratingValue! >= 1 &&
        answer.ratingValue! <= 5
      );
  }
}

/**
 * Anonymous submission. Every answer is validated against the form's own
 * questions (the old app accepted arbitrary question ids - fixed).
 *
 * ANONYMITY: the stored row contains the form id, answers, and a timestamp
 * rounded DOWN to the hour. Nothing else. No IP, no user agent, no session.
 */
export async function submitResponse(
  slug: string,
  answers: AnswerInput[]
): Promise<SubmitResult> {
  const form = await prisma.form.findUnique({
    where: { slug },
    include: {
      questions: true,
      _count: { select: { responses: true } },
    },
  });

  if (!form) {
    return { ok: false, error: "not-found", message: "This form doesn't exist." };
  }

  if (getEffectiveStatus(form, form._count.responses) !== "open") {
    return {
      ok: false,
      error: "not-open",
      message: "This form isn't accepting responses right now.",
    };
  }

  const questionById = new Map(form.questions.map((q) => [q.id, q]));
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));

  // Reject answers pointing outside this form.
  for (const a of answers) {
    if (!questionById.has(a.questionId)) {
      return { ok: false, error: "invalid", message: "Invalid submission." };
    }
  }

  const validAnswers: AnswerInput[] = [];
  for (const question of form.questions) {
    const answer = answerByQuestion.get(question.id);
    const hasContent =
      answer &&
      (answer.textValue?.trim() ||
        (answer.optionIndexes?.length ?? 0) > 0 ||
        answer.ratingValue != null);

    if (!hasContent) {
      if (question.required) {
        return {
          ok: false,
          error: "invalid",
          message: `"${question.label}" needs an answer.`,
        };
      }
      continue; // optional + skipped
    }

    if (!validateAnswer(question.type, question.options.length, answer)) {
      return { ok: false, error: "invalid", message: "Invalid submission." };
    }
    validAnswers.push(answer);
  }

  if (validAnswers.length === 0) {
    return { ok: false, error: "invalid", message: "Answer at least one question." };
  }

  await prisma.response.create({
    data: {
      formId: form.id,
      submittedAt: floorToHour(new Date()),
      answers: {
        create: validAnswers.map((a) => {
          const question = questionById.get(a.questionId)!;
          return {
            questionId: a.questionId,
            textValue: question.type === "TEXT" ? a.textValue?.trim() : null,
            optionIndexes:
              question.type === "MCQ" ||
              question.type === "MULTI" ||
              question.type === "YES_NO"
                ? (a.optionIndexes ?? [])
                : [],
            ratingValue: question.type === "RATING" ? a.ratingValue : null,
          };
        }),
      },
    },
  });

  return { ok: true };
}
