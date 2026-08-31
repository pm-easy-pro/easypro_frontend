"use client";

import { Phone } from "lucide-react";

import { formatPrice } from "@/lib/format";
import type { Agent, ListingOwnerType, Property, User } from "@/types";

interface PropertyMobileCtaProps {
  property: Property;
  agent?: Agent | null;
  poster?: User | null;
  listingOwnerType?: ListingOwnerType;
}

function resolvePhone(
  property: Property,
  agent?: Agent | null,
  poster?: User | null,
  listingOwnerType?: ListingOwnerType,
) {
  if (listingOwnerType === "owner") return poster?.phone || "";
  return agent?.phone || agent?.organization_detail?.phone || poster?.phone || "";
}

export function PropertyMobileCta({
  property,
  agent,
  poster,
  listingOwnerType,
}: PropertyMobileCtaProps) {
  const phone = resolvePhone(property, agent, poster, listingOwnerType);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-[#183E95]">
            {formatPrice(property.price, property.listing_type)}
          </p>
          <p className="truncate text-xs text-slate-500">{property.listing_type_display}</p>
        </div>
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-[#183E95] px-5 text-sm font-semibold text-white shadow-md shadow-[#183E95]/25"
          >
            <Phone className="h-4 w-4" />
            Залгах
          </a>
        ) : null}
      </div>
    </div>
  );
}
