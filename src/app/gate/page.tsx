import { Suspense } from "react";

import { GateForm } from "@/components/gate/gate-form";
import { Tv } from "lucide-react";

export const dynamic = "force-dynamic";

export default function GatePage(): JSX.Element {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-base-soft via-base to-base"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgb(242 196 109 / 0.35), transparent 42%), radial-gradient(circle at 80% 70%, rgb(143 183 255 / 0.2), transparent 45%)"
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-base to-transparent"
        aria-hidden
      />

      <div className="relative w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface/80 shadow-lift backdrop-blur">
            <Tv className="h-7 w-7 text-accent" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              CampusStream
            </h1>
            <p className="text-pretty text-sm leading-6 text-fg-muted">
              Private campus cinema. Enter your access code to continue.
            </p>
          </div>
        </div>

        <Suspense fallback={null}>
          <GateForm />
        </Suspense>
      </div>
    </div>
  );
}
