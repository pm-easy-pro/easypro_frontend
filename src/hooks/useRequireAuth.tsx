"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Spin } from "antd";

import { getProfileSetupPath } from "@/lib/auth-routes";
import { useAuth } from "@/providers/AuthProvider";

export function useRequireAuth(fallback = "/login") {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = searchParams.get("next") || pathname || "/dashboard";
      router.replace(`${fallback}?next=${encodeURIComponent(next)}`);
      return;
    }
    if (user.profile_completed === false && !pathname.startsWith("/profile")) {
      const invite = searchParams.get("invite");
      router.replace(getProfileSetupPath(invite));
    }
  }, [user, loading, router, fallback, searchParams, pathname]);

  return { user, loading };
}

export function AuthLoadingScreen() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spin size="large" />
    </div>
  );
}
