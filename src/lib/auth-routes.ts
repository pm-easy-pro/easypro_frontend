import type { User } from "@/types";

import {
  getAgentPortalUrl,
  getMainSiteUrl,
  getPortalOrigin,
} from "@/lib/portals";

/** OTP / профайл дууссаны дараа хэрэглэгчийг зөв хуудас руу илгээнэ */
export function getPostAuthPath(
  user: User,
  options?: { invite?: string | null },
): string {
  if (user.profile_completed === false) {
    const q = options?.invite ? `?invite=${encodeURIComponent(options.invite)}` : "";
    return `/profile/setup${q}`;
  }

  // Absolute origins for production subdomains; path prefixes in local getPortalOrigin
  if (user.is_staff) {
    return getPortalOrigin("dashboard");
  }
  if (user.is_company_admin) {
    return getPortalOrigin("company");
  }

  if (user.agent_profile?.agent_type === "individual") {
    return getPortalOrigin("agent");
  }

  return "/";
}

/** Main-site header profile link */
export function getHeaderProfileHref(user: User): string {
  if (user.agent_profile?.agent_type === "individual") {
    return getAgentPortalUrl("/profile");
  }
  if (user.is_company_admin || user.agent_profile?.agent_type === "organization") {
    return getPortalOrigin("company");
  }
  if (user.is_staff) {
    return getPortalOrigin("dashboard");
  }
  return "/profile";
}

/** Post listing chooser on main site (үл хөдлөх / газар) */
export function getPostPropertyHref() {
  return getMainSiteUrl("/post");
}

export function getLoginPathWithInvite(invite?: string | null) {
  if (!invite) return "/login";
  return `/login?invite=${encodeURIComponent(invite)}`;
}

export function getProfileSetupPath(invite?: string | null) {
  if (!invite) return "/profile/setup";
  return `/profile/setup?invite=${encodeURIComponent(invite)}`;
}
