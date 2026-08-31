import { Eye } from "lucide-react";

import { formatPrice, formatPriceShort, formatTimeAgo } from "@/lib/format";
import type { Property } from "@/types";

interface PropertyOfferPanelProps {
  property: Property;
  children?: React.ReactNode;
}

export function PropertyOfferPanel({ property, children }: PropertyOfferPanelProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(24,62,149,0.06)]">
      <div className="hidden border-b border-slate-100 bg-gradient-to-br from-[#183E95]/[0.06] via-white to-white px-5 py-5 lg:block md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Үнэ</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-[#183E95]">
          {formatPrice(property.price, property.listing_type)}
        </p>
        {property.listing_type === "sell" && Number(property.price) >= 1_000_000 && (
          <p className="mt-1 text-sm text-slate-500">{formatPriceShort(property.price)}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {property.views_count.toLocaleString("mn-MN")} үзсэн
          </span>
          {property.created_at ? (
            <span>{formatTimeAgo(property.created_at)}</span>
          ) : null}
        </div>
      </div>
      {children ? <div className="p-5 md:p-6">{children}</div> : null}
    </div>
  );
}
