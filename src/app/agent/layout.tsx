"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AuthLoadingScreen } from "@/hooks/useRequireAuth";
import { COMPANY_PORTAL, PortalProvider } from "@/providers/PortalProvider";
import { useAuth } from "@/providers/AuthProvider";

function isCompanyAdminUser(user: { is_company_admin?: boolean; agent_profile?: { agent_type?: string } | null } | null) {
  return Boolean(
    user?.is_company_admin || user?.agent_profile?.agent_type === "organization",
  );
}

function AgentCompanyGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = pathname && pathname !== "/agent/login" ? pathname : "/agent";
      router.replace(`/agent/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (user.is_staff && !isCompanyAdminUser(user)) {
      router.replace("/dashboard");
      return;
    }
    if (!isCompanyAdminUser(user)) {
      logout();
      router.replace("/agent/login");
    }
  }, [user, loading, router, pathname, logout]);

  if (loading || !isCompanyAdminUser(user)) {
    return <AuthLoadingScreen />;
  }

  return (
    <PortalProvider value={COMPANY_PORTAL}>
      <DashboardLayout>{children}</DashboardLayout>
    </PortalProvider>
  );
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/agent/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<AuthLoadingScreen />}>
      <AgentCompanyGuard>{children}</AgentCompanyGuard>
    </Suspense>
  );
}
