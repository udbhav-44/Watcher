import { NextResponse } from "next/server";

import { isAllowedProviderHost } from "@/lib/streaming/providerHosts";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target");
  if (!target)
    return NextResponse.json(
      { ok: false, reason: "Missing target" },
      { status: 400 }
    );

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return NextResponse.json(
      { ok: false, reason: "Invalid URL" },
      { status: 400 }
    );
  }

  if (!isAllowedProviderHost(url.hostname)) {
    return NextResponse.json(
      { ok: false, reason: "Host not allowed" },
      { status: 403 }
    );
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      cache: "no-store"
    });
    const finalHost = new URL(response.url).hostname.toLowerCase();

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      finalHost
    });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "Provider unreachable" },
      { status: 502 }
    );
  }
}
