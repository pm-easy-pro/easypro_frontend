/** Монголын аймаг/хот, УБ дүүрэг, хороо — зар оруулах формд */

export interface RegionOption {
  value: string;
  label: string;
  center: { lat: number; lng: number };
}

export interface DistrictOption extends RegionOption {
  /** Хорооны тоо (УБ) */
  khorooCount: number;
  /** Backend Property.district утга */
  apiValue: string;
}

export const PROVINCES: RegionOption[] = [
  { value: "ulaanbaatar", label: "Улаанбаатар", center: { lat: 47.9184, lng: 106.9177 } },
  { value: "darkhan_uul", label: "Дархан-Уул", center: { lat: 49.4867, lng: 105.9383 } },
  { value: "orkhon", label: "Орхон", center: { lat: 49.0278, lng: 104.0444 } },
  { value: "selenge", label: "Сэлэнгэ", center: { lat: 49.4667, lng: 105.4167 } },
  { value: "tuv", label: "Төв", center: { lat: 47.7, lng: 106.5 } },
  { value: "khuvsgul", label: "Хөвсгөл", center: { lat: 49.4833, lng: 100.1667 } },
  { value: "arkhangai", label: "Архангай", center: { lat: 47.4833, lng: 101.45 } },
  { value: "uvurkhangai", label: "Өвөрхангай", center: { lat: 45.7667, lng: 102.7833 } },
  { value: "bayankhongor", label: "Баянхонгор", center: { lat: 46.1944, lng: 100.7181 } },
  { value: "govi_altai", label: "Говь-Алтай", center: { lat: 46.3722, lng: 96.2572 } },
  { value: "zavkhan", label: "Завхан", center: { lat: 48.0056, lng: 95.85 } },
  { value: "khovd", label: "Ховд", center: { lat: 48.0056, lng: 91.6419 } },
  { value: "uvs", label: "Увс", center: { lat: 49.9811, lng: 92.0667 } },
  { value: "bayan_ulgii", label: "Баян-Өлгий", center: { lat: 48.9683, lng: 89.9686 } },
  { value: "bulgan", label: "Булган", center: { lat: 48.8125, lng: 103.5333 } },
  { value: "khentii", label: "Хэнтий", center: { lat: 47.3167, lng: 110.65 } },
  { value: "dornod", label: "Дорнод", center: { lat: 48.0667, lng: 114.5 } },
  { value: "sukbaatar", label: "Сүхбаатар аймаг", center: { lat: 46.6833, lng: 113.2833 } },
  { value: "dornogovi", label: "Дорноговь", center: { lat: 44.8833, lng: 110.1333 } },
  { value: "dundgovi", label: "Дундговь", center: { lat: 45.7667, lng: 106.2667 } },
  { value: "umnugovi", label: "Өмнөговь", center: { lat: 43.5833, lng: 104.4167 } },
  { value: "govisumber", label: "Говьсүмбэр", center: { lat: 46.5333, lng: 108.4167 } },
];

/** Улаанбаатарын дүүргүүд */
export const UB_DISTRICTS: DistrictOption[] = [
  {
    value: "bayangol",
    apiValue: "bayangol",
    label: "Баянгол",
    khorooCount: 34,
    center: { lat: 47.9135, lng: 106.8705 },
  },
  {
    value: "bayanzurkh",
    apiValue: "bayanzurkh",
    label: "Баянзүрх",
    khorooCount: 43,
    center: { lat: 47.9215, lng: 106.952 },
  },
  {
    value: "songinokhairkhan",
    apiValue: "songinokhairkhan",
    label: "Сонгинохайрхан",
    khorooCount: 43,
    center: { lat: 47.94, lng: 106.8 },
  },
  {
    value: "khan_uul",
    apiValue: "hud",
    label: "Хан-Уул",
    khorooCount: 25,
    center: { lat: 47.886, lng: 106.905 },
  },
  {
    value: "sukhbaatar",
    apiValue: "sukhbaatar",
    label: "Сүхбаатар",
    khorooCount: 20,
    center: { lat: 47.921, lng: 106.917 },
  },
  {
    value: "chingeltei",
    apiValue: "chingeltei",
    label: "Чингэлтэй",
    khorooCount: 24,
    center: { lat: 47.935, lng: 106.905 },
  },
  {
    value: "nalaikh",
    apiValue: "nalaikh",
    label: "Налайх",
    khorooCount: 8,
    center: { lat: 47.772, lng: 107.252 },
  },
  {
    value: "baganuur",
    apiValue: "baganuur",
    label: "Багануур",
    khorooCount: 5,
    center: { lat: 47.79, lng: 108.35 },
  },
  {
    value: "bagakhangai",
    apiValue: "bagakhangai",
    label: "Багахангай",
    khorooCount: 2,
    center: { lat: 47.35, lng: 106.05 },
  },
];

export function getKhorooOptions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}-р хороо`,
  }));
}

export function getDistrict(value: string) {
  return UB_DISTRICTS.find((d) => d.value === value);
}

export function getProvince(value: string) {
  return PROVINCES.find((p) => p.value === value);
}

export function buildOfficialAddress(parts: {
  provinceLabel: string;
  districtLabel?: string;
  khoroo?: string;
  detail?: string;
  /** false = аймгийн баг, true/undefined = УБ хороо */
  isUB?: boolean;
}) {
  const chunks: string[] = [];
  if (parts.districtLabel) {
    chunks.push(parts.districtLabel);
  } else {
    chunks.push(parts.provinceLabel);
  }
  if (parts.khoroo) {
    chunks.push(
      parts.isUB === false ? `${parts.khoroo} баг` : `${parts.khoroo}-р хороо`,
    );
  } else if (parts.districtLabel && parts.provinceLabel && parts.isUB === false) {
    chunks.unshift(parts.provinceLabel);
  }
  if (parts.detail?.trim()) {
    chunks.push(parts.detail.trim());
  }
  return chunks.join(", ");
}
