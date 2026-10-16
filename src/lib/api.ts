import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setTokens,
} from "@/lib/auth";
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

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const { data } = await axios.post<{ access: string; refresh?: string }>(
      `${API_URL}/auth/refresh/`,
      { refresh },
      { headers: { "Content-Type": "application/json" } },
    );
    if (data.refresh) {
      setTokens(data.access, data.refresh);
    } else {
      setAccessToken(data.access);
    }
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
}

function queueRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (
      error.response?.status !== 401 ||
      typeof window === "undefined" ||
      !original ||
      original._retry
    ) {
      return Promise.reject(error);
    }

    const url = original.url || "";
    if (url.includes("/auth/refresh/") || url.includes("/auth/login/") || url.includes("/auth/otp/")) {
      clearTokens();
      return Promise.reject(error);
    }

    original._retry = true;
    const access = await queueRefresh();
    if (!access) {
      return Promise.reject(error);
    }
    original.headers.Authorization = `Bearer ${access}`;
    return api(original);
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

export interface AgentPinStatus {
  phone: string;
  is_agent: boolean;
  has_pin: boolean;
  needs_setup: boolean;
  display_name?: string;
}

export interface AgentPinAuthResponse extends AuthTokens {
  user: User;
}

export async function agentPinStatus(phone: string) {
  const { data } = await api.post<AgentPinStatus>("/auth/agent/pin/status/", { phone });
  return data;
}

export async function agentPinSetupSendOtp(phone: string) {
  const { data } = await api.post<{
    message: string;
    phone: string;
    expires_in: number;
    sms_sent: boolean;
    debug_code?: string;
  }>("/auth/agent/pin/setup/send-otp/", { phone });
  return data;
}

export async function agentPinSetupVerify(payload: {
  phone: string;
  code: string;
  pin: string;
  pin_confirm: string;
}) {
  const { data } = await api.post<AgentPinAuthResponse>(
    "/auth/agent/pin/setup/verify/",
    payload,
  );
  return data;
}

export async function agentPinLogin(phone: string, pin: string) {
  const { data } = await api.post<AgentPinAuthResponse>("/auth/agent/pin/login/", {
    phone,
    pin,
  });
  return data;
}

export async function agentPinResetSendOtp(phone: string) {
  const { data } = await api.post<{
    message: string;
    phone: string;
    expires_in: number;
    sms_sent: boolean;
    debug_code?: string;
  }>("/auth/agent/pin/reset/send-otp/", { phone });
  return data;
}

export async function agentPinResetVerify(payload: {
  phone: string;
  code: string;
  pin: string;
  pin_confirm: string;
}) {
  const { data } = await api.post<AgentPinAuthResponse>(
    "/auth/agent/pin/reset/verify/",
    payload,
  );
  return data;
}

export async function staffSetAgentPin(
  agentId: number,
  payload: { pin: string; pin_confirm: string },
) {
  const { data } = await api.post<{
    detail: string;
    agent_id: number;
    has_pin: boolean;
    pin_set_at: string | null;
  }>(`/agents/manage/${agentId}/pin/`, payload);
  return data;
}

export interface ProfileUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_type?: "owner" | "agent";
  display_name?: string;
  title?: string;
  bio?: string;
  invite_code?: string;
  avatar?: File | null;
  clear_avatar?: boolean;
}

export async function updateMe(payload: ProfileUpdatePayload) {
  const needsMultipart =
    payload.avatar instanceof File || Boolean(payload.clear_avatar);

  if (needsMultipart) {
    const formData = new FormData();
    if (payload.first_name !== undefined) formData.append("first_name", payload.first_name);
    if (payload.last_name !== undefined) formData.append("last_name", payload.last_name);
    if (payload.email !== undefined) formData.append("email", payload.email);
    if (payload.profile_type !== undefined) formData.append("profile_type", payload.profile_type);
    if (payload.display_name !== undefined) formData.append("display_name", payload.display_name);
    if (payload.title !== undefined) formData.append("title", payload.title);
    if (payload.bio !== undefined) formData.append("bio", payload.bio);
    if (payload.invite_code !== undefined) formData.append("invite_code", payload.invite_code);
    if (payload.clear_avatar) formData.append("clear_avatar", "true");
    if (payload.avatar instanceof File) formData.append("avatar", payload.avatar);
    const { data } = await api.patch<User>("/auth/me/", formData);
    return data;
  }

  const { avatar: _a, clear_avatar: _c, ...json } = payload;
  const { data } = await api.patch<User>("/auth/me/", json);
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

export async function fetchManageProperty(id: number | string) {
  const { data } = await api.get<Property>(`/properties/manage/${id}/`);
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
