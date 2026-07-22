import "server-only";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendOtpEmail } from "./mailer";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function hashCode(email: string, code: string): string {
  // Keyed hash - a leaked DB row alone can't be brute-forced offline
  // without also knowing the server secret.
  return createHash("sha256")
    .update(`${env.authSecret}:${email.toLowerCase()}:${code}`)
    .digest("hex");
}

export async function issueOtp(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  const code = randomInt(100000, 1000000).toString();

  // One active code per email; also prunes any expired leftovers.
  await prisma.otpCode.deleteMany({ where: { email: normalized } });
  await prisma.otpCode.create({
    data: {
      email: normalized,
      codeHash: hashCode(normalized, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  await sendOtpEmail(normalized, code);
}

export type OtpVerification =
  | { ok: true; userId: string; isNewUser: boolean }
  | { ok: false; error: string };

export async function verifyOtp(
  email: string,
  code: string,
  name?: string
): Promise<OtpVerification> {
  const normalized = email.toLowerCase().trim();

  const record = await prisma.otpCode.findFirst({
    where: { email: normalized },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date()) {
    return { ok: false, error: "Code expired - request a new one." };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.otpCode.delete({ where: { id: record.id } });
    return { ok: false, error: "Too many attempts - request a new code." };
  }

  const expected = Buffer.from(record.codeHash, "hex");
  const actual = Buffer.from(hashCode(normalized, code), "hex");
  const matches =
    expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!matches) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "That code isn't right - try again." };
  }

  // Success: burn the code, then find-or-create the account.
  await prisma.otpCode.deleteMany({ where: { email: normalized } });

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existing) return { ok: true, userId: existing.id, isNewUser: false };

  const user = await prisma.user.create({
    data: { email: normalized, name: name?.trim() || null },
  });
  return { ok: true, userId: user.id, isNewUser: true };
}
