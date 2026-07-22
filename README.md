# Revuea 2.0

Anonymous team feedback, rebuilt. A creator builds a form, shares one
unguessable link, and the team answers **fully anonymously** — then the
creator gets live analytics and an AI-digested summary.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **Motion** (Framer Motion)
- **Postgres** via **Prisma**
- **Passwordless auth**: email OTP + optional Google OAuth (signed httpOnly
  session cookies, `jose`)
- **Gemini** (flash-lite) for feedback summaries, cached in the DB

## Getting started

```bash
npm install
cp .env.example .env        # then fill in values
npm run db:migrate          # creates tables (needs DATABASE_URL)
npm run dev
```

Without SMTP configured, OTP codes are printed to the dev server console.
Without `GOOGLE_CLIENT_ID`/`SECRET`, the Google button hides itself.
Google OAuth redirect URI: `<NEXT_PUBLIC_APP_URL>/api/auth/google/callback`.

## Architecture

```
src/
  app/                  # routes only — thin, no business logic
    (marketing)/        # landing page
    login/              # OTP + Google sign-in
    dashboard/          # creator area (auth-gated via middleware)
    f/[slug]/           # public anonymous form fill
    api/                # OAuth callback + authenticated CSV export
  features/             # domain logic, one folder per feature
    auth/               # session (jose), OTP service, mailer, actions
    forms/              # schema (zod), service, actions, builder UI
    responses/          # anonymous submission + validation
    analytics/          # aggregation queries
    summary/            # Gemini summarization w/ caching
    users/              # profile
  components/           # design system (ui/, motion/, icons)
  lib/                  # prisma, env, rate-limit, utils
```

Server actions validate with zod, delegate to `features/*/service.ts`, and
enforce ownership at the service layer. The public submission path is rate
limited per-IP and per-form (in-memory sliding window — swap for Upstash
Redis if deploying multi-instance).

## Anonymity guarantees (by architecture)

- `Response` rows have **no relation to any user/session/account**
- **No IP, user agent, or fingerprint** is ever persisted (rate-limit keys
  are hashed and live only in process memory)
- Submission timestamps are **rounded down to the hour** before insert
- Share slugs are random 12-char strings — **not enumerable** (v1 used
  sequential integer IDs)
- CSV export and analytics are **owner-only** (v1's export endpoint was
  fully public)
- Draft forms 404 on the public route — indistinguishable from nonexistent

## Fixes over v1 (flagged during the rebuild)

| v1 issue | 2.0 fix |
| --- | --- |
| Public, unauthenticated CSV export of all responses | Auth + ownership required |
| Analytics/summary endpoints not ownership-checked | Ownership enforced in service layer |
| Exact response timestamps stored | Rounded to the hour |
| Sequential integer form IDs in share links | Random 12-char slugs |
| Submitted answers not validated against the form | Full per-question validation |
| No submit-window check server-side | Effective status enforced on submit |
| No rate limiting anywhere | OTP + submission rate limits |
| OTPs never expired, unlimited attempts | 10-min expiry, 5 attempts, hashed at rest |
