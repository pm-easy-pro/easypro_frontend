"use client";

import { usePathname } from "next/navigation";

import { SiteHeader } from "@/components/layout/SiteHeader";

const SHELL_EXCLUDED_PREFIXES = [
  "/login",
  "/register",
  "/dashboard",
  "/agent",
  "/profile/setup",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExcludedPage = SHELL_EXCLUDED_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isExcludedPage) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </>
  );
}
