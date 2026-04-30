import { NextResponse } from "next/server";

import { isDbEnabled, prisma } from "@/lib/db";
import { assertAdminAccess } from "@/lib/security/adminAuth";

export async function GET(request: Request): Promise<Response> {
  if (!assertAdminAccess(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDbEnabled()) {
    return NextResponse.json({
      status: "degraded",
      db: "disabled",
      ingestQueue: "simulated",
      timestamp: new Date().toISOString()
    });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "connected",
      ingestQueue: "healthy",
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({
      status: "degraded",
      db: "disconnected",
      ingestQueue: "simulated",
      timestamp: new Date().toISOString()
    });
  }
}
