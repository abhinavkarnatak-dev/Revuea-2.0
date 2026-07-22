/**
 * Centralized, typed access to environment variables.
 * Fails loudly at boot for required vars instead of deep inside a request.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get authSecret() {
    return required("AUTH_SECRET");
  },
  get appUrl() {
    return optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  },

  // Google OAuth - optional; the login button hides itself when unset.
  get googleClientId() {
    return optional("GOOGLE_CLIENT_ID");
  },
  get googleClientSecret() {
    return optional("GOOGLE_CLIENT_SECRET");
  },
  get googleEnabled() {
    return Boolean(this.googleClientId && this.googleClientSecret);
  },

  // SMTP - optional in dev (codes are logged), required in prod.
  smtp: {
    get host() {
      return optional("SMTP_HOST");
    },
    get port() {
      return Number(optional("SMTP_PORT", "587"));
    },
    get user() {
      return optional("SMTP_USER");
    },
    get pass() {
      return optional("SMTP_PASS");
    },
    get from() {
      return optional("SMTP_FROM", "Revuea <no-reply@revuea.app>");
    },
    get configured() {
      return Boolean(this.host && this.user && this.pass);
    },
  },

  gemini: {
    get apiKey() {
      return optional("GEMINI_API_KEY");
    },
    get model() {
      return optional("GEMINI_MODEL", "gemini-3.5-flash-lite");
    },
    get configured() {
      return Boolean(this.apiKey);
    },
  },

  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};
