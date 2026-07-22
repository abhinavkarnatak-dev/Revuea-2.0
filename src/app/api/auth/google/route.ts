import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { env } from "@/lib/env";

/**
 * Kicks off the Google OAuth flow. The random `state` value is stored in a
 * short-lived httpOnly cookie and verified in the callback (CSRF protection).
 */
export async function GET() {
  if (!env.googleEnabled) {
    return NextResponse.redirect(new URL("/login", env.appUrl));
  }

  const state = randomBytes(24).toString("hex");
  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: `${env.appUrl}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });
  return response;
}
