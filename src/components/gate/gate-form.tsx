"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

const safeNextPath = (raw: string | null): Route => {
  if (!raw) return "/" as Route;
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/" as Route;
  return raw as Route;
};

export const GateForm = (): JSX.Element => {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (response.ok) {
        router.push(next);
        router.refresh();
        return;
      }
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(payload?.error ?? "Incorrect password");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-sm space-y-4 text-left"
      aria-describedby={error ? "gate-error" : undefined}
    >
      <div className="space-y-2">
        <label htmlFor="gate-password" className="sr-only">
          Access password
        </label>
        <input
          id="gate-password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Access password"
          className="w-full rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm text-fg outline-none backdrop-blur transition placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        {error && (
          <p id="gate-error" className="text-center text-xs text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending || password.length === 0}
        className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-fg-on-accent transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Opening…" : "Enter"}
      </button>
    </form>
  );
};
