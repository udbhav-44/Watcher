import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Navbar } from "@/components/layout/navbar";
import { PageTransition } from "@/components/layout/page-transition";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CampusStream",
  description: "Watch, search, and save titles."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <html lang="en">
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-black focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </body>
    </html>
  );
}
