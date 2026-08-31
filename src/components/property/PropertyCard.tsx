"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BedDouble, Clock, MapPin, Maximize2, ScrollText, ShieldCheck, Star, Trees } from "lucide-react";

import {
  formatArea,
  formatDistrict,
  formatFloor,
  formatPrice,
  formatTimeAgo,
  isLandProperty,
} from "@/lib/format";
import { getLandRightLabel, getLandUseLabel } from "@/lib/land-options";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const image = property.thumbnail_url || property.images[0] || "/placeholder-property.jpg";
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
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-[0_16px_40px_rgba(24,62,149,0.14)] ${
        property.is_vip ? "border-[#183E95]/30" : "border-slate-200/80"
      }`}
    >
      <Link href={`/properties/${property.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src={image}
            alt={property.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
          {property.is_vip && (
            <div className="absolute inset-x-0 top-0 flex items-center gap-1 bg-gradient-to-r from-[#183E95] to-[#2563eb] px-3 py-1.5 text-xs font-bold text-white">
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
              VIP
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {property.is_verified && !property.is_vip && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#183E95] px-2 py-1 text-xs font-bold text-white shadow">
                <ShieldCheck className="h-3.5 w-3.5" />
                Баталгаажсан
              </span>
            )}
          </div>
        </div>
        <div className="space-y-2.5 p-4">
          <p className="text-xl font-bold text-[#183E95]">
            {formatPrice(property.price, property.listing_type)}
          </p>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900">
            {property.title}
          </h3>
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-4 w-4 shrink-0 text-[#183E95]" />
            <span className="line-clamp-1">
              {locationLabel} · {formatDistrict(property.district)}
            </span>
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Maximize2 className="h-4 w-4" />
              {formatArea(property.area_m2)}
            </span>
            {isLand ? (
              <>
                {property.parcel_number ? (
                  <span className="inline-flex items-center gap-1">
                    <ScrollText className="h-4 w-4" />
                    {property.parcel_number}
                  </span>
                ) : null}
                {landRight ? (
                  <span className="inline-flex items-center gap-1">
                    <Trees className="h-4 w-4" />
                    {landRight}
                  </span>
                ) : null}
                {landUse ? <span className="text-slate-500">{landUse}</span> : null}
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1">
                  <BedDouble className="h-4 w-4" />
                  {property.room_count} өрөө
                </span>
                {floorLabel && <span className="text-slate-500">{floorLabel} давхар</span>}
              </>
            )}
          </div>
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            {formatTimeAgo(property.created_at)}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}
