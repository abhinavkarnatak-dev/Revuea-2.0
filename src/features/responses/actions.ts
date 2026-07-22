"use server";

import { z } from "zod";
import { rateLimit, hashIdentifier } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { submitResponse, type SubmitResult } from "./service";

const answerSchema = z.object({
  questionId: z.string().min(1),
  textValue: z.string().max(5000).optional(),
  optionIndexes: z.array(z.number().int().min(0).max(50)).max(10).optional(),
  ratingValue: z.number().int().min(1).max(5).optional(),
});

const submitSchema = z.object({
  slug: z.string().min(1).max(64),
  answers: z.array(answerSchema).min(1).max(30),
});

/**
 * Public, unauthenticated endpoint - the one place strangers can write to
 * the database, so it's rate limited per-IP and per-form.
 */
export async function submitResponseAction(
  input: unknown
): Promise<SubmitResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid", message: "Invalid submission." };
  }
  const { slug, answers } = parsed.data;

  const ip = await getClientIp();
  // Per IP across all forms: stops spray abuse.
  const ipLimit = rateLimit(hashIdentifier(ip, "submit-ip"), {
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  // Per IP per form: stops ballot-stuffing a single form.
  const formLimit = rateLimit(hashIdentifier(`${ip}:${slug}`, "submit-form"), {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.allowed || !formLimit.allowed) {
    return {
      ok: false,
      error: "invalid",
      message: "Too many submissions - please try again later.",
    };
  }

  try {
    return await submitResponse(slug, answers);
  } catch (err) {
    console.error("submitResponse failed:", err);
    return {
      ok: false,
      error: "invalid",
      message: "Something went wrong. Please try again.",
    };
  }
}
