"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { Navbar } from "@/components/layout/navbar";
import { SearchProvider, useSearchCommand } from "@/components/search/search-provider";
import { cn } from "@/lib/utils";

const SearchCommand = dynamic(
  () =>
    import("@/components/search/search-command").then((mod) => ({
      default: mod.SearchCommand
    })),
  { ssr: false }
);

const isWatchRoute = (pathname: string): boolean =>
  /^\/watch\//.test(pathname) ||
  /^\/tv\/[^/]+\/watch/.test(pathname) ||
  /^\/anime\/[^/]+\/watch/.test(pathname);

const isGateRoute = (pathname: string): boolean => pathname === "/gate";

const isHomeRoute = (pathname: string): boolean => pathname === "/";

type ShellProps = {
  children: React.ReactNode;
};

const AppShellInner = ({ children }: ShellProps): JSX.Element => {
  const pathname = usePathname();
  const { open, openSearch } = useSearchCommand();
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
      <KeyboardShortcuts onOpenSearch={openSearch} />
      {open ? <SearchCommand /> : null}
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
        {children}
      </main>
    </>
  );
};

type Props = {
  children: React.ReactNode;
};

export const AppShell = ({ children }: Props): JSX.Element => {
  return (
    <SearchProvider>
      <AppShellInner>{children}</AppShellInner>
    </SearchProvider>
  );
};
