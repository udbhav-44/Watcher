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
  "https://*.sentry.io",
  "https:",
  ...(isDevelopment ? ["ws://localhost:*", "http://localhost:*"] : [])
].join(" ");
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "frame-src 'self' https:",
  "img-src 'self' data: https://image.tmdb.org https://m.media-amazon.com",
  `connect-src ${connectSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join("; ");

const nextConfig = {
  experimental: {
    typedRoutes: true
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
      { protocol: "https", hostname: "image.tmdb.org" }
    ]
  }
};

export default nextConfig;
