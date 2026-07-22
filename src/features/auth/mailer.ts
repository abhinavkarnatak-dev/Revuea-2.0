import "server-only";
import nodemailer from "nodemailer";
import { env } from "@/lib/env";

/**
 * OTP email delivery. Falls back to console logging in development when
 * SMTP is not configured; refuses to silently swallow codes in production.
 */
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  if (!env.smtp.configured) {
    if (env.isProduction) {
      throw new Error("SMTP is not configured - cannot deliver OTP emails.");
    }
    console.log(`\n  ── Revuea dev OTP ──────────────`);
    console.log(`  To:   ${email}`);
    console.log(`  Code: ${code}`);
    console.log(`  ────────────────────────────────\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to: email,
    subject: `${code} is your Revuea sign-in code`,
    text: `Your Revuea sign-in code is ${code}. It expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 24px;">
        <p style="font-size: 15px; color: #16150f; margin: 0 0 8px;">Your Revuea sign-in code</p>
        <p style="font-size: 36px; font-weight: 600; letter-spacing: 8px; color: #16150f; margin: 0 0 16px;">${code}</p>
        <p style="font-size: 13px; color: #6e6a61; margin: 0;">This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p>
      </div>
    `,
  });
}
