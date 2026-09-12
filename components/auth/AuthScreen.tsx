"use client";

import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function mapAuthError(error: { message?: string; code?: string; status?: number }): string {
  const message = (error.message ?? "").toLowerCase();
  if (message.includes("invalid login")) return "Incorrect email or password.";
  if (message.includes("not confirmed") || error.code === "email_not_confirmed") {
    return "Please confirm your email address before signing in.";
  }
  if (message.includes("already registered") || message.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (message.includes("password should be")) return "Password must be at least 6 characters.";
  if (error.status === 429) return "Too many attempts. Please wait a moment and try again.";
  return error.message ?? "Something went wrong. Please try again.";
}

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [values, setValues] = useState({ email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const swapMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setFormError(null);
    setInfo(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors: typeof errors = {};
    const email = values.email.trim();
    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!values.password) {
      nextErrors.password = "Password is required.";
    } else if (values.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }
    if (mode === "signup") {
      if (!values.confirm) {
        nextErrors.confirm = "Confirm your password.";
      } else if (values.confirm !== values.password) {
        nextErrors.confirm = "Passwords do not match.";
      }
    }

    setErrors(nextErrors);
    setFormError(null);
    setInfo(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const client = getSupabase();
    const result =
      mode === "signin"
        ? await client.auth.signInWithPassword({
            email,
            password: values.password,
          })
        : await client.auth.signUp({ email, password: values.password });
    setSubmitting(false);

    if (result.error) {
      setFormError(mapAuthError(result.error));
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setInfo(
        "Account created. Check your inbox to confirm your email, then sign in.",
      );
      setMode("signin");
    }
  };

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <section className="relative hidden w-[42%] flex-col justify-between overflow-hidden border-r border-edge bg-panel p-10 lg:flex xl:w-[40%]">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
        >
          <div
            className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute right-0 bottom-0 h-72 w-72 translate-x-1/3 translate-y-1/3 rounded-full bg-accent/5 blur-3xl"
            aria-hidden
          />
        </div>

        <div className="relative flex items-center gap-3">
          <BrandMark className="h-11 w-11 rounded-xl shadow-lg shadow-black/30" />
          <div>
            <p className="text-lg leading-tight font-semibold tracking-tight text-foreground">
              Gilgamesh
            </p>
            <p className="text-[10px] tracking-[0.18em] text-faint uppercase">
              AI Workspace
            </p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <p className="flex items-center gap-1.5 text-accent">
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className="text-[10px] tracking-[0.18em] font-semibold uppercase">
              Your workspace
            </span>
          </p>
          <h2 className="mt-3 text-[26px] leading-snug font-semibold tracking-tight text-foreground">
            Ask questions, explore ideas, and work through problems.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Gilgamesh keeps your conversations organized and ready when you are.
          </p>
        </div>

        <p className="relative text-[11px] leading-5 text-faint">
          Conversations are stored locally in your browser until cloud sync is
          enabled.
        </p>
      </section>

      <section className="flex min-h-dvh flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden">
            <div className="flex items-center gap-3">
              <BrandMark className="h-10 w-10 rounded-xl" />
              <div>
                <p className="text-[15px] leading-tight font-semibold tracking-tight text-foreground">
                  Gilgamesh
                </p>
                <p className="text-[10px] tracking-[0.18em] text-faint uppercase">
                  AI Workspace
                </p>
              </div>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mt-8 grid grid-cols-2 gap-1 rounded-xl border border-edge bg-surface p-1 lg:mt-0"
          >
            {(["signin", "signup"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={mode === option}
                onClick={() => swapMode(option)}
                className={cn(
                  "rounded-lg py-2 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                  mode === option
                    ? "bg-surface-3 text-foreground"
                    : "text-faint hover:bg-surface-2 hover:text-muted",
                )}
              >
                {option === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <h1 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
            {mode === "signin"
              ? "Welcome back"
              : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "signin"
              ? "Sign in to continue to Gilgamesh."
              : "A few details to get you started."}
          </p>

          {formError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13px] leading-5 text-red-400"
            >
              {formError}
            </div>
          )}

          {info && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-2.5 text-[13px] leading-5 text-accent"
            >
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="auth-email"
                className="mb-1.5 block text-xs font-medium text-muted"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint"
                  aria-hidden
                />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(event) => {
                    setValues((prev) => ({ ...prev, email: event.target.value }));
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  className={cn(
                    "w-full rounded-xl border bg-background/60 py-2.5 pr-3 pl-10 text-sm text-foreground placeholder:text-faint transition-[border-color,background-color] duration-150 outline-none focus:ring-2",
                    errors.email
                      ? "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/10"
                      : "border-edge hover:border-edge-strong focus:border-edge-strong focus:ring-accent/15",
                  )}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="mb-1.5 block text-xs font-medium text-muted"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint"
                  aria-hidden
                />
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  value={values.password}
                  onChange={(event) => {
                    setValues((prev) => ({ ...prev, password: event.target.value }));
                    if (errors.password || errors.confirm) {
                      setErrors((prev) => ({
                        ...prev,
                        password: undefined,
                        confirm: undefined,
                      }));
                    }
                  }}
                  placeholder="At least 6 characters"
                  className={cn(
                    "w-full rounded-xl border bg-background/60 py-2.5 pr-3 pl-10 text-sm text-foreground placeholder:text-faint transition-[border-color,background-color] duration-150 outline-none focus:ring-2",
                    errors.password
                      ? "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/10"
                      : "border-edge hover:border-edge-strong focus:border-edge-strong focus:ring-accent/15",
                  )}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            {mode === "signup" && (
              <div>
                <label
                  htmlFor="auth-confirm"
                  className="mb-1.5 block text-xs font-medium text-muted"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint"
                    aria-hidden
                  />
                  <input
                    id="auth-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={values.confirm}
                    onChange={(event) => {
                      setValues((prev) => ({ ...prev, confirm: event.target.value }));
                      if (errors.confirm) {
                        setErrors((prev) => ({ ...prev, confirm: undefined }));
                      }
                    }}
                    placeholder="Re-enter your password"
                    className={cn(
                      "w-full rounded-xl border bg-background/60 py-2.5 pr-3 pl-10 text-sm text-foreground placeholder:text-faint transition-[border-color,background-color] duration-150 outline-none focus:ring-2",
                      errors.confirm
                        ? "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/10"
                        : "border-edge hover:border-edge-strong focus:border-edge-strong focus:ring-accent/15",
                    )}
                  />
                </div>
                {errors.confirm && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.confirm}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition-colors duration-150 hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {mode === "signin" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>
                  {mode === "signin" ? "Sign in" : "Create account"}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] leading-5 text-faint">
            {mode === "signin"
              ? "New to Gilgamesh? Switch to Create account above."
              : "Already have an account? Switch to Sign in above."}
          </p>
        </div>
      </section>
    </div>
  );
}