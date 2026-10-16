import type { Property } from "@/types";

export const LISTING_STATUS_COLOR: Record<string, string> = {
  active: "green",
  pending: "orange",
  sold: "blue",
  rented: "cyan",
  archived: "default",
};

export const LISTING_STATUS_OPTIONS = [
  { value: "active", label: "Идэвхтэй" },
  { value: "pending", label: "Хүлээгдэж буй" },
  { value: "sold", label: "Зарагдсан" },
  { value: "rented", label: "Түрээслэгдсэн" },
  { value: "archived", label: "Архив" },
];

export const BUILDING_TYPE_OPTIONS = [
  { value: "Панел", label: "Панел" },
  { value: "Тоосго", label: "Тоосго" },
  { value: "Бетон цутгамал", label: "Бетон цутгамал" },
  { value: "Модон", label: "Модон" },
  { value: "Төмөр каркас", label: "Төмөр каркас" },
  { value: "Холимог", label: "Холимог" },
  { value: "Бусад", label: "Бусад" },
];

export interface PropertyFormValues {
  title: string;
  description: string;
  listing_type: string;
  property_type: string;
  condition: string;
  district: string;
  official_address: string;
  unofficial_addresses_text?: string;
  price: number;
  area_m2: number;
  room_count: number;
  floor?: number | null;
  total_floor?: number | null;
  window_count?: number | null;
  bathroom_count?: number | null;
  view_directions?: string[];
  payment_terms?: string[];
  year_built?: number | null;
  building_type?: string;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  listing_owner_type?: string;
  is_vip: boolean;
  is_verified: boolean;
  is_active: boolean;
  garage: boolean;
  balcony: boolean;
  furnished: boolean;
  has_elevator: boolean;
  images?: string[];
}

export function toFormValues(p: Property): PropertyFormValues {
  return {
    title: p.title,
    description: p.description || "",
    listing_type: p.listing_type,
    property_type: p.property_type,
    condition: p.condition,
    district: p.district,
    official_address: p.official_address,
    unofficial_addresses_text: (p.unofficial_addresses || []).join("\n"),
    price: Number(p.price),
    area_m2: Number(p.area_m2),
    room_count: p.room_count,
    floor: p.floor,
    total_floor: p.total_floor,
    window_count: p.window_count ?? null,
    bathroom_count: p.bathroom_count ?? null,
    view_directions: p.view_directions?.length ? p.view_directions : undefined,
    payment_terms: p.payment_terms || [],
    year_built: p.year_built,
    building_type: p.building_type || undefined,
    latitude: p.latitude != null && p.latitude !== "" ? Number(p.latitude) : null,
    longitude: p.longitude != null && p.longitude !== "" ? Number(p.longitude) : null,
    status: p.status,
    listing_owner_type: p.listing_owner_type || "owner",
    is_vip: p.is_vip,
    is_verified: p.is_verified,
    is_active: p.is_active !== false,
    garage: p.garage,
    balcony: p.balcony,
    furnished: p.furnished,
    has_elevator: p.has_elevator,
    images: p.images || [],
  };
}

export function defaultCreateValues(): Partial<PropertyFormValues> {
  return {
    listing_type: "sell",
    property_type: "apartment",
    condition: "good",
    status: "active",
    listing_owner_type: "owner",
    room_count: 2,
    is_vip: false,
    is_verified: false,
    is_active: true,
    garage: false,
    balcony: false,
    furnished: false,
    has_elevator: false,
    payment_terms: [],
    images: [],
    unofficial_addresses_text: "",
    latitude: null,
    longitude: null,
  };
}

export function toPayload(values: PropertyFormValues, editing: Property | null) {
  const unofficial = (values.unofficial_addresses_text || "")
    .split("\n")
    .map((a) => a.trim())
    .filter(Boolean);

  const payload: Record<string, unknown> = {
    title: values.title,
    description: values.description,
    listing_type: values.listing_type,
    property_type: values.property_type,
    condition: values.condition,
    district: values.district,
    official_address: values.official_address,
    unofficial_addresses: unofficial,
    price: values.price,
    area_m2: values.area_m2,
    room_count: values.room_count,
    floor: values.floor ?? null,
    total_floor: values.total_floor ?? null,
    window_count: values.window_count ?? null,
    bathroom_count: values.bathroom_count ?? null,
    view_directions: values.view_directions || [],
    payment_terms: values.payment_terms || [],
    year_built: values.year_built ?? null,
    building_type: values.building_type || "",
    latitude: values.latitude ?? null,
    longitude: values.longitude ?? null,
    status: values.status,
    is_vip: values.is_vip,
    is_verified: values.is_verified,
    is_active: values.is_active,
    garage: values.garage,
    balcony: values.balcony,
    furnished: values.furnished,
    has_elevator: values.has_elevator,
    images: (values.images || []).filter(Boolean),
  };

  if (editing) {
    if (values.listing_owner_type) {
      payload.listing_owner_type = values.listing_owner_type;
    }
    if (editing.agent != null) {
      payload.agent = editing.agent;
    }
  } else {
    payload.listing_owner_type = values.listing_owner_type || "owner";
  }

  return payload;
}

export function listingCoverUrl(property: Property) {
  return property.thumbnail_url || property.images?.[0] || null;
}

export function formatListingPrice(value: string | number) {
  return `${Number(value).toLocaleString("mn-MN")}₮`;
}
