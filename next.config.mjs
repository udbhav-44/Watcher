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
  "https://api.jikan.moe",
  "https://anikotoapi.site",
  "https://*.sentry.io",
  "https:",
  ...(isDevelopment ? ["ws://localhost:*", "http://localhost:*"] : [])
].join(" ");
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  // Embeddable provider iframes (live-tested aggregators only).
  "frame-src 'self' https://www.vidking.net https://vidfast.pro https://vidrock.net https://vidcore.org https://vidsrc.cc https:",
  "img-src 'self' data: https://image.tmdb.org https://m.media-amazon.com https://cdn.anipixcdn.co https://*.anipixcdn.co https://cdn.myanimelist.net https://*.myanimelist.net",
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
    remotePatterns: [
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "cdn.anipixcdn.co" },
      { protocol: "https", hostname: "cdn.myanimelist.net" }
    ]
  }
};

export default nextConfig;
