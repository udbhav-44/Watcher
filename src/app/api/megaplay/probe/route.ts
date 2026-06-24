import { probeMegaplayUrl } from "@/lib/streaming/megaplay";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url).searchParams.get("url");
  if (!url?.startsWith("https://megaplay.buzz/")) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const ok = await probeMegaplayUrl(url);
  return Response.json({ ok });
}
