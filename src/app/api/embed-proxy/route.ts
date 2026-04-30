import { NextResponse } from "next/server";

import { isAllowedProviderHost, providerHostAllowlist } from "@/lib/streaming/providerHosts";

const injectHardening = (html: string): string => {
  const script = `
<script>
try { sessionStorage.setItem("adsEnabled", "false"); } catch {}
(() => {
  const allowedRoots = ${JSON.stringify(providerHostAllowlist)};
  try { window.open = () => null; } catch {}
  const isAllowed = (url) => {
    try {
      const host = new URL(url, location.href).hostname.toLowerCase();
      return allowedRoots.some((root) => host === root || host.endsWith("." + root));
    } catch {
      return false;
    }
  };
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("a") : null;
    if (!target) return;
    const href = target.getAttribute("href");
    if (!href) return;
    if (!isAllowed(href)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
})();
</script>`;

  if (html.includes("</head>")) {
    return html.replace("</head>", `${script}</head>`);
  }
  return `${script}${html}`;
};

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target");
  if (!target) {
    return NextResponse.json({ error: "Missing target URL" }, { status: 400 });
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid target URL" }, { status: 400 });
  }

  if (!isAllowedProviderHost(parsedTarget.hostname)) {
    return NextResponse.json({ error: "Target host not allowed" }, { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(parsedTarget.toString(), {
      method: "GET",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      redirect: "follow"
    });
  } catch {
    return NextResponse.json({ error: "Provider temporarily unreachable" }, { status: 502 });
  }

  const finalHost = new URL(upstream.url).hostname.toLowerCase();
  if (!isAllowedProviderHost(finalHost)) {
    return NextResponse.json(
      { error: "Blocked redirect to non-allowlisted domain", blockedHost: finalHost },
      { status: 403 }
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "text/html; charset=utf-8";
  const isHtml = contentType.includes("text/html");

  if (isHtml) {
    const body = await upstream.text();
    const withBase = body.includes("<base ")
      ? body
      : body.replace("<head>", `<head><base href="https://${finalHost}/">`);
    const hardenedHtml = injectHardening(withBase);
    return new Response(hardenedHtml, {
      status: upstream.status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }

  const binary = await upstream.arrayBuffer();
  return new Response(binary, {
    status: upstream.status,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store"
    }
  });
}
