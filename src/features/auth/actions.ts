"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rateLimit, hashIdentifier } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { issueOtp, verifyOtp } from "./otp.service";
import { createSession, destroySession } from "./session";

export type AuthActionResult = { ok: true } | { ok: false; error: string };

/** Request result carries whether this email already has an account, so the
 *  UI can ask new users for their name during sign-up. */
export type RequestOtpResult =
  | { ok: true; existingUser: boolean }
  | { ok: false; error: string };

const emailSchema = z.object({ email: z.email("Enter a valid email address") });

export async function requestOtpAction(
  input: unknown
): Promise<RequestOtpResult> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const email = parsed.data.email.toLowerCase().trim();

  // Layered limits: per-IP (burst abuse) and per-email (mail-bombing a victim).
  const ip = await getClientIp();
  const ipLimit = rateLimit(hashIdentifier(ip, "otp-ip"), {
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  const emailLimit = rateLimit(hashIdentifier(email, "otp-email"), {
    limit: 3,
    windowMs: 10 * 60 * 1000,
  });
  if (!ipLimit.allowed || !emailLimit.allowed) {
    return {
      ok: false,
      error: "Too many requests - wait a few minutes and try again.",
    };
  }

  try {
    const [, existing] = await Promise.all([
      issueOtp(email),
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
    ]);
    return { ok: true, existingUser: Boolean(existing) };
  } catch (err) {
    console.error("OTP issue failed:", err);
    return { ok: false, error: "Couldn't send the code. Try again shortly." };
  }
}

const verifySchema = z.object({
  email: z.email(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  name: z.string().trim().min(1).max(80).optional(),
});

export async function verifyOtpAction(
  input: unknown
): Promise<AuthActionResult> {
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter the 6-digit code from your email." };
  }

  const ip = await getClientIp();
  const limit = rateLimit(hashIdentifier(ip, "otp-verify"), {
    limit: 15,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return { ok: false, error: "Too many attempts - slow down." };
  }

  const result = await verifyOtp(
    parsed.data.email,
    parsed.data.code,
    parsed.data.name
  );
  if (!result.ok) return { ok: false, error: result.error };

  await createSession(result.userId);
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
