import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { env } from "@/lib/config/env";

export default function AdminDashboardPage(): JSX.Element {
  if (env.NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD !== "true") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-2">
          <p className="text-sm text-white/60">Catalog ingest</p>
          <p className="text-sm text-white/80">Use the secured `POST /api/admin/ingest` route with your internal admin key.</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-white/60">Moderation</p>
          <p className="text-sm text-white/80">Use the secured `POST /api/admin/moderation` route to activate/deactivate titles.</p>
        </Card>
      </div>
    </div>
  );
}
