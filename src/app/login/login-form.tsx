"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { requestOtpAction, verifyOtpAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { IconGoogle, IconArrowLeft } from "@/components/icons";

const EASE = [0.22, 1, 0.36, 1] as const;

export function LoginForm({
  googleEnabled,
  nextPath,
}: {
  googleEnabled: boolean;
  nextPath: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const codeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const sendCode = () => {
    setError(null);
    startTransition(async () => {
      const result = await requestOtpAction({ email });
      if (result.ok) {
        setIsNewUser(!result.existingUser);
        setStep("code");
        setCode("");
        // New accounts start at the name field; returning users at the code.
        setTimeout(() => {
          (result.existingUser ? codeInputRef : nameInputRef).current?.focus();
        }, 350);
      } else {
        setError(result.error);
      }
    });
  };

  const verify = (value: string) => {
    if (isNewUser && !name.trim()) {
      setError("Enter your name to create the account.");
      nameInputRef.current?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await verifyOtpAction({
        email,
        code: value,
        ...(isNewUser && { name: name.trim() }),
      });
      if (result.ok) {
        router.push(nextPath);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {step === "email" ? (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendCode();
              }}
              className="space-y-4 p-2"
            >
              <Field label="Email" error={error ?? undefined}>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </Field>
              <Button type="submit" className="w-full" size="lg" loading={pending}>
                Continue with email
              </Button>
            </form>

            {googleEnabled && (
              <>
                <div className="my-6 flex items-center gap-3">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-xs font-medium uppercase tracking-wider text-faint">
                    or
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                <a href="/api/auth/google" className="block">
                  <Button variant="secondary" size="lg" className="w-full" type="button">
                    <IconGoogle size={18} />
                    Continue with Google
                  </Button>
                </a>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="code"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verify(code);
              }}
              className="space-y-4 p-2"
            >
              <div>
                <p className="text-sm text-muted">
                  {isNewUser ? (
                    <>
                      Looks like you're new here - we sent a 6-digit code to{" "}
                      <span className="font-medium text-ink">{email}</span>
                    </>
                  ) : (
                    <>
                      We sent a 6-digit code to{" "}
                      <span className="font-medium text-ink">{email}</span>
                    </>
                  )}
                </p>
              </div>
              {isNewUser && (
                <Field
                  label="Your name"
                  hint="Shown to respondents on your forms"
                >
                  <Input
                    ref={nameInputRef}
                    autoComplete="name"
                    placeholder="e.g. Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    required
                  />
                </Field>
              )}
              <Field label="Verification code" error={error ?? undefined}>
                <Input
                  ref={codeInputRef}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="••••••"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setCode(digits);
                    if (digits.length === 6) verify(digits);
                  }}
                  className="text-center text-2xl tracking-[0.5em] font-medium"
                  required
                />
              </Field>
              <Button type="submit" className="w-full" size="lg" loading={pending}>
                {isNewUser ? "Create account" : "Verify & continue"}
              </Button>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
                >
                  <IconArrowLeft size={15} />
                  Change email
                </button>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={pending}
                  className="text-sm text-ever transition-colors hover:text-ever-deep disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
