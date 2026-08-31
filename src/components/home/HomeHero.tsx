"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Select } from "antd";
import { MapPinned, Search } from "lucide-react";

import { ListingTypeTabs } from "@/components/search/ListingTypeTabs";
import type { FilterOption } from "@/types";

const ROOM_OPTIONS = [
  { value: "1", label: "1+ өрөө" },
  { value: "2", label: "2+ өрөө" },
  { value: "3", label: "3+ өрөө" },
  { value: "4", label: "4+ өрөө" },
];

interface HomeHeroProps {
  listingTypes: FilterOption[];
  propertyTypes: FilterOption[];
  popularLocations: string[];
  listingCount: number;
  locationCount: number;
}

export function HomeHero({
  listingTypes,
  propertyTypes,
  popularLocations,
  listingCount,
  locationCount,
}: HomeHeroProps) {
  const router = useRouter();
  const [listingType, setListingType] = useState("sell");
  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState<string | undefined>();
  const [roomCount, setRoomCount] = useState<string | undefined>();

  const sellRentTypes = listingTypes.filter((t) => t.value === "sell" || t.value === "rent");
  const realEstateTypes = propertyTypes.filter((t) => t.value !== "land");
  const landType = propertyTypes.find((t) => t.value === "land");
  const isLandSearch = propertyType === "land";

  const catalogPath = isLandSearch ? "/land" : "/properties";

  const buildParams = (extra?: Record<string, string | undefined>) => {
    const params = new URLSearchParams({ listing_type: listingType });
    if (query.trim()) params.set("search", query.trim());
    if (propertyType && propertyType !== "land") params.set("property_type", propertyType);
    if (roomCount && !isLandSearch) params.set("room_count", roomCount);
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
    }
    return params;
  };

  const handleSearch = () => {
    router.push(`${catalogPath}?${buildParams().toString()}`);
  };

  const searchByLocation = (name: string) => {
    router.push(`${catalogPath}?${buildParams({ locations: name }).toString()}`);
  };

  const searchByType = (type: string) => {
    if (type === "land") {
      router.push(`/land?listing_type=${listingType}`);
      return;
    }
    router.push(`/properties?listing_type=${listingType}&property_type=${type}`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl text-center">
      <p className="text-sm font-medium text-white/80">
        {listingCount.toLocaleString("mn-MN")}+ идэвхтэй зар ·{" "}
        {locationCount}+ байршил
      </p>
      <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
        Өөрт тохирох
        <span className="text-amber-300"> үл хөдлөх хөрөнгө</span> олох
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-white/75 md:text-lg">
        Байршил, төрөл, өрөөний тоогоор шүүж — газрын зураг дээр харьцуулна
      </p>

      {/* Search card */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl shadow-black/25 sm:rounded-3xl">
        <div className="flex justify-center border-b border-slate-100 bg-slate-50/80 px-3 py-3 sm:px-4">
          <ListingTypeTabs
            options={sellRentTypes}
            value={listingType}
            onChange={setListingType}
          />
        </div>

        <div className="space-y-3 p-3 sm:p-4">
          <Input
            size="large"
            placeholder="Байршил, хороолол, барилга, гарчиг..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={handleSearch}
            className="!h-12 !rounded-xl !border-slate-200 !text-base sm:!h-14"
            prefix={<Search className="h-5 w-5 shrink-0 text-[#183E95]" />}
          />

          <div className={`grid gap-2 ${isLandSearch ? "sm:grid-cols-[1fr_auto]" : "sm:grid-cols-[1fr_1fr_auto]"}`}>
            <Select
              allowClear
              size="large"
              placeholder="Төрөл"
              value={propertyType}
              onChange={(value) => {
                setPropertyType(value);
                if (value === "land") setRoomCount(undefined);
              }}
              options={[
                ...realEstateTypes,
                ...(landType ? [landType] : []),
              ]}
              className="w-full [&_.ant-select-selector]:!h-12 [&_.ant-select-selector]:!rounded-xl"
            />
            {!isLandSearch ? (
            <Select
              allowClear
              size="large"
              placeholder="Өрөө"
              value={roomCount}
              onChange={setRoomCount}
              options={ROOM_OPTIONS}
              className="w-full [&_.ant-select-selector]:!h-12 [&_.ant-select-selector]:!rounded-xl"
            />
            ) : null}
            <Button
              type="primary"
              size="large"
              onClick={handleSearch}
              className="!h-12 w-full !rounded-xl !text-base !font-semibold sm:!min-w-[130px] sm:!w-auto"
              icon={<Search className="h-4 w-4" />}
            >
              Хайх
            </Button>
          </div>
        </div>
      </div>

      {/* Popular locations */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {popularLocations.slice(0, 5).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => searchByLocation(name)}
            className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white hover:text-[#183E95]"
          >
            {name}
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {realEstateTypes.slice(0, 3).map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => searchByType(type.value)}
            className="text-sm font-medium text-white/90 underline-offset-4 transition hover:text-white hover:underline"
          >
            {type.label}
          </button>
        ))}
        {landType ? (
          <button
            type="button"
            onClick={() => searchByType("land")}
            className="text-sm font-medium text-amber-300 underline-offset-4 transition hover:text-amber-200 hover:underline"
          >
            {landType.label}
          </button>
        ) : null}
        <span className="hidden h-4 w-px bg-white/30 sm:block" />
        <Link
          href="/#map"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300 transition hover:text-amber-200"
        >
          <MapPinned className="h-4 w-4" />
          Газрын зурагт хайх
        </Link>
      </div>
    </div>
  );
}
