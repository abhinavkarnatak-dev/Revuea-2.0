import "server-only";
import { prisma } from "@/lib/prisma";
import type { QuestionType } from "@prisma/client";

export interface ChoiceBreakdown {
  option: string;
  count: number;
  share: number; // 0..1
}

export interface QuestionAnalytics {
  questionId: string;
  label: string;
  type: QuestionType;
  answered: number;
  /** TEXT */
  texts: string[];
  /** MCQ / MULTI / YES_NO */
  choices: ChoiceBreakdown[];
  /** RATING */
  average: number | null;
  distribution: number[]; // index 0 → rating 1
}

export interface FormAnalytics {
  responseCount: number;
  completionByQuestion: QuestionAnalytics[];
  /** Responses grouped by hour bucket (already coarsened at write time). */
  timeline: { bucket: Date; count: number }[];
}

/**
 * One pass over the form's answers, aggregated in memory. Fine well past
 * thousands of responses since we only pull the columns we need.
 */
export async function getFormAnalytics(formId: string): Promise<FormAnalytics> {
  const [questions, answers, responseCount, timelineRaw] = await Promise.all([
    prisma.question.findMany({
      where: { formId },
      orderBy: { order: "asc" },
    }),
    prisma.answer.findMany({
      where: { response: { formId } },
      select: {
        questionId: true,
        textValue: true,
        optionIndexes: true,
        ratingValue: true,
      },
    }),
    prisma.response.count({ where: { formId } }),
    prisma.response.groupBy({
      by: ["submittedAt"],
      where: { formId },
      _count: true,
      orderBy: { submittedAt: "asc" },
    }),
  ]);

  const byQuestion = new Map<string, typeof answers>();
  for (const answer of answers) {
    const list = byQuestion.get(answer.questionId) ?? [];
    list.push(answer);
    byQuestion.set(answer.questionId, list);
  }

  const completionByQuestion: QuestionAnalytics[] = questions.map((q) => {
    const qAnswers = byQuestion.get(q.id) ?? [];
    const base: QuestionAnalytics = {
      questionId: q.id,
      label: q.label,
      type: q.type,
      answered: qAnswers.length,
      texts: [],
      choices: [],
      average: null,
      distribution: [],
    };

    switch (q.type) {
      case "TEXT": {
        base.texts = qAnswers
          .map((a) => a.textValue)
          .filter((t): t is string => Boolean(t));
        break;
      }
      case "MCQ":
      case "MULTI":
      case "YES_NO": {
        const optionLabels = q.type === "YES_NO" ? ["Yes", "No"] : q.options;
        const counts = new Array<number>(optionLabels.length).fill(0);
        for (const a of qAnswers) {
          for (const idx of a.optionIndexes) {
            if (idx >= 0 && idx < counts.length) counts[idx]++;
          }
        }
        const total = qAnswers.length || 1;
        base.choices = optionLabels.map((option, i) => ({
          option,
          count: counts[i],
          share: counts[i] / total,
        }));
        break;
      }
      case "RATING": {
        const dist = new Array<number>(5).fill(0);
        let sum = 0;
        let n = 0;
        for (const a of qAnswers) {
          if (a.ratingValue != null && a.ratingValue >= 1 && a.ratingValue <= 5) {
            dist[a.ratingValue - 1]++;
            sum += a.ratingValue;
            n++;
          }
        }
        base.distribution = dist;
        base.average = n > 0 ? sum / n : null;
        break;
      }
    }
    return base;
  });

  return {
    responseCount,
    completionByQuestion,
    timeline: timelineRaw.map((t) => ({
      bucket: t.submittedAt,
      count: t._count,
    })),
  };
}
