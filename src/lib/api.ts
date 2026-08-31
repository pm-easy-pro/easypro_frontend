import axios from "axios";

import { clearTokens, getAccessToken } from "@/lib/auth";
import type {
  Agent,
  AgentCompanyPayload,
  AuthTokens,
  DashboardStats,
  FilterOptions,
  InviteCode,
  InvitePreview,
  PaginatedResponse,
  Property,
  PropertyFilters,
  Subscription,
  SubscriptionPackage,
  SubscriptionPackagePayload,
  SubscriptionUsage,
  User,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    // Let the browser set multipart boundary
    if (typeof config.headers.set === "function") {
      config.headers.set("Content-Type", false as unknown as string);
    } else {
      delete (config.headers as Record<string, unknown>)["Content-Type"];
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearTokens();
    }
    return Promise.reject(error);
  },
);

export async function fetchProperties(params?: PropertyFilters) {
  const { data } = await api.get<PaginatedResponse<Property>>("/properties/", { params });
  return data;
}

export async function fetchProperty(id: string | number) {
  const { data } = await api.get<Property>(`/properties/${id}/`);
  return data;
}

export async function fetchFilterOptions() {
  const { data } = await api.get<FilterOptions>("/filter-options/");
  return data;
}

export async function fetchAgents(params?: {
  agent_type?: string;
  search?: string;
  page?: number;
  organization?: number;
}) {
  const { data } = await api.get<PaginatedResponse<Agent>>("/agents/", { params });
  return data;
}

export async function fetchManageAgents(params?: {
  search?: string;
  membership_status?: "pending" | "approved" | "denied";
}) {
  const { data } = await api.get<Agent[]>("/agents/manage/", { params });
  return data;
}

export async function fetchAgent(id: string | number) {
  const { data } = await api.get<Agent>(`/agents/${id}/`);
  return data;
}

export async function fetchManageCompanies(params?: {
  search?: string;
  status?: "active" | "inactive";
  is_verified?: boolean;
}) {
  const { data } = await api.get<Agent[]>("/agents/companies/manage/", {
    params: {
      search: params?.search || undefined,
      status: params?.status,
      is_verified:
        params?.is_verified === undefined ? undefined : params.is_verified ? "true" : "false",
    },
  });
  return data;
}

function companyFormData(payload: AgentCompanyPayload, logo?: File | null) {
  const formData = new FormData();
  formData.append("company_name", payload.company_name);
  if (payload.slug !== undefined) formData.append("slug", payload.slug || "");
  if (payload.phone !== undefined) formData.append("phone", payload.phone || "");
  if (payload.email !== undefined) formData.append("email", payload.email || "");
  if (payload.address !== undefined) formData.append("address", payload.address || "");
  if (payload.bio !== undefined) formData.append("bio", payload.bio || "");
  if (payload.is_verified !== undefined) {
    formData.append("is_verified", payload.is_verified ? "true" : "false");
  }
  if (payload.is_active !== undefined) {
    formData.append("is_active", payload.is_active ? "true" : "false");
  }
  if (payload.clear_avatar) {
    formData.append("clear_avatar", "true");
  }
  if (payload.admin_username !== undefined) {
    formData.append("admin_username", payload.admin_username || "");
  }
  if (payload.admin_password !== undefined) {
    formData.append("admin_password", payload.admin_password || "");
  }
  if (payload.admin_email !== undefined) {
    formData.append("admin_email", payload.admin_email || "");
  }
  if (payload.admin_phone !== undefined) {
    formData.append("admin_phone", payload.admin_phone || "");
  }
  if (logo) {
    formData.append("avatar", logo);
  }
  return formData;
}

export async function createManageCompany(payload: AgentCompanyPayload, logo?: File | null) {
  const { data } = await api.post<Agent>(
    "/agents/companies/manage/",
    companyFormData(payload, logo),
  );
  return data;
}

export async function updateManageCompany(
  id: number,
  payload: AgentCompanyPayload,
  logo?: File | null,
) {
  const { data } = await api.patch<Agent>(
    `/agents/companies/manage/${id}/`,
    companyFormData(payload, logo),
  );
  return data;
}

export async function deleteManageCompany(id: number) {
  await api.delete(`/agents/companies/manage/${id}/`);
}

export async function fetchInviteCodes(organization?: number) {
  const { data } = await api.get<InviteCode[]>("/agents/invites/", {
    params: organization ? { organization } : undefined,
  });
  return data;
}

export async function createInviteCode(payload: {
  max_uses?: number | null;
  expires_at?: string | null;
  note?: string;
  organization?: number;
}) {
  const { data } = await api.post<InviteCode>("/agents/invites/", payload);
  return data;
}

export async function updateInviteCode(
  id: number,
  payload: Partial<Pick<InviteCode, "is_active" | "note" | "max_uses" | "expires_at">>,
) {
  const { data } = await api.patch<InviteCode>(`/agents/invites/${id}/`, payload);
  return data;
}

