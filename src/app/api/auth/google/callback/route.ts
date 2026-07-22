import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { createSession } from "@/features/auth/session";

interface GoogleTokenResponse {
  access_token?: string;
}

interface GoogleUserInfo {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/login?error=google", env.appUrl);
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("google_oauth_state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.googleClientId,
        client_secret: env.googleClientSecret,
        redirect_uri: `${env.appUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokens = (await tokenRes.json()) as GoogleTokenResponse;
    if (!tokens.access_token) return NextResponse.redirect(loginUrl);

    const userRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const profile = (await userRes.json()) as GoogleUserInfo;
    if (!profile.email || profile.email_verified === false) {
      return NextResponse.redirect(loginUrl);
    }

    const email = profile.email.toLowerCase();
    const user = await prisma.user.upsert({
      where: { email },
      // Don't clobber a custom name the user set in Revuea.
      update: { image: profile.picture ?? undefined },
      create: { email, name: profile.name, image: profile.picture },
    });

    await createSession(user.id);

    const response = NextResponse.redirect(new URL("/dashboard", env.appUrl));
    response.cookies.delete("google_oauth_state");
    return response;
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    return NextResponse.redirect(loginUrl);
  }
}
