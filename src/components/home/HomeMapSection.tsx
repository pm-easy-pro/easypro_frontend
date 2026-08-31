"use client";

import Link from "next/link";
import { ArrowRight, MapPinned } from "lucide-react";

import { MapPreview } from "@/components/map/MapPreview";
import type { Property } from "@/types";

interface HomeMapSectionProps {
  properties: Property[];
}

export function HomeMapSection({ properties }: HomeMapSectionProps) {
  const pinCount = properties.filter((p) => p.latitude && p.longitude).length;

  return (
    <section id="map" className="mx-auto max-w-[1600px] px-4 py-14 md:px-6 md:py-20">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#183E95]">
            Газрын зураг
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
            Байршлаар хайж олоорой
          </h2>
          <p className="mt-2 text-slate-500">
            {pinCount > 0
              ? `${pinCount} зар газрын зураг дээр — үнийг харж, харьцуулна`
              : "Заруудыг газрын зураг дээр харах"}
          </p>
        </div>
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 rounded-xl bg-[#183E95] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1e4bb5]"
        >
          <MapPinned className="h-4 w-4" />
          Бүх зар + газрын зураг
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <MapPreview
        properties={properties}
        className="h-[min(70vh,520px)] min-h-[320px] w-full"
      />
    </section>
  );
}
