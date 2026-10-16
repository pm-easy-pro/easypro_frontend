"use client";

import { PropertyCard } from "@/components/property/PropertyCard";
import type { Property } from "@/types";

interface PropertyGridProps {
  properties: Property[];
  /** Desktop column count. Home uses 5; catalog stays at 4. */
  columns?: 4 | 5;
}

export function PropertyGrid({ properties, columns = 4 }: PropertyGridProps) {
  const gridClass =
    columns === 5
      ? "grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
      : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={gridClass}>
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
