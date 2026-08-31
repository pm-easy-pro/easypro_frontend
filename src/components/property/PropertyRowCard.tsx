"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BedDouble,
  Clock,
  Eye,
  Layers,
  MapPin,
  Maximize2,
  ScrollText,
  ShieldCheck,
  Star,
  Trees,
} from "lucide-react";

import {
  collectPropertyImages,
  PropertyImageSlider,
} from "@/components/property/PropertyImageSlider";
import {
  formatArea,
  formatDistrict,
  formatFloor,
  formatPrice,
  formatPriceShort,
  formatTimeAgo,
  isLandProperty,
} from "@/lib/format";
import { getLandRightLabel, getLandUseLabel } from "@/lib/land-options";
import type { Property } from "@/types";

interface PropertyRowCardProps {
  property: Property;
}

export function PropertyRowCard({ property }: PropertyRowCardProps) {
  const images = useMemo(
    () => collectPropertyImages(property),
    [property.id, property.thumbnail_url, property.images],
  );
  const isLand = isLandProperty(property);
  const floorLabel = formatFloor(property.floor, property.total_floor);
  const landRight =
    property.land_right_type_display || getLandRightLabel(property.land_right_type);
  const landUse =
    property.land_use_type_display || getLandUseLabel(property.land_use_type);
  const locationLabel =
    property.unofficial_addresses?.[0] || property.official_address;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`group relative overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-[0_12px_40px_rgba(24,62,149,0.12)] ${
        property.is_vip
          ? "border-[#183E95]/25 ring-1 ring-[#183E95]/10"
          : "border-slate-200/80"
      }`}
    >
      {property.is_vip && (
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#183E95] to-[#2563eb] px-4 py-1.5 text-xs font-semibold text-white">
          <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
          VIP зар — дээд байрлал
        </div>
      )}

      <Link href={`/properties/${property.id}`} className="flex flex-col sm:flex-row sm:items-stretch">
        {/* CR80 (ISO 7810 ID-1): 85.6 × 53.98 mm — ~1.586:1 */}
        <div className="relative aspect-[85.6/53.98] w-full shrink-0 overflow-hidden bg-slate-100 sm:w-80 md:w-[22rem] lg:w-[24rem]">
          <PropertyImageSlider
            images={images}
            alt={property.title}
            sizes="(max-width: 640px) 100vw, 384px"
          />
          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5 sm:left-3 sm:top-3">
            {property.is_verified && !property.is_vip && (
              <span className="inline-flex w-fit items-center gap-1 rounded-lg bg-[#183E95] px-2 py-1 text-[11px] font-bold text-white shadow">
                <ShieldCheck className="h-3 w-3" />
                Баталгаажсан
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <p className="text-2xl font-bold tracking-tight text-[#183E95] md:text-[1.65rem]">
                {formatPrice(property.price, property.listing_type)}
              </p>
              <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {property.listing_type_display}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-medium text-slate-400 md:hidden">
              {formatPriceShort(property.price)}
            </p>

            <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-slate-900 md:text-lg">
              {property.title}
            </h3>

            <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-4 w-4 shrink-0 text-[#183E95]" />
              <span className="line-clamp-1">
                {locationLabel}
                <span className="text-slate-300"> · </span>
                {formatDistrict(property.district)}
              </span>
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Maximize2 className="h-4 w-4 text-[#183E95]/70" />
                {formatArea(property.area_m2)}
              </span>
              {isLand ? (
                <>
                  {property.parcel_number ? (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <ScrollText className="h-4 w-4 text-[#183E95]/70" />
                      {property.parcel_number}
                    </span>
                  ) : null}
                  {landRight ? (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Trees className="h-4 w-4 text-[#183E95]/70" />
                      {landRight}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <BedDouble className="h-4 w-4 text-[#183E95]/70" />
                    {property.room_count} өрөө
                  </span>
                  {floorLabel && (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Layers className="h-4 w-4 text-[#183E95]/70" />
                      {floorLabel} давхар
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-100">
                {property.property_type_display}
              </span>
              {isLand ? (
                landUse ? (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
                    {landUse}
                  </span>
                ) : null
              ) : (
                <>
                  <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-100">
                    {property.condition_display}
                  </span>
                  {property.furnished && (
                    <span className="rounded-md bg-[#183E95]/5 px-2 py-0.5 text-xs font-medium text-[#183E95] ring-1 ring-[#183E95]/10">
                      Тавилгатай
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTimeAgo(property.created_at)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {property.views_count} үзсэн
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
