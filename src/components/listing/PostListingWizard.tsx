"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileBadge,
  Handshake,
  Home,
  ImageIcon,
  KeyRound,
  Landmark,
  Layers,
  MapPin,
  ScrollText,
  Sofa,
  Sparkles,
  Store,
  Trees,
  User,
  Warehouse,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  Select,
  Switch,
  message,
} from "antd";

import { PropertyImageUploader } from "@/components/property/PropertyImageUploader";
import {
  GeocodeStatusHint,
  LocationPicker,
  type GeocodeStatus,
  type LatLng,
} from "@/components/map/LocationPicker";
import { createProperty, fetchFilterOptions } from "@/lib/api";
import {
  LAND_RIGHT_OPTIONS,
  LAND_USE_OPTIONS,
  getLandRightLabel,
  getLandUseLabel,
  landRightNeedsContract,
} from "@/lib/land-options";
import {
  PROVINCES,
  UB_DISTRICTS,
  buildOfficialAddress,
  getDistrict,
  getKhorooOptions,
  getProvince,
} from "@/lib/mongolia-locations";
import { useAuth } from "@/providers/AuthProvider";
import type { FilterOptions, ListingOwnerType } from "@/types";
import axios from "axios";

function extractApiError(err: unknown): string | null {
  if (!axios.isAxiosError(err)) return null;
  const data = err.response?.data;
  if (!data) return null;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    const parts: string[] = [];
    for (const [key, value] of Object.entries(record)) {
      if (Array.isArray(value)) {
        parts.push(`${key}: ${value.map(String).join(", ")}`);
      } else if (typeof value === "string") {
        parts.push(`${key}: ${value}`);
      }
    }
    if (parts.length) return parts.join(" · ");
  }
  return null;
}

function optionalInt(value: unknown): number | null {
  if (value === "" || value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const STEPS = [
  { key: "type", title: "Төрөл", hint: "Зарна эсвэл түрээс", icon: CircleDollarSign },
  { key: "location", title: "Байршил", hint: "Хаяг, газрын зураг", icon: MapPin },
  { key: "details", title: "Дэлгэрэнгүй", hint: "Үнэ, өрөө, онцлог", icon: Layers },
  { key: "media", title: "Зураг", hint: "Нүүр, gallery", icon: ImageIcon },
  { key: "publish", title: "Нийтлэх", hint: "Шалгаад илгээх", icon: CheckCircle2 },
] as const;

const PROPERTY_ICONS: Record<string, LucideIcon> = {
  apartment: Building2,
  house: Home,
  office: Landmark,
  commercial: Store,
  land: Trees,
};

const LAND_RIGHT_ICONS: Record<string, LucideIcon> = {
  ownership: FileBadge,
  possession: Handshake,
  use: KeyRound,
};

const LAND_USE_ICONS: Record<string, LucideIcon> = {
  service_apartment: Building2,
  household: Store,
  residential_yard: Home,
  private_residence: Landmark,
  other: Layers,
};

const FALLBACK_PROPERTY_TYPES = [
  { value: "apartment", label: "Орон сууц" },
  { value: "house", label: "Амины орон сууц" },
  { value: "office", label: "Оффис" },
  { value: "commercial", label: "Үйлчилгээний талбай" },
  { value: "land", label: "Газар" },
];

/** Гарчиг санал: хотхон, өрөө, талбай, хаяг-аас угсарна */
function buildSuggestedTitle(parts: {
  listingType?: string;
  propertyType?: string;
  propertyTypeLabel?: string;
  addressDetail?: string;
  districtLabel?: string;
  khoroo?: string | number;
  provinceLabel?: string;
  roomCount?: number | null;
  areaM2?: number | null;
  floor?: number | null;
  yearBuilt?: number | null;
}) {
  const complex = String(parts.addressDetail || "").trim();

  const locationBits: string[] = [];
  if (parts.districtLabel) locationBits.push(parts.districtLabel);
  else if (parts.provinceLabel && parts.provinceLabel !== "Улаанбаатар") {
    locationBits.push(parts.provinceLabel);
  }
  if (parts.khoroo) locationBits.push(`${parts.khoroo}-р хороо`);

  const head =
    complex ||
    (locationBits.length ? locationBits.join(", ") : "") ||
    parts.propertyTypeLabel ||
    "Үл хөдлөх";

  const specs: string[] = [];
  if (parts.propertyType === "land") {
    if (parts.areaM2) specs.push(`${parts.areaM2} м² газар`);
  } else {
    if (parts.roomCount) {
      specs.push(
        Number(parts.roomCount) >= 8
          ? "8+ өрөө"
          : `${parts.roomCount} өрөө`,
      );
    }
    if (parts.areaM2) specs.push(`${parts.areaM2} м²`);
    if (parts.floor) specs.push(`${parts.floor}-р давхар`);
  }

  // Хотхон байвал дүүрэг/хороог нэмэлтээр
  if (complex && locationBits.length) {
    specs.push(locationBits.join(", "));
  }

  if (parts.yearBuilt) specs.push(`${parts.yearBuilt} он`);

  const listingWord =
    parts.listingType === "rent"
      ? "түрээслүүлнэ"
      : parts.listingType === "sell"
        ? "зарна"
        : "";

  let title = specs.length ? `${head} — ${specs.join(", ")}` : head;
  if (listingWord && !title.toLowerCase().includes(listingWord)) {
    title = `${title}, ${listingWord}`;
  }

  return title.replace(/\s+/g, " ").trim().slice(0, 120);
}

function formatPriceDigits(value: number | string | null | undefined) {
  if (value == null || value === "") return "";
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function parsePriceDigits(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const num = Number(digits);
  return Number.isFinite(num) ? num : null;
}

/** 450000000 → "450 сая ₮" */
function humanizePrice(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  if (value >= 1_000_000_000) {
    const b = value / 1_000_000_000;
    return `${b % 1 === 0 ? b : b.toFixed(1)} тэрбум ₮`;
  }
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)} сая ₮`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `${k % 1 === 0 ? k : k.toFixed(1)} мянга ₮`;
  }
  return `${value.toLocaleString("mn-MN")} ₮`;
}

function PriceInput({
  value,
  onChange,
  placeholder,
  suffixLabel = "/сар",
  showSuffix,
}: {
  value?: number | null;
  onChange?: (value: number | null) => void;
  placeholder?: string;
  suffixLabel?: string;
  showSuffix?: boolean;
}) {
  const display = formatPriceDigits(value);

  return (
    <div>
      <div className="flex items-stretch overflow-hidden rounded-2xl border-2 border-slate-200 bg-white transition focus-within:border-brand focus-within:shadow-[0_0_0_4px_rgba(24,62,149,0.1)]">
        <span className="flex shrink-0 items-center border-r border-slate-100 bg-slate-50 px-4 text-base font-semibold text-slate-500 sm:px-5 sm:text-lg">
          ₮
        </span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={display}
          placeholder={placeholder}
          onChange={(e) => onChange?.(parsePriceDigits(e.target.value))}
          className="min-w-0 flex-1 bg-transparent px-4 py-4 text-2xl font-bold tracking-tight text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-300 sm:px-5 sm:py-5 sm:text-3xl"
        />
        {showSuffix ? (
          <span className="flex shrink-0 items-center border-l border-slate-100 bg-slate-50 px-3 text-sm font-medium text-slate-500 sm:px-4">
            {suffixLabel}
          </span>
        ) : null}
      </div>
      {humanizePrice(value) ? (
        <p className="mt-2 text-sm font-medium text-brand">{humanizePrice(value)}</p>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Бичихэд мянгатын тусгаарлагч автоматаар орно
        </p>
      )}
    </div>
  );
}

function parseAreaInput(raw: string): number | null {
  const normalized = raw.replace(",", ".").replace(/[^\d.]/g, "");
  if (!normalized) return null;

  const parts = normalized.split(".");
  const cleaned =
    parts.length <= 1
      ? normalized
      : `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;

  if (cleaned === "." || cleaned.endsWith(".")) {
    const base = cleaned.slice(0, -1);
    if (!base) return null;
    const n = Number(base);
    return Number.isFinite(n) ? n : null;
  }

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

function AreaInput({
  value,
  onChange,
  placeholder = "65.4",
}: {
  value?: number | null;
  onChange?: (value: number | null) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft !== null ? draft : value == null ? "" : String(value);

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(24,62,149,0.08)]">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={display}
        placeholder={placeholder}
        onFocus={() => setDraft(value == null ? "" : String(value))}
        onChange={(e) => {
          const raw = e.target.value.replace(",", ".");
          if (raw !== "" && !/^\d*\.?\d{0,2}$/.test(raw)) return;
          setDraft(raw);
          if (raw === "" || raw === ".") {
            onChange?.(null);
            return;
          }
          if (raw.endsWith(".")) return;
          onChange?.(parseAreaInput(raw));
        }}
        onBlur={() => {
          const raw = draft ?? "";
          setDraft(null);
          if (raw === "" || raw === ".") {
            onChange?.(null);
            return;
          }
          onChange?.(parseAreaInput(raw));
        }}
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-300"
      />
      <span className="flex shrink-0 items-center border-l border-slate-100 bg-slate-50 px-3 text-sm font-medium text-slate-500">
        м²
      </span>
    </div>
  );
}

function DateField({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(24,62,149,0.08)]">
      <span className="flex shrink-0 items-center border-r border-slate-100 bg-slate-50 px-3 text-slate-400">
        <CalendarDays className="h-4 w-4" />
      </span>
      <input
        type="date"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
      />
    </div>
  );
}

