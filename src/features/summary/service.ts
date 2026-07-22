import "server-only";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export type SummaryResult =
  | { ok: true; content: string; generatedAt: Date; cached: boolean }
  | { ok: false; error: string };

const MIN_RESPONSES = 1;

/**
 * AI summary of a form's feedback, cached in the DB and regenerated only
 * when new responses have arrived since the last run - keeps Gemini costs
 * near zero and the dashboard instant on repeat views.
 */
export async function getOrGenerateSummary(
  formId: string,
  { force = false }: { force?: boolean } = {}
): Promise<SummaryResult> {
  if (!env.gemini.configured) {
    return {
      ok: false,
      error: "AI summaries aren't configured. Add GEMINI_API_KEY to enable them.",
    };
  }

  const responseCount = await prisma.response.count({ where: { formId } });
  if (responseCount < MIN_RESPONSES) {
    return { ok: false, error: "No responses to summarize yet." };
  }

  const cached = await prisma.summary.findUnique({ where: { formId } });
  if (cached && cached.responseCount === responseCount && !force) {
    return {
      ok: true,
      content: cached.content,
      generatedAt: cached.generatedAt,
      cached: true,
    };
  }

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          answers: {
            select: { textValue: true, optionIndexes: true, ratingValue: true },
          },
        },
      },
    },
  });
  if (!form) return { ok: false, error: "Form not found." };

  const sections = form.questions
    .map((q) => {
      if (q.type === "TEXT") {
        const texts = q.answers
          .map((a) => a.textValue?.trim())
          .filter(Boolean)
          .map((t) => `- ${t}`);
        if (texts.length === 0) return null;
        return `Question (open text): ${q.label}\n${texts.join("\n")}`;
      }
      if (q.type === "RATING") {
        const ratings = q.answers
          .map((a) => a.ratingValue)
          .filter((r): r is number => r != null);
        if (ratings.length === 0) return null;
        const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
        return `Question (rating 1-5): ${q.label}\nAverage: ${avg.toFixed(1)} across ${ratings.length} ratings`;
      }
      const labels = q.type === "YES_NO" ? ["Yes", "No"] : q.options;
      const counts = new Array<number>(labels.length).fill(0);
      for (const a of q.answers) {
        for (const idx of a.optionIndexes) {
          if (idx >= 0 && idx < counts.length) counts[idx]++;
        }
      }
      const breakdown = labels
        .map((label, i) => `${label}: ${counts[i]}`)
        .join(", ");
      return `Question (choice): ${q.label}\nResults - ${breakdown}`;
    })
    .filter(Boolean)
    .join("\n\n");

  if (!sections) return { ok: false, error: "No responses to summarize yet." };

  const prompt = `You are analyzing anonymous team feedback collected through a feedback form titled "${form.title}".

Here is the collected feedback (${responseCount} anonymous responses):

${sections}

Write a concise, decision-ready summary for the person who collected this feedback:
1. Start with a 1-2 sentence overall read of the sentiment.
2. Then "**What's working**" - recurring positives, as short bullets.
3. Then "**What needs attention**" - recurring concerns or criticism, as short bullets. Be honest, not diplomatic.
4. End with "**Suggested next steps**" - 2-3 concrete actions grounded in the feedback.

Rules: only use what's in the responses - never invent themes. If responses are sparse or low-signal, say so plainly. Never speculate about who might have written a response. Use markdown. Use plain hyphens (-) for punctuation, never em dashes or en dashes. Keep the whole summary under 300 words.`;

  try {
    const ai = new GoogleGenAI({ apiKey: env.gemini.apiKey });
    const result = await ai.models.generateContent({
      model: env.gemini.model,
      contents: prompt,
    });
    const content = result.text?.trim();
    if (!content) return { ok: false, error: "The AI returned an empty summary." };

    const saved = await prisma.summary.upsert({
      where: { formId },
      update: { content, responseCount, generatedAt: new Date() },
      create: { formId, content, responseCount },
    });

    return {
      ok: true,
      content: saved.content,
      generatedAt: saved.generatedAt,
      cached: false,
    };
  } catch (err) {
    console.error("Gemini summary failed:", err);
    return {
      ok: false,
      error: "Couldn't generate the summary right now. Try again shortly.",
    };
  }
}
