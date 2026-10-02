"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Plus, Trees, User } from "lucide-react";

import { EasyProLogoMark } from "@/components/layout/EasyProLogoMark";
import { useAuth } from "@/providers/AuthProvider";

const nav = [
  { href: "/", label: "Нүүр" },
  { href: "/properties", label: "Үл хөдлөх" },
  { href: "/land", label: "Газар" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-[#183E95]/10 bg-[#183E95] text-white shadow-md">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 md:h-16 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <EasyProLogoMark />
            <span className="text-lg font-bold tracking-tight md:text-xl">EasyPro</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-white/15 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden rounded-xl p-2 text-white/90 transition hover:bg-white/10 sm:inline-flex"
            aria-label="Мэдэгдэл"
          >
            <Bell className="h-5 w-5" />
          </button>
          <Link
            href="/post-property"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-amber-950 shadow transition hover:bg-amber-300 sm:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Үл хөдлөх</span>
          </Link>
          <Link
            href="/post-land"
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 sm:px-4"
          >
            <Trees className="h-4 w-4" />
            <span className="hidden sm:inline">Газар</span>
          </Link>
          {!loading && user ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (user.is_staff) {
                    router.push("/dashboard");
                  } else if (user.is_company_admin) {
                    router.push("/agent");
                  } else if (user.agent_profile?.agent_type === "individual" && user.agent_profile.id) {
                    router.push(`/agents/${user.agent_profile.id}`);
                  }
                }}
                className={`inline-flex max-w-[140px] items-center gap-2 truncate rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium backdrop-blur ${
                  user.is_staff ||
                  user.is_company_admin ||
                  user.agent_profile?.agent_type === "individual"
                    ? "cursor-pointer hover:bg-white/15"
                    : ""
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {user.display_name || user.first_name || user.username}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="rounded-xl p-2 text-white/90 hover:bg-white/10"
                aria-label="Гарах"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium backdrop-blur"
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Нэвтрэх</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
