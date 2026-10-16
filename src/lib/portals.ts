export type PortalHost = "main" | "agent" | "company" | "dashboard";

const DEFAULTS = {
  main: process.env.NEXT_PUBLIC_MAIN_ORIGIN || "https://easypro.mn",
  agent: process.env.NEXT_PUBLIC_AGENT_ORIGIN || "https://agent.easypro.mn",
  company: process.env.NEXT_PUBLIC_COMPANY_ORIGIN || "https://company.easypro.mn",
  dashboard: process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN || "https://dashboard.easypro.mn",
};

export function getPortalOrigin(portal: PortalHost): string {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const { protocol, hostname, port } = window.location;
    const p = port ? `:${port}` : "";
    // Local: use path prefixes instead of real subdomains
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      if (portal === "main") return `${protocol}//${hostname}${p}`;
      if (portal === "agent") return `${protocol}//${hostname}${p}/portal/agent`;
      if (portal === "company") return `${protocol}//${hostname}${p}/agent`;
      if (portal === "dashboard") return `${protocol}//${hostname}${p}/dashboard`;
    }
  }
  return DEFAULTS[portal];
}

export function getPortalFromHost(host: string): PortalHost {
  const h = host.split(":")[0].toLowerCase();
  if (h.startsWith("agent.")) return "agent";
  if (h.startsWith("company.")) return "company";
  if (h.startsWith("dashboard.")) return "dashboard";
  return "main";
}
