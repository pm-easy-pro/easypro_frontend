export interface LocationAlias {
  id: number;
  name: string;
}

export interface Location {
  id: number;
  district: string;
  district_display: string;
  official_address: string;
  description?: string;
  latitude?: string;
  longitude?: string;
  aliases: LocationAlias[];
}

export type ListingOwnerType = "owner" | "agent" | "company";

export interface OrganizationBrief {
  id: number;
  company_name: string;
  display_label: string;
  phone?: string;
  email?: string;
  address?: string;
  bio?: string;
  slug?: string;
  is_verified?: boolean;
  avatar_url?: string | null;
}

export interface CompanyAdmin {
  id: number;
  username: string;
  email: string;
  phone: string;
}

export interface Agent {
  id: number;
  agent_type: "individual" | "organization";
  display_name: string;
  company_name: string;
  title?: string;
  display_label: string;
  organization_name?: string | null;
  organization_detail?: OrganizationBrief | null;
  phone: string;
  email: string;
  address?: string;
  slug: string;
  is_verified: boolean;
  is_active?: boolean;
  membership_status?: "pending" | "approved" | "denied";
  membership_status_display?: string;
  bio?: string;
  avatar_url?: string | null;
  member_agents?: Agent[];
  member_count?: number;
  property_count?: number;
  admin?: CompanyAdmin | null;
  invite_code?: string | null;
  username?: string | null;
  reviewed_at?: string | null;
  reviewed_by_username?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AgentCompanyPayload {
  company_name: string;
  slug?: string;
  phone?: string;
  email?: string;
  address?: string;
  bio?: string;
  is_verified?: boolean;
  is_active?: boolean;
  clear_avatar?: boolean;
  admin_username?: string;
  admin_password?: string;
  admin_email?: string;
  admin_phone?: string;
}

export interface InviteCode {
  id: number;
  organization: number;
  organization_name: string;
  code: string;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  note: string;
  is_active: boolean;
  is_redeemable: boolean;
  created_by?: number | null;
  created_by_username?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface InvitePreview {
  code: string;
  organization_id: number | null;
  organization_name: string | null;
  is_valid: boolean;
  message: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  display_name?: string;
  avatar_url?: string | null;
  is_staff?: boolean;
  is_company_admin?: boolean;
  profile_completed?: boolean;
  agent_profile?: Agent | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Property {
  id: number;
  title: string;
  description?: string;
  listing_owner_type?: ListingOwnerType;
  listing_owner_display?: string;
  agent?: number | null;
  agent_detail?: Agent | null;
  posted_by?: number | null;
  posted_by_detail?: User | null;
  related_properties?: Property[];
  listing_type: string;
  listing_type_display: string;
  property_type: string;
  property_type_display: string;
  condition: string;
  condition_display: string;
  district: string;
  official_address: string;
  unofficial_addresses: string[];
  location: number | null;
  location_detail?: Location;
  price: string;
  area_m2: string;
  room_count: number;
  floor?: number | null;
  total_floor?: number | null;
  has_elevator: boolean;
  window_count?: number | null;
  bathroom_count?: number | null;
  view_directions?: string[];
  view_directions_display?: string;
  garage: boolean;
  balcony: boolean;
  furnished: boolean;
  payment_terms?: string[];
  year_built?: number | null;
  latitude?: string;
  longitude?: string;
  is_verified: boolean;
  is_vip: boolean;
  views_count: number;
  status: string;
  status_display?: string;
  is_active?: boolean;
  thumbnail_url?: string | null;
  images: string[];
  building_type?: string;
  parcel_number?: string;
  land_right_type?: string;
  land_right_type_display?: string;
  land_contract_start?: string | null;
  land_contract_end?: string | null;
  land_use_type?: string;
  land_use_type_display?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterOptions {
  listing_types: FilterOption[];
  listing_owner_types?: FilterOption[];
  property_types: FilterOption[];
  real_estate_types?: FilterOption[];
  land_types?: FilterOption[];
  conditions: FilterOption[];
  view_directions?: FilterOption[];
  districts: FilterOption[];
  district_choices: FilterOption[];
  payment_terms: FilterOption[];
  ordering: FilterOption[];
  locations: Location[];
}

export interface PropertyFilters {
  search?: string;
  listing_type?: string;
  district?: string;
  payment_terms?: string;
  locations?: string;
  property_type?: string;
  condition?: string;
  room_count?: string;
  price_min?: string;
  price_max?: string;
  area_min?: string;
  area_max?: string;
  ordering?: string;
  page?: number;
  agent?: string;
  posted_by?: string;
  mine?: boolean;
  exclude_property_type?: string;
}

export interface SubscriptionPackage {
  id: number;
  name: string;
  slug: string;
  description: string;
  target_type: "individual" | "organization";
  target_type_display: string;
  price: string;
  billing_period: "monthly" | "yearly";
  billing_period_display: string;
  max_listings: number;
  max_vip_listings: number;
  features: string[];
  is_popular: boolean;
  sort_order: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  id: number;
  package: SubscriptionPackage;
  status: "active" | "cancelled" | "expired" | "trial";
  status_display: string;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  cancelled_at: string | null;
  days_remaining: number;
}

export interface SubscriptionUsage {
  listings_count: number;
  vip_listings_count: number;
  max_listings: number;
  max_vip_listings: number;
  listings_remaining: number;
  vip_listings_remaining: number;
}

export interface SubscriptionPackagePayload {
  name: string;
  slug?: string;
  description?: string;
  target_type: "individual" | "organization";
  price: number;
  billing_period: "monthly" | "yearly";
  max_listings: number;
  max_vip_listings: number;
  features: string[];
  is_popular?: boolean;
  sort_order?: number;
  is_active?: boolean;
}

export interface DashboardStats {
  has_agent_profile: boolean;
  agent_type: "individual" | "organization" | null;
  subscription: Subscription | null;
  usage: SubscriptionUsage;
  packages_target: "individual" | "organization" | null;
  stats: {
    total_listings: number;
    total_views: number;
    vip_listings: number;
    active_subscription: boolean;
  };
}