function SelectCard({
  active,
  onClick,
  icon: Icon,
  title,
  subtitle,
  compact,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative flex h-full w-full flex-col items-start overflow-hidden rounded-2xl border text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        compact ? "min-h-24 px-3.5 py-3.5" : "min-h-28 px-4 py-4"
      } ${
        active
          ? "border-brand bg-brand/6 shadow-[0_10px_28px_rgba(24,62,149,0.1)]"
          : "border-slate-200/90 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      {active ? (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand">
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </span>
      ) : null}
      <span
        className={`mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
          active
            ? "bg-brand text-white"
            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/80"
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span
        className={`line-clamp-2 text-sm font-semibold leading-snug ${
          active ? "text-brand" : "text-slate-900"
        }`}
      >
        {title}
      </span>
      {subtitle ? (
        <span className="mt-1 line-clamp-2 text-xs leading-snug text-slate-500">
          {subtitle}
        </span>
      ) : null}
    </button>
  );
}

function SwitchOption({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-2 rounded-2xl border px-3.5 py-3 transition ${
        checked
          ? "border-brand/30 bg-brand/6"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            checked ? "bg-brand text-white" : "bg-slate-100 text-slate-400"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="truncate text-sm font-medium text-slate-700">{label}</span>
      </span>
      <Switch size="small" checked={!!checked} onChange={onChange} />
    </label>
  );
}

function OwnerOption({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        active
          ? "border-brand bg-brand/6 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          active ? "border-brand bg-brand" : "border-slate-300"
        }`}
      >
        {active ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{title}</span>
        {subtitle ? (
          <span className="mt-0.5 block text-xs text-slate-500">{subtitle}</span>
        ) : null}
      </span>
    </button>
  );
}

function StepHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function FieldSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {title}
      </p>
      {children}
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f4f6f9]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-8 h-8 w-48 animate-pulse rounded-lg bg-slate-200/80" />
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="hidden h-80 animate-pulse rounded-3xl bg-white lg:block" />
          <div className="h-105 animate-pulse rounded-3xl bg-white" />
        </div>
      </div>
    </div>
  );
}

export type ListingKind = "real_estate" | "land";

export interface PostListingWizardProps {
  listingKind: ListingKind;
}

