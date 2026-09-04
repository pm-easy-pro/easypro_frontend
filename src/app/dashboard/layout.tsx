"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AuthLoadingScreen } from "@/hooks/useRequireAuth";
import { PortalProvider, STAFF_PORTAL } from "@/providers/PortalProvider";
import { useAuth } from "@/providers/AuthProvider";

function DashboardStaffGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = pathname && pathname !== "/dashboard/login" ? pathname : "/dashboard";
      router.replace(`/dashboard/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (!user.is_staff) {
      logout();
      router.replace("/dashboard/login");
    }
  }, [user, loading, router, pathname, logout]);

  if (loading || !user?.is_staff) {
    return <AuthLoadingScreen />;
  }

  return (
    <PortalProvider value={STAFF_PORTAL}>
      <DashboardLayout>{children}</DashboardLayout>
    </PortalProvider>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/dashboard/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<AuthLoadingScreen />}>
      <DashboardStaffGuard>{children}</DashboardStaffGuard>
    </Suspense>
  );
}
