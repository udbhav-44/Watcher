export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  if (process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.2,
      environment: process.env.NODE_ENV
    });
  }

  const shutdown = async (signal: NodeJS.Signals) => {
    console.log(`[shutdown] received ${signal}, closing DB pool`);
    try {
      const { prisma } = await import("./lib/db");
      await prisma.$disconnect();
    } catch (err) {
      console.error("[shutdown] prisma disconnect failed", err);
    }
    process.exit(0);
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
