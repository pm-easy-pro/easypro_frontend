"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BedDouble, Clock, MapPin, Maximize2, ScrollText, ShieldCheck, Star, Trees } from "lucide-react";

import {
  formatArea,
  formatDistrict,
  formatFloor,
  formatPrice,
  formatPriceShort,
  isLandProperty,
} from "@/lib/format";
import { PropertyTimeAgo } from "@/components/property/PropertyTimeAgo";
import { getLandRightLabel, getLandUseLabel } from "@/lib/land-options";
import type { Property } from "@/types";

const SLIDE_INTERVAL_MS = 1000;

function buildImageList(property: Property) {
  const urls = [
    property.thumbnail_url,
    ...(property.images || []),
  ].filter((url): url is string => Boolean(url));
  return Array.from(new Set(urls));
}

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const images = useMemo(() => buildImageList(property), [property]);
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLand = isLandProperty(property);
  const floorLabel = formatFloor(property.floor, property.total_floor);
  const landRight =
    property.land_right_type_display || getLandRightLabel(property.land_right_type);
  const landUse =
    property.land_use_type_display || getLandUseLabel(property.land_use_type);
  const locationLabel =
    property.unofficial_addresses?.[0] || property.official_address;

  const currentImage = images[index] || "/placeholder-property.jpg";
  const canSlide = images.length > 1;

  useEffect(() => {
    if (!hovering || !canSlide) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, SLIDE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hovering, canSlide, images.length]);

  // Prefetch remaining images once hover starts
  useEffect(() => {
    if (!hovering || images.length < 2) return;
    images.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [hovering, images]);

  const handleEnter = () => {
    setHovering(true);
  };

  const handleLeave = () => {
    setHovering(false);
    setIndex(0);
  };

  return (
    <article
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`group overflow-hidden rounded-2xl border bg-white shadow-sm ${
        property.is_vip ? "border-[#183E95]/30" : "border-slate-200/80"
      }`}
    >
      <Link href={`/properties/${property.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            key={currentImage}
            src={currentImage}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 20vw"
            unoptimized
          />
          {property.is_vip && (
            <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-1 bg-gradient-to-r from-[#183E95] to-[#2563eb] px-3 py-1.5 text-xs font-bold text-white">
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
              VIP
            </div>
          )}
          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
            {property.is_verified && !property.is_vip && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#183E95] px-2 py-1 text-xs font-bold text-white shadow">
                <ShieldCheck className="h-3.5 w-3.5" />
                Баталгаажсан
              </span>
            )}
          </div>
          {canSlide ? (
            <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1 opacity-0 group-hover:opacity-100">
              {images.map((src, i) => (
                <span
                  key={src}
                  className={`h-1 rounded-full ${
                    i === index ? "w-4 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-y-2.5 p-4">
          <div>
            <p className="text-xl font-bold text-[#183E95]">
              {formatPrice(property.price, property.listing_type)}
            </p>
            {Number(property.price) >= 1_000_000 ? (
              <p className="mt-0.5 text-sm font-medium text-slate-500">
                {formatPriceShort(property.price)}
              </p>
            ) : null}
          </div>
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
            <PropertyTimeAgo dateStr={property.created_at} />
          </p>
        </div>
      </Link>
    </article>
  );
}