export function PostListingWizard({ listingKind }: PostListingWizardProps) {
  const [form] = Form.useForm();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [ownerTypeOverride, setOwnerTypeOverride] = useState<ListingOwnerType | null>(null);
  const [mapPos, setMapPos] = useState<LatLng | null>(null);
  const [geocodeStatus, setGeocodeStatus] = useState<GeocodeStatus>("idle");
  const [titleManual, setTitleManual] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();
  const profile = user?.agent_profile;
  const canPostAsAgent = profile?.agent_type === "individual";
  const canPostAsCompany = profile?.agent_type === "organization";
  const isIndividual = !profile;
  const ownerType = ownerTypeOverride ?? (canPostAsCompany ? "company" : "owner");

  const listingType = Form.useWatch("listing_type", form) || "sell";
  const propertyType = Form.useWatch("property_type", form) || "apartment";
  const province = Form.useWatch("province", form) || "ulaanbaatar";
  const district = Form.useWatch("district_local", form);
  const khoroo = Form.useWatch("khoroo", form);
  const addressDetail = Form.useWatch("address_detail", form);
  const title = Form.useWatch("title", form);
  const price = Form.useWatch("price", form);
  const areaM2 = Form.useWatch("area_m2", form);
  const roomCount = Form.useWatch("room_count", form);
  const floor = Form.useWatch("floor", form);
  const totalFloor = Form.useWatch("total_floor", form);
  const yearBuilt = Form.useWatch("year_built", form);
  const listingImages = Form.useWatch("images", form) as string[] | undefined;
  const description = Form.useWatch("description", form);
  const buildingType = Form.useWatch("building_type", form);
  const condition = Form.useWatch("condition", form);
  const bathroomCount = Form.useWatch("bathroom_count", form);
  const windowCount = Form.useWatch("window_count", form);
  const viewDirection = Form.useWatch("view_direction", form);
  const paymentTerms = Form.useWatch("payment_terms", form) as string[] | undefined;
  const hasElevator = Form.useWatch("has_elevator", form);
  const hasBalcony = Form.useWatch("balcony", form);
  const hasGarage = Form.useWatch("garage", form);
  const isFurnished = Form.useWatch("furnished", form);
  const contactName = Form.useWatch("contact_name", form);
  const contactPhone = Form.useWatch("contact_phone", form);
  const contactEmail = Form.useWatch("contact_email", form);
  const unofficialAddresses = Form.useWatch("unofficial_addresses", form);
  const sumDistrict = Form.useWatch("sum_district", form);
  const bagKhoroo = Form.useWatch("bag_khoroo", form);
  const parcelNumber = Form.useWatch("parcel_number", form);
  const landRightType = Form.useWatch("land_right_type", form);
  const landUseType = Form.useWatch("land_use_type", form);
  const landContractStart = Form.useWatch("land_contract_start", form);
  const landContractEnd = Form.useWatch("land_contract_end", form);

  const isLand = listingKind === "land";
  const postPath = isLand ? "/post-land" : "/post-property";
  const isUB = province === "ulaanbaatar";
  const landNeedsContract = landRightNeedsContract(landRightType);
  const selectedDistrict = district ? getDistrict(district) : undefined;
  const mapCenter = useMemo(() => {
    if (selectedDistrict) return selectedDistrict.center;
    return getProvince(province)?.center || { lat: 47.9184, lng: 106.9177 };
  }, [province, selectedDistrict]);

  const imagePreviews = useMemo(
    () => (Array.isArray(listingImages) ? listingImages.filter(Boolean) : []),
    [listingImages],
  );

  const propertyTypeLabel = useMemo(() => {
    const fromApi = options?.property_types?.find((p) => p.value === propertyType)?.label;
    return (
      fromApi ||
      FALLBACK_PROPERTY_TYPES.find((p) => p.value === propertyType)?.label ||
      "Үл хөдлөх"
    );
  }, [options?.property_types, propertyType]);

  const suggestedTitle = useMemo(
    () =>
      buildSuggestedTitle({
        listingType,
        propertyType,
        propertyTypeLabel,
        addressDetail: addressDetail ? String(addressDetail) : undefined,
        districtLabel: selectedDistrict?.label,
        khoroo: khoroo ? String(khoroo) : undefined,
        provinceLabel: getProvince(province)?.label,
        roomCount: roomCount == null ? null : Number(roomCount),
        areaM2: areaM2 == null ? null : Number(areaM2),
        floor: floor == null ? null : Number(floor),
        yearBuilt: yearBuilt == null ? null : Number(yearBuilt),
      }),
    [
      listingType,
      propertyType,
      propertyTypeLabel,
      addressDetail,
      selectedDistrict?.label,
      khoroo,
      province,
      roomCount,
      areaM2,
      floor,
      yearBuilt,
    ],
  );

  useEffect(() => {
    if (titleManual) return;
    if (!suggestedTitle || suggestedTitle.length < 8) return;
    form.setFieldValue("title", suggestedTitle);
  }, [suggestedTitle, titleManual, form]);

  const applySuggestedTitle = () => {
    if (!suggestedTitle) return;
    setTitleManual(false);
    form.setFieldValue("title", suggestedTitle);
  };

  const mapSearchQuery = useMemo(() => {
    const detail = String(addressDetail || "").trim();
    if (detail.length < 3) return "";
    const parts = [
      detail,
      selectedDistrict?.label,
      getProvince(province)?.label,
      "Mongolia",
    ].filter(Boolean);
    return parts.join(", ");
  }, [addressDetail, selectedDistrict?.label, province]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${postPath}`);
      return;
    }
    if (user.profile_completed === false) {
      router.replace("/profile/setup");
    }
  }, [user, loading, router, postPath]);

  useEffect(() => {
    if (isLand) {
      form.setFieldValue("property_type", "land");
    } else if (propertyType === "land") {
      form.setFieldValue("property_type", "apartment");
    }
  }, [isLand, propertyType, form]);

  useEffect(() => {
    fetchFilterOptions().then(setOptions);
  }, []);

  useEffect(() => {
    const agentProfile = user?.agent_profile;
    if (user) {
      form.setFieldsValue({
        contact_name:
          [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          agentProfile?.display_label ||
          user.username,
        contact_phone: user.phone || agentProfile?.phone || "",
        contact_email: user.email || agentProfile?.email || "",
      });
    }
  }, [user, form]);

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  const stepFields: string[][] = [
    ["listing_type", "property_type"],
    isLand
      ? isUB
        ? ["province", "district_local", "khoroo"]
        : ["province", "sum_district", "bag_khoroo"]
      : isUB
        ? ["province", "district_local", "khoroo"]
        : ["province"],
    isLand
      ? [
          "price",
          "area_m2",
          "parcel_number",
          "land_right_type",
          "land_use_type",
          ...(landNeedsContract ? ["land_contract_start", "land_contract_end"] : []),
        ]
      : ["price", "area_m2", "room_count"],
    ["title", "description"],
    [],
  ];

  const goNext = async () => {
    try {
      const fields = stepFields[step];
      if (fields.length) {
        await form.validateFields(fields);
      }
      if (step === 1 && !mapPos) {
        messageApi.warning("Газрын зураг дээр байршлаа тэмдэглэнэ үү");
        return;
      }
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      messageApi.warning("Шаардлагатай талбаруудыг бөглөнө үү");
    }
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onFinish = async (rawValues?: Record<string, unknown>) => {
    if (!mapPos) {
      messageApi.warning("Газрын зураг дээр байршлаа тэмдэглэнэ үү");
      setStep(1);
      return;
    }

    const values = {
      ...(form.getFieldsValue(true) as Record<string, unknown>),
      ...(rawValues || {}),
    };

    setSubmitting(true);
    try {
      const provinceMeta = getProvince(String(values.province || "ulaanbaatar"));
      const districtMeta = values.district_local
        ? getDistrict(String(values.district_local))
        : undefined;

      const official_address = buildOfficialAddress({
        provinceLabel: provinceMeta?.label || "Улаанбаатар",
        districtLabel: isUB
          ? districtMeta?.label
          : isLand
            ? values.sum_district
              ? String(values.sum_district)
              : undefined
            : districtMeta?.label,
        khoroo: isUB
          ? values.khoroo
            ? String(values.khoroo)
            : undefined
          : isLand && values.bag_khoroo
            ? String(values.bag_khoroo)
            : undefined,
        isUB: isUB || undefined,
        detail: values.address_detail ? String(values.address_detail) : undefined,
      });

      const unofficial: string[] = [];
      if (values.address_detail) unofficial.push(String(values.address_detail).trim());
      if (values.unofficial_addresses) {
        unofficial.push(
          ...String(values.unofficial_addresses)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        );
      }

      const contactLines = [
        values.contact_name ? `Холбоо барих: ${values.contact_name}` : null,
        values.contact_phone ? `Утас: ${values.contact_phone}` : null,
        values.contact_email ? `Имэйл: ${values.contact_email}` : null,
      ].filter(Boolean);
      const description = [String(values.description || "").trim(), ...contactLines]
        .filter(Boolean)
        .join("\n\n");

      if (!values.title || !String(values.title).trim()) {
        messageApi.warning("Гарчиг оруулна уу");
        setStep(3);
        setSubmitting(false);
        return;
      }
      if (!description.trim()) {
        messageApi.warning("Тайлбар оруулна уу");
        setStep(3);
        setSubmitting(false);
        return;
      }
      if (values.price == null || values.price === "" || Number(values.price) <= 0) {
        messageApi.warning("Үнэ оруулна уу");
        setStep(2);
        setSubmitting(false);
        return;
      }
      if (values.area_m2 == null || values.area_m2 === "" || Number(values.area_m2) <= 0) {
        messageApi.warning("Талбай оруулна уу");
        setStep(2);
        setSubmitting(false);
        return;
      }

      const payload: Record<string, unknown> = {
        title: String(values.title).trim(),
        description,
        listing_type: values.listing_type,
        property_type: isLand ? "land" : values.property_type,
        condition: values.condition || "good",
        district:
          districtMeta?.apiValue ||
          (isLand && !isUB ? String(values.province) : String(values.province)),
        official_address,
        unofficial_addresses: unofficial,
        price: Number(values.price),
        area_m2: Number(values.area_m2),
        room_count: isLand ? 1 : optionalInt(values.room_count) ?? 1,
        floor: isLand ? null : optionalInt(values.floor),
        total_floor: isLand ? null : optionalInt(values.total_floor),
        bathroom_count: isLand ? null : optionalInt(values.bathroom_count),
        window_count: isLand ? null : optionalInt(values.window_count),
        view_direction: isLand ? "" : values.view_direction || "",
        building_type: isLand ? "" : values.building_type || "",
        year_built: isLand ? null : optionalInt(values.year_built),
        payment_terms: isLand ? [] : values.payment_terms || [],
        has_elevator: isLand ? false : !!values.has_elevator,
        garage: isLand ? false : !!values.garage,
        balcony: isLand ? false : !!values.balcony,
        furnished: isLand ? false : !!values.furnished,
        latitude: mapPos.lat,
        longitude: mapPos.lng,
        listing_owner_type: ownerType,
      };

      if (isLand) {
        payload.parcel_number = String(values.parcel_number || "").trim();
        payload.land_right_type = values.land_right_type;
        payload.land_use_type = values.land_use_type;
        if (landRightNeedsContract(String(values.land_right_type))) {
          payload.land_contract_start = values.land_contract_start || null;
          payload.land_contract_end = values.land_contract_end || null;
        } else {
          payload.land_contract_start = null;
          payload.land_contract_end = null;
        }
      }

      if (Array.isArray(values.images) && values.images.length) {
        payload.images = values.images.filter(Boolean);
      } else if (typeof values.images === "string" && values.images.trim()) {
        payload.images = String(values.images)
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const created = await createProperty(payload);
      messageApi.success("Зар амжилттай нэмэгдлээ");
      if (created?.id) {
        router.push(`/properties/${created.id}`);
      } else {
        router.push("/dashboard/listings");
      }
    } catch (err: unknown) {
      const detail = extractApiError(err);
      messageApi.error(detail || "Зар нэмэхэд алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return <LoadingSkeleton />;
  }

  const listingOptions = (options?.listing_types || [
    { value: "sell", label: "Зарна" },
    { value: "rent", label: "Түрээслүүлнэ" },
  ]).filter((o) => o.value === "sell" || o.value === "rent");
  const propertyOptions = (options?.property_types?.length
    ? options.property_types
    : FALLBACK_PROPERTY_TYPES
  ).filter((o) => (isLand ? o.value === "land" : o.value !== "land"));

  const addressPreview = buildOfficialAddress({
    provinceLabel: getProvince(province)?.label || "",
    districtLabel: isUB
      ? selectedDistrict?.label
      : isLand
        ? sumDistrict
          ? String(sumDistrict)
          : undefined
        : selectedDistrict?.label,
    khoroo: isUB
      ? khoroo
        ? String(khoroo)
        : undefined
      : isLand && bagKhoroo
        ? String(bagKhoroo)
        : undefined,
    isUB: isUB || undefined,
    detail: addressDetail,
  });

  const priceLabel =
    price != null && price !== "" && Number.isFinite(Number(price)) && Number(price) > 0
      ? `${Number(price).toLocaleString("mn-MN")}₮${listingType === "rent" ? "/сар" : ""}`
      : null;

  const listingTypeLabel =
    listingType === "rent" ? "Түрээслүүлнэ" : listingType === "sell" ? "Зарна" : "—";

  const conditionLabel =
    options?.conditions?.find((c) => c.value === condition)?.label ||
    (condition ? String(condition) : null);

  const viewDirectionLabel =
    options?.view_directions?.find((v) => v.value === viewDirection)?.label || null;

  const paymentTermLabels = (paymentTerms || [])
    .map((v) => options?.payment_terms?.find((p) => p.value === v)?.label || v)
    .filter(Boolean);

  const amenityLabels = [
    hasElevator ? "Лифт" : null,
    hasBalcony ? "Тагт" : null,
    hasGarage ? "Гараж" : null,
    isFurnished ? "Тавилгатай" : null,
  ].filter(Boolean) as string[];

  const ownerTypeLabel =
    ownerType === "agent"
      ? `Агент — ${profile?.display_label || ""}`
      : ownerType === "company"
        ? `Компани — ${profile?.display_label || ""}`
        : "Зарын эзэн";

  const reviewRows: { label: string; value: string }[] = [
    { label: "Зарын төрөл", value: listingTypeLabel },
    { label: isLand ? "Төрөл" : "Үл хөдлөх", value: propertyTypeLabel },
    { label: "Байршил", value: addressPreview || "—" },
  ];

  if (unofficialAddresses) {
    reviewRows.push({
      label: "Нэмэлт нэршил",
      value: String(unofficialAddresses),
    });
  }

  reviewRows.push({
    label: listingType === "rent" ? "Сарын түрээс" : "Үнэ",
    value: priceLabel || "—",
  });

  if (areaM2 != null && areaM2 !== "") {
    reviewRows.push({ label: "Талбай", value: `${areaM2} м²` });
  }

  if (isLand) {
    if (parcelNumber) {
      reviewRows.push({ label: "Нэгж талбар", value: String(parcelNumber) });
    }
    if (landRightType) {
      reviewRows.push({
        label: "Эрхийн төрөл",
        value:
          landRightType === "ownership"
            ? "Өмчлөх — хугацаагүй"
            : getLandRightLabel(String(landRightType)),
      });
    }
    if (landNeedsContract && (landContractStart || landContractEnd)) {
      reviewRows.push({
        label: "Гэрээний хугацаа",
        value: [landContractStart, landContractEnd].filter(Boolean).join(" → "),
      });
    }
    if (landUseType) {
      reviewRows.push({
        label: "Ашиглалтын төрөл",
        value: getLandUseLabel(String(landUseType)),
      });
    }
  }

  if (!isLand && roomCount != null && roomCount !== "") {
    reviewRows.push({
      label: "Өрөө",
      value: Number(roomCount) >= 8 ? "8+" : String(roomCount),
    });
  }

  if (floor != null && floor !== "") {
    reviewRows.push({
      label: "Давхар",
      value:
        totalFloor != null && totalFloor !== ""
          ? `${floor} / ${totalFloor}`
          : String(floor),
    });
  } else if (totalFloor != null && totalFloor !== "") {
    reviewRows.push({ label: "Нийт давхар", value: String(totalFloor) });
  }

  if (yearBuilt) reviewRows.push({ label: "Баригдсан он", value: String(yearBuilt) });
  if (buildingType) reviewRows.push({ label: "Барилгын хийц", value: String(buildingType) });
  if (conditionLabel) reviewRows.push({ label: "Нөхцөл", value: conditionLabel });
  if (bathroomCount != null && bathroomCount !== "") {
    reviewRows.push({ label: "Угаалгын өрөө", value: String(bathroomCount) });
  }
  if (windowCount != null && windowCount !== "") {
    reviewRows.push({ label: "Цонхны тоо", value: String(windowCount) });
  }
  if (viewDirectionLabel) {
    reviewRows.push({ label: "Цонхны харагдац", value: viewDirectionLabel });
  }
  if (amenityLabels.length) {
    reviewRows.push({ label: "Онцлог", value: amenityLabels.join(" · ") });
  }
  if (paymentTermLabels.length) {
    reviewRows.push({ label: "Төлбөр", value: paymentTermLabels.join(" · ") });
  }

  reviewRows.push({
    label: "Зураг",
    value: imagePreviews.length
      ? `${imagePreviews.length} ширхэг${imagePreviews[0] ? " (нүүр зурагтай)" : ""}`
      : "Оруулаагүй",
  });

  reviewRows.push({
    label: "Газрын зураг",
    value: mapPos
      ? `${mapPos.lat.toFixed(5)}, ${mapPos.lng.toFixed(5)}`
      : "Тэмдэглээгүй",
  });

  const contactBits = [contactName, contactPhone, contactEmail].filter(Boolean);
  if (contactBits.length) {
    reviewRows.push({ label: "Холбоо барих", value: contactBits.map(String).join(" · ") });
  }

  reviewRows.push({ label: "Нийтлэх", value: ownerTypeLabel });

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#f4f6f9]">
      {messageContextHolder}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-105 bg-[radial-gradient(ellipse_at_top,rgba(24,62,149,0.12),transparent_60%),linear-gradient(180deg,#eef2f8_0%,#f4f6f9_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-40 h-56 w-56 rounded-full bg-brand/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
        <header className="mb-7 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            EasyPro · {isLand ? "Шинэ газар" : "Шинэ зар"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {isLand ? "Газар зар оруулах" : "Үл хөдлөх зар оруулах"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-[15px]">
            {isLand
              ? "Газрын мэдээллээ алхам алхмаар оруулна уу. Талбай, эрхийн төрөл, ашиглалтын зориулалт заавал бөглөнө."
              : isIndividual
                ? "5 алхмаар бөглөөд зараа нийтлээрэй. Хадгалсан мэдээлэл шалгагдсаны дараа харагдана."
                : "Мэдээллээ алхам алхмаар оруулна уу. Бүрэн бөглөх тусам илүү хурдан нийтлэгдэнэ."}
          </p>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Desktop stepper */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Явц</p>
                  <p className="mt-0.5 text-2xl font-bold text-slate-900">{progress}%</p>
                </div>
                <p className="text-xs text-slate-400">
                  {step + 1}/{STEPS.length}
                </p>
              </div>
              <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full bg-brand"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
              <nav className="space-y-1" aria-label="Алхмууд">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const done = i < step;
                  const current = i === step;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      disabled={i > step}
                      onClick={() => i < step && setStep(i)}
                      aria-current={current ? "step" : undefined}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                        current
                          ? "bg-brand text-white shadow-md shadow-brand/20"
                          : done
                            ? "text-brand hover:bg-brand/5"
                            : "cursor-default text-slate-400"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                          current
                            ? "bg-white/20"
                            : done
                              ? "bg-brand/10"
                              : "bg-slate-100"
                        }`}
                      >
                        {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Icon className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-tight">{s.title}</span>
                        <span
                          className={`mt-0.5 block text-[11px] leading-tight ${
                            current ? "text-white/70" : "text-slate-400"
                          }`}
                        >
                          {s.hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main column */}
          <div className="min-w-0">
            {/* Mobile progress */}
            <div className="mb-4 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur lg:hidden">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{STEPS[step].title}</p>
                  <p className="text-xs text-slate-500">{STEPS[step].hint}</p>
                </div>
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                  {step + 1}/{STEPS.length}
                </span>
              </div>
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    disabled={i > step}
                    onClick={() => i < step && setStep(i)}
                    className={`h-1.5 flex-1 rounded-full transition ${
                      i <= step ? "bg-brand" : "bg-slate-200"
                    }`}
                    aria-label={s.title}
                  />
                ))}
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              preserve
              initialValues={{
                listing_type: "sell",
                property_type: isLand ? "land" : "apartment",
                province: "ulaanbaatar",
                condition: "good",
                room_count: 2,
                listing_owner_type: "owner",
                has_elevator: false,
                garage: false,
                balcony: false,
                furnished: false,
                images: [],
                land_right_type: isLand ? "ownership" : undefined,
              }}
              className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur [&_.ant-form-item]:mb-4 [&_.ant-form-item-label]:pb-1.5 [&_.ant-form-item-label_label]:font-medium [&_.ant-form-item-extra]:mt-1 [&_.ant-form-item-explain]:mt-1"
            >
              <Form.Item name="listing_type" hidden rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="property_type" hidden rules={[{ required: true }]}>
                <Input />
              </Form.Item>

              <div className="p-5 sm:p-7 lg:p-8">
                    <div className={step === 0 ? "block" : "hidden"}>
                      <div className="space-y-7">
                        <StepHeader
                          icon={CircleDollarSign}
                          title={isLand ? "Зарын төрөл" : "Юу зарлах вэ?"}
                          description={
                            isLand
                              ? "Газраа зарна эсвэл түрээслүүлнэ гэж сонгоно уу"
                              : "Зарын төрөл болон үл хөдлөхийн төрлийг сонгоно уу"
                          }
                        />

                        <div>
                          <p className="mb-3 text-sm font-semibold text-slate-800">Зарын төрөл</p>
                          <div className="grid grid-cols-2 gap-3">
                            {listingOptions.map((opt) => (
                              <SelectCard
                                key={opt.value}
                                active={listingType === opt.value}
                                onClick={() => form.setFieldValue("listing_type", opt.value)}
                                icon={opt.value === "sell" ? CircleDollarSign : KeyRound}
                                title={opt.label}
                                subtitle={
                                  opt.value === "sell"
                                    ? "Үл хөдлөхөө зарж байна"
                                    : "Түрээслүүлэх байр"
                                }
                              />
                            ))}
                          </div>
                        </div>

                        {!isLand ? (
                        <div>
                          <p className="mb-3 text-sm font-semibold text-slate-800">
                            Үл хөдлөхийн төрөл
                          </p>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {propertyOptions.map((opt) => {
                              const Icon = PROPERTY_ICONS[opt.value] || Home;
                              return (
                                <SelectCard
                                  key={opt.value}
                                  compact
                                  active={propertyType === opt.value}
                                  onClick={() => form.setFieldValue("property_type", opt.value)}
                                  icon={Icon}
                                  title={opt.label}
                                />
                              );
                            })}
                          </div>
                        </div>
                        ) : null}
                      </div>
                    </div>

                    <div className={step === 1 ? "block" : "hidden"}>
                      <div>
                        <StepHeader
                          icon={MapPin}
                          title="Байршил"
                          description={
                            isLand
                              ? "Аймаг/хот, сум/дүүрэг, баг/хороо сонгоод газрын зураг дээр тэмдэглэнэ үү"
                              : "Аймаг/хот, дүүрэг, хороо сонгоод газрын зураг дээр тэмдэглэнэ үү"
                          }
                        />

                        <div className="space-y-1">
                          <Form.Item
                            name="province"
                            label="Аймаг / хот"
                            rules={[{ required: true, message: "Аймаг/хот сонгоно уу" }]}
                          >
                            <Select
                              size="large"
                              showSearch
                              optionFilterProp="label"
                              options={PROVINCES.map((p) => ({
                                value: p.value,
                                label: p.label,
                              }))}
                              onChange={(v) => {
                                form.setFieldsValue({
                                  province: v,
                                  district_local: undefined,
                                  khoroo: undefined,
                                  sum_district: undefined,
                                  bag_khoroo: undefined,
                                });
                                setMapPos(null);
                              }}
                            />
                          </Form.Item>

                          {isUB ? (
                            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                              <Form.Item
                                name="district_local"
                                label={isLand ? "Сум / дүүрэг" : "Дүүрэг"}
                                rules={[{ required: true, message: "Сум/дүүрэг сонгоно уу" }]}
                              >
                                <Select
                                  size="large"
                                  showSearch
                                  optionFilterProp="label"
                                  placeholder="Сонгох"
                                  options={UB_DISTRICTS.map((d) => ({
                                    value: d.value,
                                    label: d.label,
                                  }))}
                                  onChange={(v) => {
                                    form.setFieldsValue({
                                      district_local: v,
                                      khoroo: undefined,
                                    });
                                    const d = getDistrict(v);
                                    if (d) setMapPos({ ...d.center });
                                  }}
                                />
                              </Form.Item>
                              <Form.Item
                                name="khoroo"
                                label={isLand ? "Баг / хороо" : "Хороо"}
                                rules={[{ required: true, message: "Баг/хороо сонгоно уу" }]}
                              >
                                <Select
                                  size="large"
                                  placeholder={district ? "Сонгох" : "Эхлээд сум/дүүрэг"}
                                  disabled={!selectedDistrict}
                                  options={
                                    selectedDistrict
                                      ? getKhorooOptions(selectedDistrict.khorooCount)
                                      : []
                                  }
                                />
                              </Form.Item>
                            </div>
                          ) : isLand ? (
                            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                              <Form.Item
                                name="sum_district"
                                label="Сум / дүүрэг"
                                rules={[{ required: true, message: "Сум/дүүрэг оруулна уу" }]}
                              >
                                <Input size="large" placeholder="Сонгох / бичих" />
                              </Form.Item>
                              <Form.Item
                                name="bag_khoroo"
                                label="Баг / хороо"
                                rules={[{ required: true, message: "Баг/хороо оруулна уу" }]}
                              >
                                <Input size="large" placeholder="Сонгох / бичих" />
                              </Form.Item>
                            </div>
                          ) : null}

                          <Form.Item
                            name="address_detail"
                            label={isLand ? "Нэмэлт байршил (сонголттой)" : "Дэлгэрэнгүй хаяг"}
                            extra={
                              isLand
                                ? "Байршлыг илүү тодорхойлох нэмэлт мэдээлэл"
                                : "Хотхоны нэр бичвэл газрын зураг дээр автоматаар олно (жишээ: River Garden)"
                            }
                          >
                            <Input
                              size="large"
                              placeholder="River Garden, 12-р байр"
                              allowClear
                            />
                          </Form.Item>

                          <Form.Item
                            name="unofficial_addresses"
                            label="Нэмэлт нэршил"
                            extra="Таслалаар тусгаарлана"
                          >
                            <Input size="large" placeholder="Зайсан, Zaisan" />
                          </Form.Item>

                          {addressPreview ? (
                            <div className="mb-5 flex gap-3 rounded-2xl border border-brand/10 bg-brand/4 px-4 py-3.5">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-brand/70">
                                  Албан ёсны хаяг
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                                  {addressPreview}
                                </p>
                              </div>
                            </div>
                          ) : null}

                          <div className="mb-1">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-800">
                                Газрын зураг дээрх байршил
                              </p>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  mapPos
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {mapPos ? "Тэмдэглэгдсэн" : "Заавал тэмдэглэнэ"}
                              </span>
                            </div>
                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                              <LocationPicker
                                value={mapPos}
                                center={mapCenter}
                                searchQuery={mapSearchQuery}
                                onChange={setMapPos}
                                onGeocodeStatus={setGeocodeStatus}
                              />
                            </div>
                            <GeocodeStatusHint status={geocodeStatus} />
                            {!mapPos && geocodeStatus === "idle" ? (
                              <p className="mt-2 text-xs text-slate-500">
                                Хотхоны нэр бичнэ үү — эсвэл зураг дээр дарж тэмдэглэнэ үү
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={step === 2 ? "block" : "hidden"}>
                      <div className="space-y-5">
                        <StepHeader
                          icon={Layers}
                          title={isLand ? "Газрын мэдээлэл" : "Үнэ ба дэлгэрэнгүй"}
                          description={
                            isLand
                              ? "Талбай, эрхийн төрөл, ашиглалтын зориулалтыг оруулна уу"
                              : listingType === "rent"
                                ? "Сарын түрээс болон талбайг оруулна уу"
                                : "Зарах үнэ болон талбайг оруулна уу"
                          }
                        />

                        <FieldSection title={isLand ? "Үнэ ба талбай" : "Үндсэн мэдээлэл"}>
                          <Form.Item
                            name="price"
                            label={listingType === "rent" ? "Сарын түрээс" : "Үнэ"}
                            rules={[
                              { required: true, message: "Үнэ оруулна уу" },
                              {
                                validator: async (_, v) => {
                                  if (v == null || v === "") {
                                    return Promise.reject(new Error("Үнэ оруулна уу"));
                                  }
                                  if (Number(v) <= 0) {
                                    return Promise.reject(
                                      new Error("Үнэ 0-ээс их байх ёстой"),
                                    );
                                  }
                                },
                              },
                            ]}
                            className="mb-5!"
                          >
                            <PriceInput
                              placeholder={
                                listingType === "rent" ? "2,500,000" : "450,000,000"
                              }
                              showSuffix={listingType === "rent"}
                              suffixLabel="/сар"
                            />
                          </Form.Item>

                          <div
                            className={`grid gap-x-4 ${
                              isLand ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"
                            }`}
                          >
                            <Form.Item
                              name="area_m2"
                              label={isLand ? "Талбайн хэмжээ" : "Талбай"}
                              rules={[
                                { required: true, message: "Талбай оруулна уу" },
                                {
                                  validator: async (_, v) => {
                                    if (v == null || v === "") {
                                      return Promise.reject(new Error("Талбай оруулна уу"));
                                    }
                                    if (Number(v) <= 0) {
                                      return Promise.reject(
                                        new Error("Талбай 0-ээс их байх ёстой"),
                                      );
                                    }
                                  },
                                },
                              ]}
                              className="mb-0!"
                          extra={isLand ? "Газрын талбайг м²-аар оруулна уу" : "Бутархай тоо оруулж болно (жишээ: 65.4)"}
                            >
                              <AreaInput placeholder={isLand ? "700" : "65.4"} />
                            </Form.Item>
                            {isLand ? (
                              <Form.Item
                                name="parcel_number"
                                label="Нэгж талбарын дугаар"
                                rules={[
                                  { required: true, message: "Нэгж талбарын дугаар оруулна уу" },
                                ]}
                                className="mb-0!"
                              >
                                <Input
                                  size="large"
                                  placeholder="Жишээ: 1700020123"
                                  prefix={<ScrollText className="h-4 w-4 text-slate-400" />}
                                  className="rounded-xl! border-slate-200!"
                                />
                              </Form.Item>
                            ) : (
                              <Form.Item
                                name="room_count"
                                label="Өрөө"
                                rules={[{ required: true, message: "Өрөө оруулна уу" }]}
                                className="mb-0!"
                              >
                                <Select
                                  size="large"
                                  placeholder="Сонгох"
                                  options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
                                    value: n,
                                    label: n === 8 ? "8+" : String(n),
                                  }))}
                                />
                              </Form.Item>
                            )}
                          </div>
                        </FieldSection>

                        {isLand ? (
                          <>
                            <Form.Item
                              name="land_right_type"
                              hidden
                              rules={[{ required: true, message: "Эрхийн төрөл сонгоно уу" }]}
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item
                              name="land_use_type"
                              hidden
                              rules={[{ required: true, message: "Ашиглалтын төрөл сонгоно уу" }]}
                            >
                              <Input />
                            </Form.Item>

                            <FieldSection title="Эрхийн төрөл">
                              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                {LAND_RIGHT_OPTIONS.map((opt) => {
                                  const Icon = LAND_RIGHT_ICONS[opt.value] || FileBadge;
                                  return (
                                    <SelectCard
                                      key={opt.value}
                                      compact
                                      active={landRightType === opt.value}
                                      onClick={() => {
                                        form.setFieldValue("land_right_type", opt.value);
                                        if (!landRightNeedsContract(opt.value)) {
                                          form.setFieldsValue({
                                            land_contract_start: undefined,
                                            land_contract_end: undefined,
                                          });
                                        }
                                      }}
                                      icon={Icon}
                                      title={opt.label}
                                      subtitle={opt.hint}
                                    />
                                  );
                                })}
                              </div>

                              {landNeedsContract ? (
                                <div className="mt-4 rounded-2xl border border-brand/15 bg-white p-4">
                                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    <CalendarDays className="h-4 w-4 text-brand" />
                                    Гэрээний хугацаа
                                  </p>
                                  <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                                    <Form.Item
                                      name="land_contract_start"
                                      label="Эхлэх огноо"
                                      rules={[
                                        { required: true, message: "Эхлэх огноо сонгоно уу" },
                                      ]}
                                      className="mb-0! sm:mb-0!"
                                    >
                                      <DateField />
                                    </Form.Item>
                                    <Form.Item
                                      name="land_contract_end"
                                      label="Дуусах огноо"
                                      rules={[
                                        { required: true, message: "Дуусах огноо сонгоно уу" },
                                      ]}
                                      className="mb-0!"
                                    >
                                      <DateField />
                                    </Form.Item>
                                  </div>
                                </div>
                              ) : landRightType === "ownership" ? (
                                <p className="mt-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700">
                                  Өмчлөх эрх хугацаагүй — гэрээний огноо шаардлагагүй
                                </p>
                              ) : null}
                            </FieldSection>

                            <FieldSection title="Газар ашиглалтын төрөл">
                              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                {LAND_USE_OPTIONS.map((opt) => {
                                  const Icon = LAND_USE_ICONS[opt.value] || Layers;
                                  return (
                                    <SelectCard
                                      key={opt.value}
                                      compact
                                      active={landUseType === opt.value}
                                      onClick={() => form.setFieldValue("land_use_type", opt.value)}
                                      icon={Icon}
                                      title={opt.label}
                                    />
                                  );
                                })}
                              </div>
                            </FieldSection>
                          </>
                        ) : (
                          <>
                        <FieldSection title="Барилга">
                          <div className="grid grid-cols-2 gap-x-4">
                            <Form.Item name="year_built" label="Баригдсан он">
                              <Select
                                size="large"
                                allowClear
                                showSearch
                                placeholder="Он сонгох"
                                options={Array.from({ length: 2027 - 1970 }, (_, i) => {
                                  const y = 2026 - i;
                                  return { value: y, label: String(y) };
                                })}
                              />
                            </Form.Item>
                            <Form.Item name="building_type" label="Барилгын хийц">
                              <Select
                                size="large"
                                allowClear
                                placeholder="Сонгох"
                                options={[
                                  { value: "Панел", label: "Панел" },
                                  { value: "Тоосго", label: "Тоосго" },
                                  { value: "Бетон цутгамал", label: "Бетон цутгамал" },
                                  { value: "Модон", label: "Модон" },
                                  { value: "Төмөр каркас", label: "Төмөр каркас" },
                                  { value: "Холимог", label: "Холимог" },
                                  { value: "Бусад", label: "Бусад" },
                                ]}
                              />
                            </Form.Item>
                          </div>

                          {propertyType !== "land" && (
                            <div className="grid grid-cols-2 gap-x-4">
                              <Form.Item name="floor" label="Давхар" className="mb-0!">
                                <Select
                                  size="large"
                                  allowClear
                                  placeholder="Сонгох"
                                  options={Array.from({ length: 40 }, (_, i) => ({
                                    value: i + 1,
                                    label: String(i + 1),
                                  }))}
                                />
                              </Form.Item>
                              <Form.Item name="total_floor" label="Нийт давхар" className="mb-0!">
                                <Select
                                  size="large"
                                  allowClear
                                  placeholder="Сонгох"
                                  options={Array.from({ length: 50 }, (_, i) => ({
                                    value: i + 1,
                                    label: String(i + 1),
                                  }))}
                                />
                              </Form.Item>
                            </div>
                          )}
                        </FieldSection>

                        <FieldSection title="Дотор засал">
                          <div className="grid grid-cols-2 gap-x-4">
                            <Form.Item name="bathroom_count" label="Угаалгын өрөө">
                              <Select
                                size="large"
                                allowClear
                                placeholder="Сонгох"
                                options={[1, 2, 3, 4].map((n) => ({
                                  value: n,
                                  label: String(n),
                                }))}
                              />
                            </Form.Item>
                            <Form.Item name="window_count" label="Цонхны тоо">
                              <Select
                                size="large"
                                allowClear
                                placeholder="Сонгох"
                                options={Array.from({ length: 12 }, (_, i) => ({
                                  value: i + 1,
                                  label: String(i + 1),
                                }))}
                              />
                            </Form.Item>
                          </div>

                          <Form.Item name="view_direction" label="Цонхны харагдац">
                            <Select
                              size="large"
                              allowClear
                              options={options?.view_directions}
                              placeholder="Сонгох"
                            />
                          </Form.Item>

                          <Form.Item name="condition" label="Нөхцөл байдал" className="mb-0!">
                            <Select size="large" options={options?.conditions} />
                          </Form.Item>
                        </FieldSection>

                        {listingType === "sell" && (
                          <FieldSection title="Төлбөрийн нөхцөл">
                            <Form.Item name="payment_terms" className="mb-0!">
                              <Checkbox.Group
                                className="flex w-full flex-col gap-2.5"
                                options={(options?.payment_terms || []).map((o) => ({
                                  value: o.value,
                                  label: o.label,
                                }))}
                              />
                            </Form.Item>
                          </FieldSection>
                        )}

                        <div>
                          <p className="mb-3 text-sm font-semibold text-slate-800">
                            Нэмэлт онцлог
                          </p>
                          <div className="grid grid-cols-2 gap-2.5">
                            {[
                              { name: "has_elevator", label: "Лифт", icon: ArrowLeftRight },
                              { name: "balcony", label: "Тагт", icon: Layers },
                              { name: "garage", label: "Гараж", icon: Warehouse },
                              { name: "furnished", label: "Тавилга", icon: Sofa },
                            ].map((item) => (
                              <Form.Item
                                key={item.name}
                                name={item.name}
                                valuePropName="checked"
                                className="mb-0!"
                              >
                                <SwitchOption label={item.label} icon={item.icon} />
                              </Form.Item>
                            ))}
                          </div>
                        </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className={step === 3 ? "block" : "hidden"}>
                      <div>
                        <StepHeader
                          icon={ImageIcon}
                          title="Гарчиг, тайлбар, зураг"
                          description="Нүүр зураг, gallery, гарчиг, тайлбар — зарын нүүрийг бэлдэнэ"
                        />

                        <Form.Item
                          name="title"
                          label="Гарчиг"
                          rules={[
                            { required: true, message: "Гарчиг оруулна уу" },
                            { min: 8, message: "Хамгийн багадаа 8 тэмдэгт" },
                          ]}
                          extra={
                            titleManual
                              ? "Та гарчгийг өөрчилсөн. Доорх саналаас дахин сонгож болно."
                              : "Хотхон, өрөө, талбай, хаягаас автоматаар үүссэн — хүсвэл засаарай"
                          }
                        >
                          <Input
                            size="large"
                            placeholder={suggestedTitle || "Товч, тод гарчиг"}
                            maxLength={120}
                            showCount
                            onChange={() => setTitleManual(true)}
                          />
                        </Form.Item>

                        {suggestedTitle ? (
                          <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-brand/15 bg-brand/4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 text-xs font-semibold text-brand">
                                <Sparkles className="h-3.5 w-3.5" />
                                Санал болгосон гарчиг
                              </p>
                              <p className="mt-1 text-sm font-medium leading-snug text-slate-800">
                                {suggestedTitle}
                              </p>
                            </div>
                            <Button
                              type={titleManual || title !== suggestedTitle ? "primary" : "default"}
                              size="middle"
                              className="shrink-0 rounded-xl"
                              icon={<Sparkles className="h-3.5 w-3.5" />}
                              onClick={applySuggestedTitle}
                              disabled={!titleManual && title === suggestedTitle}
                            >
                              Ашиглах
                            </Button>
                          </div>
                        ) : null}

                        <Form.Item
                          name="description"
                          label="Тайлбар"
                          rules={[
                            { required: true, message: "Тайлбар оруулна уу" },
                            { min: 20, message: "Хамгийн багадаа 20 тэмдэгт" },
                          ]}
                        >
                          <Input.TextArea
                            rows={5}
                            placeholder={"Байршлын давуу тал\nЗасвар, тавилга\nХөрш орчин"}
                            showCount
                            maxLength={2000}
                          />
                        </Form.Item>

                        <Form.Item
                          name="images"
                          label="Зураг"
                          extra="Нүүр зураг болон gallery зураг оруулна уу"
                          className="mb-5!"
                        >
                          <PropertyImageUploader />
                        </Form.Item>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5">
                          <div className="mb-3 flex items-center gap-2">
                            <User className="h-4 w-4 text-brand" />
                            <p className="text-sm font-semibold text-slate-800">Холбоо барих</p>
                          </div>
                          <div className="grid gap-x-4 sm:grid-cols-2">
                            <Form.Item name="contact_name" label="Нэр" className="mb-4!">
                              <Input size="large" placeholder="Таны нэр" />
                            </Form.Item>
                            <Form.Item name="contact_phone" label="Утас" className="mb-4!">
                              <Input size="large" placeholder="9911-2233" />
                            </Form.Item>
                          </div>
                          <Form.Item name="contact_email" label="Имэйл" className="mb-0!">
                            <Input size="large" type="email" placeholder="you@email.com" />
                          </Form.Item>
                        </div>
                      </div>
                    </div>

                    <div className={step === 4 ? "block" : "hidden"}>
                      <div className="space-y-5">
                        <StepHeader
                          icon={CheckCircle2}
                          title="Шалгаад нийтлэх"
                          description="Мэдээллээ шалгаад зар нийтлээрэй"
                        />

                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                          {imagePreviews[0] ? (
                            <div className="relative aspect-video overflow-hidden border-b border-slate-100 bg-slate-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imagePreviews[0]}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                              <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white">
                                Нүүр зураг
                              </span>
                              {imagePreviews.length > 1 ? (
                                <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
                                  +{imagePreviews.length - 1} зураг
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <div className="flex aspect-video items-center justify-center border-b border-slate-100 bg-slate-50 text-sm text-slate-400">
                              Нүүр зураг оруулаагүй
                            </div>
                          )}

                          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Тойм
                            </p>
                            <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                              {title || suggestedTitle || "Гарчиг оруулаагүй"}
                            </p>
                            {priceLabel ? (
                              <p className="mt-1.5 text-lg font-semibold text-brand">
                                {priceLabel}
                              </p>
                            ) : null}
                            {description ? (
                              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                                {String(description)}
                              </p>
                            ) : null}
                          </div>

                          {imagePreviews.length > 1 ? (
                            <div className="grid grid-cols-4 gap-1.5 border-b border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-6">
                              {imagePreviews.slice(1, 7).map((url) => (
                                <div
                                  key={url}
                                  className="aspect-square overflow-hidden rounded-lg bg-slate-100"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : null}

                          <div className="divide-y divide-slate-100">
                            {reviewRows.map((row) => (
                              <div
                                key={row.label}
                                className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-6"
                              >
                                <p className="shrink-0 text-xs font-medium text-slate-400 sm:w-36 sm:pt-0.5">
                                  {row.label}
                                </p>
                                <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-slate-800 sm:text-right">
                                  {row.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {(canPostAsAgent || canPostAsCompany) && (
                          <div>
                            <p className="mb-2.5 text-sm font-semibold text-slate-800">
                              Хэнээр нийтлэх вэ?
                            </p>
                            <div className="space-y-2">
                              <OwnerOption
                                active={ownerType === "owner"}
                                onClick={() => setOwnerTypeOverride("owner")}
                                title="Би өөрөө (зарын эзэн)"
                                subtitle="Хувь хүний зар гэж харагдана"
                              />
                              {canPostAsAgent && (
                                <OwnerOption
                                  active={ownerType === "agent"}
                                  onClick={() => setOwnerTypeOverride("agent")}
                                  title={`Агентээр — ${profile?.display_label}`}
                                  subtitle="Агент профайлаар нийтлэнэ"
                                />
                              )}
                              {canPostAsCompany && (
                                <OwnerOption
                                  active={ownerType === "company"}
                                  onClick={() => setOwnerTypeOverride("company")}
                                  title={`Компаниар — ${profile?.display_label}`}
                                  subtitle="Компанийн нэрээр нийтлэнэ"
                                />
                              )}
                            </div>
                          </div>
                        )}

                        {isIndividual && (
                          <Alert
                            type="success"
                            showIcon
                            icon={<User className="h-4 w-4" />}
                            message="Хувь хүний зар"
                            description="Таны зар «зарын эзэн» гэж нийтлэгдэнэ."
                            className="rounded-2xl"
                          />
                        )}
                      </div>
                    </div>
              </div>

              <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7 lg:static lg:bg-transparent lg:px-8 lg:py-5">
                {step > 0 ? (
                  <Button
                    size="large"
                    onClick={goBack}
                    icon={<ChevronLeft className="h-4 w-4" />}
                    className="rounded-xl"
                  >
                    Буцах
                  </Button>
                ) : (
                  <Link href="/dashboard/listings">
                    <Button size="large" type="text" className="text-slate-500">
                      Болих
                    </Button>
                  </Link>
                )}

                {step < STEPS.length - 1 ? (
                  <Button
                    type="primary"
                    size="large"
                    onClick={goNext}
                    icon={<ChevronRight className="h-4 w-4" />}
                    iconPlacement="end"
                    className="min-w-40 rounded-xl"
                  >
                    Үргэлжлүүлэх
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    loading={submitting}
                    onClick={() => {
                      void onFinish(form.getFieldsValue(true) as Record<string, unknown>);
                    }}
                    icon={<Building2 className="h-4 w-4" />}
                    className="min-w-40 rounded-xl"
                  >
                    Зар нийтлэх
                  </Button>
                )}
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
