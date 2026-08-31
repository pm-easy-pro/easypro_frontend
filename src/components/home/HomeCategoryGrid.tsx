import Link from "next/link";
import { Building2, Home, LandPlot, Store } from "lucide-react";

import type { FilterOption } from "@/types";

const ICONS: Record<string, typeof Home> = {
  apartment: Building2,
  house: Home,
  land: LandPlot,
  commercial: Store,
  office: Building2,
};

interface HomeCategoryGridProps {
  propertyTypes: FilterOption[];
}

export function HomeCategoryGrid({ propertyTypes }: HomeCategoryGridProps) {
  const realEstateTypes = propertyTypes.filter((type) => type.value !== "land");
  const landType = propertyTypes.find((type) => type.value === "land");
  const items = realEstateTypes.slice(0, 3);

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-14 md:px-6 md:py-16">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#183E95]">
            Ангиллаар хайх
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
            Таны хэрэгцээнд тохирсон төрөл
          </h2>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link href="/properties" className="text-[#183E95] hover:underline">
            Үл хөдлөх →
          </Link>
          <Link href="/land" className="text-[#183E95] hover:underline">
            Газар →
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((type) => {
          const Icon = ICONS[type.value] || Building2;
          return (
            <Link
              key={type.value}
              href={`/properties?property_type=${type.value}`}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-[#183E95]/30 hover:shadow-[0_12px_40px_rgba(24,62,149,0.12)]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#183E95]/10 text-[#183E95] transition group-hover:bg-[#183E95] group-hover:text-white">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">{type.label}</p>
                <p className="text-sm text-slate-500">Зарууд үзэх</p>
              </div>
            </Link>
          );
        })}
        {landType ? (
          <Link
            href="/land"
            className="group flex items-center gap-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 shadow-sm transition hover:border-emerald-400/40 hover:shadow-[0_12px_40px_rgba(16,185,129,0.12)]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
              <LandPlot className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">{landType.label}</p>
              <p className="text-sm text-slate-500">Газрын зарууд</p>
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
