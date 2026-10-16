import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getPortalFromHost } from "@/lib/portals";

const MAIN_ORIGIN = process.env.NEXT_PUBLIC_MAIN_ORIGIN || "https://easypro.mn";
const AGENT_ORIGIN = process.env.NEXT_PUBLIC_AGENT_ORIGIN || "https://agent.easypro.mn";
const COMPANY_ORIGIN = process.env.NEXT_PUBLIC_COMPANY_ORIGIN || "https://company.easypro.mn";
const DASHBOARD_ORIGIN =
  process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN || "https://dashboard.easypro.mn";

function isLocalHost(host: string) {
  const h = host.split(":")[0];
  return h === "localhost" || h === "127.0.0.1";
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname, search } = request.nextUrl;
  const portal = getPortalFromHost(host);
  const local = isLocalHost(host);

  // Production main site: redirect legacy portal paths to subdomains
  if (!local && portal === "main") {
    if (pathname === "/agent" || pathname.startsWith("/agent/")) {
      const dest = new URL(`${pathname}${search}`, COMPANY_ORIGIN);
      return NextResponse.redirect(dest);
    }
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
      const dest = new URL(`${pathname}${search}`, DASHBOARD_ORIGIN);
      return NextResponse.redirect(dest);
    }
    if (pathname === "/portal/agent" || pathname.startsWith("/portal/agent/")) {
      const stripped = pathname.replace(/^\/portal\/agent/, "") || "/";
      const dest = new URL(`${stripped}${search}`, AGENT_ORIGIN);
      return NextResponse.redirect(dest);
    }
  }

  // company.easypro.mn → serve /agent/*
  if (portal === "company") {
    if (pathname.startsWith("/portal/agent") || pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/", COMPANY_ORIGIN));
    }
    const url = request.nextUrl.clone();
    if (!pathname.startsWith("/agent")) {
      url.pathname = pathname === "/" ? "/agent" : `/agent${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // dashboard.easypro.mn → serve /dashboard/*
  if (portal === "dashboard") {
    if (pathname.startsWith("/agent") || pathname.startsWith("/portal/agent")) {
      return NextResponse.redirect(new URL("/", DASHBOARD_ORIGIN));
    }
    const url = request.nextUrl.clone();
    if (!pathname.startsWith("/dashboard")) {
      url.pathname = pathname === "/" ? "/dashboard" : `/dashboard${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // agent.easypro.mn → serve /portal/agent/*
  if (portal === "agent") {
    if (pathname.startsWith("/agent") || pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/", AGENT_ORIGIN));
    }
    const url = request.nextUrl.clone();
    if (!pathname.startsWith("/portal/agent")) {
      url.pathname =
        pathname === "/" ? "/portal/agent" : `/portal/agent${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Local: allow path-based portals without rewrite
  void MAIN_ORIGIN;
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
