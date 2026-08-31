"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { PropertyFilters } from "@/types";

export type CatalogMode = "real_estate" | "land";

interface UsePropertyFiltersOptions {
  basePath?: string;
  catalog?: CatalogMode;
}

export function usePropertyFilters(options: UsePropertyFiltersOptions = {}) {
  const { basePath = "/properties", catalog = "real_estate" } = options;
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo<PropertyFilters>(() => {
    const params: PropertyFilters = {};
    searchParams.forEach((value, key) => {
      if (value) (params as Record<string, string>)[key] = value;
    });
    if (catalog === "land" && !params.property_type) {
      params.property_type = "land";
    }
    return params;
  }, [searchParams, catalog]);

  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  useEffect(() => {
    const loc = searchParams.get("locations");
    setSelectedLocations(loc ? loc.split(",").filter(Boolean) : []);
  }, [searchParams]);

  const setFilters = useCallback(
    (next: Partial<PropertyFilters>, replace = false) => {
      const base = replace ? {} : { ...filters };
      const merged = { ...base, ...next };
      if (catalog === "land") {
        merged.property_type = "land";
      } else if (merged.property_type === "land") {
        delete merged.property_type;
      }
      Object.keys(merged).forEach((key) => {
        const val = merged[key as keyof PropertyFilters];
        if (val === undefined || val === "" || val === null) {
          delete merged[key as keyof PropertyFilters];
        }
      });
      const params = new URLSearchParams();
      Object.entries(merged).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params.set(k, String(v));
      });
      router.push(`${basePath}?${params.toString()}`);
    },
    [filters, router, basePath, catalog],
  );

  const resetFilters = useCallback(() => {
    setSelectedLocations([]);
    const listing = filters.listing_type;
    if (catalog === "land") {
      router.push(listing ? `${basePath}?listing_type=${listing}&property_type=land` : `${basePath}?property_type=land`);
      return;
    }
    router.push(listing ? `${basePath}?listing_type=${listing}` : basePath);
  }, [filters.listing_type, router, basePath, catalog]);

  const applyLocations = useCallback(
    (locations: string[]) => {
      setSelectedLocations(locations);
      setFilters({
        locations: locations.length ? locations.join(",") : undefined,
        page: undefined,
      });
    },
    [setFilters],
  );

  return {
    filters,
    selectedLocations,
    setFilters,
    resetFilters,
    applyLocations,
    setSelectedLocations,
    catalog,
    basePath,
  };
}
