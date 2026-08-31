import { Eye, MapPin, ShieldCheck, Star } from "lucide-react";

import { formatDistrict, formatPrice, formatTimeAgo } from "@/lib/format";
import type { Property } from "@/types";

interface PropertyDetailHeaderProps {
  property: Property;
}

export function PropertyDetailHeader({ property }: PropertyDetailHeaderProps) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-[#183E95]">{property.listing_type_display}</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-600">{property.property_type_display}</span>
        {property.property_type !== "land" && property.condition_display ? (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">{property.condition_display}</span>
          </>
        ) : null}
        {property.is_vip ? (
          <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-amber-400/90 px-2 py-0.5 text-[11px] font-bold text-amber-950">
            <Star className="h-3 w-3" /> VIP
          </span>
        ) : null}
        {property.is_verified ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#183E95]/10 px-2 py-0.5 text-[11px] font-bold text-[#183E95]">
            <ShieldCheck className="h-3 w-3" /> Баталгаажсан
          </span>
        ) : null}
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl lg:text-[2rem] lg:leading-tight">
          {property.title}
        </h1>
        <p className="mt-3 flex items-start gap-2 text-[15px] text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#183E95]" aria-hidden />
          <span>
            {property.official_address}
            <span className="text-slate-400"> · </span>
            {formatDistrict(property.district)}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-slate-100 pt-4 lg:hidden">
        <p className="text-2xl font-bold text-[#183E95]">
          {formatPrice(property.price, property.listing_type)}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-slate-400">
          <Eye className="h-3.5 w-3.5" />
          {property.views_count.toLocaleString("mn-MN")} үзсэн
          {property.created_at ? (
            <>
              <span className="text-slate-300">·</span>
              {formatTimeAgo(property.created_at)}
            </>
          ) : null}
        </p>
      </div>
    </header>
  );
}