export async function deactivateInviteCode(id: number) {
  await api.delete(`/agents/invites/${id}/`);
}

export async function previewInviteCode(code: string) {
  const { data } = await api.get<InvitePreview>("/agents/invites/preview/", {
    params: { code },
  });
  return data;
}

export async function fetchMembershipRequests(status: "pending" | "approved" | "denied" | "all" = "pending") {
  const { data } = await api.get<Agent[]>("/agents/memberships/", {
    params: { status },
  });
  return data;
}

export async function acceptMembership(id: number) {
  const { data } = await api.post<{ message: string; agent: Agent }>(
    `/agents/memberships/${id}/accept/`,
  );
  return data;
}

export async function denyMembership(id: number) {
  const { data } = await api.post<{ message: string; agent: Agent }>(
    `/agents/memberships/${id}/deny/`,
  );
  return data;
}

export async function login(username: string, password: string) {
  const { data } = await api.post<AuthTokens>("/auth/login/", { username, password });
  return data;
}

export async function sendOtp(phone: string) {
  const { data } = await api.post<{
    message: string;
    phone: string;
    expires_in: number;
    sms_sent: boolean;
    debug_code?: string;
    sms_error?: string;
    retry_after?: number;
  }>("/auth/otp/send/", { phone });
  return data;
}

export interface OtpVerifyResponse extends AuthTokens {
  is_new: boolean;
  profile_completed: boolean;
  user: User;
}

export async function verifyOtp(phone: string, code: string) {
  const { data } = await api.post<OtpVerifyResponse>("/auth/otp/verify/", { phone, code });
  return data;
}

export interface ProfileUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_type?: "owner" | "agent";
  display_name?: string;
  title?: string;
  invite_code?: string;
}

export async function updateMe(payload: ProfileUpdatePayload) {
  const { data } = await api.patch<User>("/auth/me/", payload);
  return data;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  agent_type?: "individual" | "organization";
  display_name?: string;
  company_name?: string;
  title?: string;
  invite_code?: string;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post("/auth/register/", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<User>("/auth/me/");
  return data;
}

export async function createProperty(payload: Record<string, unknown>) {
  const { data } = await api.post<Property>("/properties/", payload);
  return data;
}

export async function uploadPropertyImages(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const { data } = await api.post<{ urls: string[] }>(
    "/properties/upload-images/",
    formData,
  );
  return data.urls;
}

export async function fetchManageProperties(params?: {
  search?: string;
  listing_type?: string;
  property_type?: string;
  status?: string;
  page?: number;
}) {
  const { data } = await api.get<PaginatedResponse<Property>>("/properties/manage/", { params });
  return data;
}

export async function createManageProperty(payload: Record<string, unknown>) {
  const { data } = await api.post<Property>("/properties/manage/", payload);
  return data;
}

export async function updateManageProperty(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch<Property>(`/properties/manage/${id}/`, payload);
  return data;
}

export async function deleteManageProperty(id: number) {
  await api.delete(`/properties/manage/${id}/`);
}

export async function fetchMyProperties(params?: Omit<PropertyFilters, "mine">) {
  const { data } = await api.get<PaginatedResponse<Property>>("/properties/", {
    params: { ...params, mine: true },
  });
  return data;
}

export async function fetchDashboardStats() {
  const { data } = await api.get<DashboardStats>("/subscriptions/dashboard/");
  return data;
}

export async function fetchSubscriptionPackages(targetType?: string) {
  const { data } = await api.get<SubscriptionPackage[]>("/subscriptions/packages/", {
    params: targetType ? { target_type: targetType } : undefined,
  });
  return data;
}

export async function fetchMySubscription() {
  const { data } = await api.get<{
    subscription: Subscription | null;
    usage: SubscriptionUsage;
    agent_type: string;
  }>("/subscriptions/me/");
  return data;
}

export async function subscribeToPackage(packageId: number) {
  const { data } = await api.post<{ message: string; subscription: Subscription }>(
    "/subscriptions/subscribe/",
    { package_id: packageId },
  );
  return data;
}

export async function cancelSubscription() {
  const { data } = await api.post<{ message: string }>("/subscriptions/cancel/");
  return data;
}

export async function fetchSubscriptionHistory(page = 1) {
  const { data } = await api.get<PaginatedResponse<Subscription>>("/subscriptions/history/", {
    params: { page },
  });
  return data;
}

export async function fetchManagePackages() {
  const { data } = await api.get<SubscriptionPackage[]>("/subscriptions/packages/manage/");
  return data;
}

export async function createPackage(payload: SubscriptionPackagePayload) {
  const { data } = await api.post<SubscriptionPackage>("/subscriptions/packages/manage/", payload);
  return data;
}

export async function updatePackage(id: number, payload: Partial<SubscriptionPackagePayload>) {
  const { data } = await api.patch<SubscriptionPackage>(
    `/subscriptions/packages/manage/${id}/`,
    payload,
  );
  return data;
}

export async function deletePackage(id: number) {
  await api.delete(`/subscriptions/packages/manage/${id}/`);
}
