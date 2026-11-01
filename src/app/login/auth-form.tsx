"use client";

import { useActionState, useRef, useState, type KeyboardEvent } from "react";
import { signIn, signUp, type AuthState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const signInTabRef = useRef<HTMLButtonElement>(null);
  const signUpTabRef = useRef<HTMLButtonElement>(null);
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const nextMode =
      event.key === "Home"
        ? "signin"
        : event.key === "End"
          ? "signup"
          : mode === "signin"
            ? "signup"
            : "signin";
    setMode(nextMode);
    (nextMode === "signin" ? signInTabRef : signUpTabRef).current?.focus();
  }

  return (
    <div className="flex flex-col gap-7">
      <div
        role="tablist"
        aria-label="Authentication mode"
        className="bg-paper-deep border-border grid grid-cols-2 gap-1 rounded-xl border p-1"
      >
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            ref={m === "signin" ? signInTabRef : signUpTabRef}
            type="button"
            role="tab"
            aria-selected={mode === m}
            aria-controls="authentication-panel"
            tabIndex={mode === m ? 0 : -1}
            onClick={() => setMode(m)}
            onKeyDown={handleTabKeyDown}
            className={cn(
              "focus-visible:ring-ring focus-visible:ring-offset-paper-deep h-9 min-h-11 rounded-lg px-3 text-[0.8125rem] font-semibold transition-[color,background-color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              mode === m
                ? "bg-card text-foreground shadow-[0_1px_0_var(--field-shadow),0_3px_10px_var(--field-shadow)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "signin" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      <form
        id="authentication-panel"
        role="tabpanel"
        aria-label={mode === "signin" ? "Sign in" : "Sign up"}
        action={formAction}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            placeholder="••••••••"
            required
          />
        </div>

        {state?.error ? (
          <p
            role="alert"
            className="border-negative/20 bg-negative/6 text-negative rounded-lg border px-3.5 py-3 text-sm"
          >
            {state.error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="mt-1 w-full"
        >
          {pending
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>
    </div>
  );
}
