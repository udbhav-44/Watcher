import { Suspense } from "react";

import { GateForm } from "@/components/gate/gate-form";

export const dynamic = "force-dynamic";

export default function GatePage(): JSX.Element {
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs tracking-[0.22em] text-accent uppercase">
            CampusStream
          </p>
          <h1 className="text-2xl font-semibold text-fg">Restricted</h1>
          <p className="text-sm text-fg-muted">
            Enter the access password to continue.
          </p>
        </div>
        <Suspense fallback={null}>
          <GateForm />
        </Suspense>
      </div>
    </main>
  );
}
