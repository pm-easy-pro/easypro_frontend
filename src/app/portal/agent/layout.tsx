"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AuthLoadingScreen } from "@/hooks/useRequireAuth";
import { AGENT_PORTAL, PortalProvider } from "@/providers/PortalProvider";
import { useAuth } from "@/providers/AuthProvider";

function isIndividualAgent(
  user: {
    is_staff?: boolean;
    is_company_admin?: boolean;
    agent_profile?: { agent_type?: string; membership_status?: string } | null;
  } | null,
) {
  return Boolean(
    user?.agent_profile?.agent_type === "individual" &&
      user.agent_profile.membership_status !== "pending" &&
      user.agent_profile.membership_status !== "denied",
  );
}

function AgentPortalGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next =
        pathname && pathname !== "/portal/agent/login" ? pathname : "/portal/agent";
      router.replace(`/portal/agent/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (user.is_staff) {
      router.replace("/dashboard");
      return;
    }
    if (user.is_company_admin) {
      router.replace("/agent");
      return;
    }
    if (!isIndividualAgent(user)) {
      logout();
      router.replace("/portal/agent/login");
    }
  }, [user, loading, router, pathname, logout]);

  if (loading || !isIndividualAgent(user)) {
    return <AuthLoadingScreen />;
  }

  return (
    <PortalProvider value={AGENT_PORTAL}>
      <DashboardLayout>{children}</DashboardLayout>
    </PortalProvider>
  );
}

export default function AgentPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/portal/agent/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<AuthLoadingScreen />}>
      <AgentPortalGuard>{children}</AgentPortalGuard>
    </Suspense>
  );
}
