"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Plus, User } from "lucide-react";

import { EasyProLogoMark } from "@/components/layout/EasyProLogoMark";
import { HeaderSearch } from "@/components/search/HeaderSearch";
import {
  getHeaderProfileHref,
  getPostPropertyHref,
} from "@/lib/auth-routes";
import { useAuth } from "@/providers/AuthProvider";

export function SiteHeader() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const profileHref = user ? getHeaderProfileHref(user) : "/profile";
  const postHref = getPostPropertyHref();
  const profileIsExternal =
    profileHref.startsWith("http://") || profileHref.startsWith("https://");
  const postIsExternal =
    postHref.startsWith("http://") || postHref.startsWith("https://");

  return (
    <header className="sticky top-0 z-50 border-b border-[#183E95]/10 bg-[#183E95] text-white shadow-md">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 md:h-16 md:gap-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <EasyProLogoMark />
          <span className="text-lg font-bold tracking-tight md:text-xl">EasyPro</span>
        </Link>

        <div className="min-w-0 flex-1 flex justify-center px-1 md:px-4">
          <HeaderSearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="hidden rounded-xl p-2 text-white/90 transition hover:bg-white/10 sm:inline-flex"
            aria-label="Мэдэгдэл"
          >
            <Bell className="h-5 w-5" />
          </button>
          {postIsExternal ? (
            <a
              href={postHref}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-amber-950 shadow transition hover:bg-amber-300 sm:px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Зар нэмэх</span>
            </a>
          ) : (
            <Link
              href={postHref}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-amber-950 shadow transition hover:bg-amber-300 sm:px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Зар нэмэх</span>
            </Link>
          )}
          {!loading && user ? (
            <div className="flex items-center gap-1">
              {profileIsExternal ? (
                <a
                  href={profileHref}
                  className="inline-flex max-w-[140px] items-center gap-2 truncate rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/15"
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {user.display_name || user.first_name || user.username}
                  </span>
                </a>
              ) : (
                <Link
                  href={profileHref}
                  className="inline-flex max-w-[140px] items-center gap-2 truncate rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/15"
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {user.display_name || user.first_name || user.username}
                  </span>
                </Link>
              )}
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
