/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV !== "production";
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
  "https:"
].join(" ");
const connectSrc = [
  "'self'",
  "https://api.themoviedb.org",
  "https://anikotoapi.site",
  "https://*.sentry.io",
  "https:",
  ...(isDevelopment ? ["ws://localhost:*", "http://localhost:*"] : [])
].join(" ");
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  // Embeddable provider iframes. `https:` already permits all of these, but the
  // named hosts document exactly which aggregators we surface as servers:
  // Vidking (movie/TV/anime) plus the direct-iframe family VidFast / VidLink /
  // Vidsrc.cc (see providerHosts.ts). MegaPlay/SupaPlay were removed (dead).
  "frame-src 'self' https://www.vidking.net https://vidfast.pro https://vidlink.pro https://vidsrc.cc https:",
  "img-src 'self' data: https://image.tmdb.org https://m.media-amazon.com https://cdn.anipixcdn.co https://*.anipixcdn.co",
  `connect-src ${connectSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join("; ");

const nextConfig = {
  output: "standalone",
  experimental: {
    typedRoutes: true,
    instrumentationHook: true
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups"
          },
          { key: "Content-Security-Policy", value: contentSecurityPolicy }
        ]
      }
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "cdn.anipixcdn.co" }
    ]
  }
};

export default nextConfig;
