"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { ListingTypeTabs } from "@/components/search/ListingTypeTabs";
import { fetchFilterOptions } from "@/lib/api";
import type { FilterOption } from "@/types";

const ROOM_OPTIONS = [
  { value: "1", label: "1+ өрөө" },
  { value: "2", label: "2+ өрөө" },
  { value: "3", label: "3+ өрөө" },
  { value: "4", label: "4+ өрөө" },
];

const DEFAULT_LISTING_TYPES: FilterOption[] = [
  { value: "sell", label: "Худалдах" },
  { value: "rent", label: "Түрээслэх" },
];

const DEFAULT_PROPERTY_TYPES: FilterOption[] = [
  { value: "apartment", label: "Орон сууц" },
  { value: "house", label: "Гэр" },
  { value: "office", label: "Оффис" },
  { value: "commercial", label: "Үйлчилгээний байр" },
  { value: "land", label: "Газар" },
];

export function HeaderSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [listingType, setListingType] = useState("sell");
  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState<string | undefined>();
  const [roomCount, setRoomCount] = useState<string | undefined>();
  const [listingTypes, setListingTypes] = useState<FilterOption[]>(DEFAULT_LISTING_TYPES);
  const [propertyTypes, setPropertyTypes] =
    useState<FilterOption[]>(DEFAULT_PROPERTY_TYPES);
  const [popularLocations, setPopularLocations] = useState<string[]>([]);

  const isLandSearch = propertyType === "land";
  const catalogPath = isLandSearch ? "/land" : "/properties";
  const sellRentTypes = listingTypes.filter((t) => t.value === "sell" || t.value === "rent");

  useEffect(() => {
    let cancelled = false;
    fetchFilterOptions()
      .then((options) => {
        if (cancelled) return;
        const types = options.listing_types.filter(
          (t) => t.value === "sell" || t.value === "rent",
        );
        if (types.length) setListingTypes(types);
        if (options.property_types.length) setPropertyTypes(options.property_types);
        const locs = Array.from(
          new Set(
            options.locations.flatMap((loc) =>
              loc.aliases.length > 0
                ? loc.aliases.map((a) => a.name)
                : [loc.official_address],
            ),
          ),
        ).slice(0, 6);
        setPopularLocations(locs);
      })
      .catch(() => {
        /* keep defaults when API is unreachable */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open]);

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
    close();
  };

  const searchByLocation = (name: string) => {
    router.push(`${catalogPath}?${buildParams({ locations: name }).toString()}`);
    close();
  };

  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-sm font-medium transition ${
      active
        ? "bg-[#183E95] text-white shadow-sm"
        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
    }`;

  return (
    <div ref={rootRef} className="relative w-full min-w-0 max-w-xl">
      {/* Collapsed pill */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-left text-sm text-white/80 backdrop-blur transition hover:bg-white/15 ${
          open ? "invisible md:invisible" : ""
        }`}
        aria-expanded={open}
        aria-label="Хайлт нээх"
      >
        <Search className="h-4 w-4 shrink-0 text-white" />
        <span className="hidden truncate sm:inline">Байршил, төрөл, өрөө...</span>
        <span className="sm:hidden">Хайх</span>
      </button>

      {/* Expanded panel */}
      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:bg-black/25"
            aria-hidden
            onClick={close}
          />
          <div className="fixed inset-x-3 top-[3.75rem] z-50 md:absolute md:inset-x-auto md:left-1/2 md:right-auto md:top-0 md:w-[min(36rem,calc(100vw-12rem))] md:-translate-x-1/2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-2.5 sm:px-4">
                <ListingTypeTabs
                  compact
                  options={sellRentTypes.length ? sellRentTypes : DEFAULT_LISTING_TYPES}
                  value={listingType}
                  onChange={setListingType}
                />
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/80 hover:text-slate-800"
                  aria-label="Хаах"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 p-3 sm:p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#183E95]" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Байршил, хороолол, барилга, гарчиг..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none ring-[#183E95]/20 placeholder:text-slate-400 focus:border-[#183E95] focus:ring-2"
                  />
                </div>

                {propertyTypes.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Төрөл
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {propertyTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            const next =
                              propertyType === type.value ? undefined : type.value;
                            setPropertyType(next);
                            if (next === "land") setRoomCount(undefined);
                          }}
                          className={chipClass(propertyType === type.value)}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {!isLandSearch ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Өрөө
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ROOM_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setRoomCount(roomCount === opt.value ? undefined : opt.value)
                          }
                          className={chipClass(roomCount === opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {popularLocations.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Алдартай байршил
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {popularLocations.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => searchByLocation(name)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-[#183E95]/40 hover:text-[#183E95]"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#183E95] text-sm font-semibold text-white shadow transition hover:bg-[#152f70]"
                >
                  <Search className="h-4 w-4" />
                  Хайх
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
