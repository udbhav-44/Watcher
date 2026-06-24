"use client";

import { usePathname } from "next/navigation";

import { Navbar } from "@/components/layout/navbar";
import { PageTransition } from "@/components/layout/page-transition";
import { cn } from "@/lib/utils";

const isWatchRoute = (pathname: string): boolean =>
  /^\/watch\//.test(pathname) ||
  /^\/tv\/[^/]+\/watch/.test(pathname) ||
  /^\/anime\/[^/]+\/watch/.test(pathname);

const isGateRoute = (pathname: string): boolean => pathname === "/gate";

const isHomeRoute = (pathname: string): boolean => pathname === "/";

type Props = {
  children: React.ReactNode;
};

export const AppShell = ({ children }: Props): JSX.Element => {
  const pathname = usePathname();
  const watch = isWatchRoute(pathname);
  const gate = isGateRoute(pathname);
  const home = isHomeRoute(pathname);

  if (gate) {
    return (
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar variant={watch ? "minimal" : "default"} />
      <main
        id="main-content"
        className={cn(
          "mx-auto w-full",
          watch && "max-w-7xl px-4 py-3",
          home && "max-w-none px-0 pb-10 pt-0",
          !watch && !home && "max-w-7xl px-4 py-6"
        )}
      >
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
};
