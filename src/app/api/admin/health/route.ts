import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      status: "degraded",
      db: "not-configured",
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
