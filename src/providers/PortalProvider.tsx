"use client";

import { createContext, useContext, useMemo } from "react";

export type PortalMode = "staff" | "company" | "agent";

export interface PortalConfig {
  mode: PortalMode;
  basePath: string;
  loginPath: string;
  homeLabel: string;
}

export const STAFF_PORTAL: PortalConfig = {
  mode: "staff",
  basePath: "/dashboard",
  loginPath: "/dashboard/login",
  homeLabel: "Dashboard",
};

export const COMPANY_PORTAL: PortalConfig = {
  mode: "company",
  basePath: "/agent",
  loginPath: "/agent/login",
  homeLabel: "Компани",
};

export const AGENT_PORTAL: PortalConfig = {
  mode: "agent",
  basePath: "/portal/agent",
  loginPath: "/portal/agent/login",
  homeLabel: "Агент",
};

const PortalContext = createContext<PortalConfig>(STAFF_PORTAL);

export function PortalProvider({
  value,
  children,
}: {
  value: PortalConfig;
  children: React.ReactNode;
}) {
  const memo = useMemo(() => value, [value]);
  return <PortalContext.Provider value={memo}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  return useContext(PortalContext);
}

export function portalPath(basePath: string, segment?: string) {
  if (!segment) return basePath;
  return `${basePath}/${segment}`.replace(/\/+/g, "/");
}
