const DISTRICT_LABELS: Record<string, string> = {
  hud: "Хан-Уул",
  bayanzurkh: "Баянзүрх",
  bayangol: "Баянгол",
  sukhbaatar: "Сүхбаатар",
  chingeltei: "Чингэлтэй",
  songinokhairkhan: "Сонгинохайрхан",
  khan_uul: "Хан-Уул",
  baganuur: "Багануур",
  bagakhangai: "Багахангай",
  nalaikh: "Налайх",
};

export function formatPrice(price: string | number, listingType?: string) {
  const value = Number(price);
  const formatted = new Intl.NumberFormat("mn-MN").format(value);
  if (listingType === "rent") {
    return `₮${formatted}/сар`;
  }
  return `₮${formatted}`;
}

export function formatPriceShort(price: string | number) {
  const value = Number(price);
  if (value >= 1_000_000_000) {
    return `₮${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} тэрбум`;
  }
  if (value >= 1_000_000) {
    return `₮${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")} сая`;
  }
  return formatPrice(value);
}

export function formatArea(area: string | number) {
  return `${Number(area).toLocaleString("mn-MN")} м²`;
}

export function formatDistrict(district: string) {
  return DISTRICT_LABELS[district] || district;
}

export function formatFloor(floor?: number | null, totalFloor?: number | null) {
  if (floor == null) return null;
  if (totalFloor) return `${floor}/${totalFloor}`;
  return `${floor}`;
}

export function formatYesNo(value: boolean) {
  return value ? "Тийм" : "Үгүй";
}

export function isLandProperty(property: { property_type?: string }) {
  return property.property_type === "land";
}

/** SSR/client ижил — Intl locale Node vs browser зөрөхгүй */
export function formatTimeAgoDate(date: Date) {
  return `${date.getMonth() + 1}-р сарын ${date.getDate()}`;
}

export function formatTimeAgo(dateStr: string, nowMs = Date.now()) {
  const date = new Date(dateStr);
  const diffMs = nowMs - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Саяхан";
  if (minutes < 60) return `${minutes} минутын өмнө`;
  if (hours < 24) return `${hours} цагийн өмнө`;
  if (days < 7) return `${days} өдрийн өмнө`;
  if (days < 30) return `${Math.floor(days / 7)} долоо хоногийн өмнө`;
  return formatTimeAgoDate(date);
}
