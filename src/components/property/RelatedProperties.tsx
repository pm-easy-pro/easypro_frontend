import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PropertyRowCard } from "@/components/property/PropertyRowCard";
import type { Property } from "@/types";

interface RelatedPropertiesProps {
  properties: Property[];
  locationLabel: string;
}

export function RelatedProperties({ properties, locationLabel }: RelatedPropertiesProps) {
  if (!properties.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 md:text-xl">Энэ байршлын бусад зарууд</h2>
          <p className="mt-1 text-sm text-slate-500">{locationLabel}</p>
        </div>
        <Link
          href={`/properties?locations=${encodeURIComponent(locationLabel)}`}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#183E95] hover:underline"
        >
          Бүгд
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {properties.map((property) => (
          <PropertyRowCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
}
