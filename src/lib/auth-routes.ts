import type { User } from "@/types";

/** OTP / профайл дууссаны дараа хэрэглэгчийг зөв хуудас руу илгээнэ */
export function getPostAuthPath(
  user: User,
  options?: { invite?: string | null },
): string {
  if (user.profile_completed === false) {
    const q = options?.invite ? `?invite=${encodeURIComponent(options.invite)}` : "";
    return `/profile/setup${q}`;
  }

  if (user.is_staff) return "/dashboard";
  if (user.is_company_admin) return "/agent";

  const agentId = user.agent_profile?.id;
  if (user.agent_profile?.agent_type === "individual" && agentId) {
    return `/agents/${agentId}`;
  }

  return "/post-property";
}

export function getLoginPathWithInvite(invite?: string | null) {
  if (!invite) return "/login";
  return `/login?invite=${encodeURIComponent(invite)}`;
}

export function getProfileSetupPath(invite?: string | null) {
  if (!invite) return "/profile/setup";
  return `/profile/setup?invite=${encodeURIComponent(invite)}`;
}
