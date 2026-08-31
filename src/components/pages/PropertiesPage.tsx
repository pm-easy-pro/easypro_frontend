"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Drawer, Modal } from "antd";
import { Filter, Map, MapPinned } from "lucide-react";

import { AdvertisementBanner } from "@/components/ads/AdvertisementBanner";
import { MapPreview } from "@/components/map/MapPreview";
import { ActiveFilterChips } from "@/components/search/ActiveFilterChips";
import { CompactFilterBar } from "@/components/search/CompactFilterBar";
import { FilterPanel } from "@/components/search/FilterPanel";
import { LocationModal } from "@/components/search/LocationModal";
import { PropertyList } from "@/components/property/PropertyList";
import { SearchHeader } from "@/components/search/SearchHeader";
import { SortDropdown } from "@/components/search/SortDropdown";
import { ViewModeToggle, type ViewMode } from "@/components/search/ViewModeToggle";
import { fetchFilterOptions, fetchProperties } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { usePropertyFilters, type CatalogMode } from "@/hooks/usePropertyFilters";
import type { FilterOptions, Property } from "@/types";

const VIEW_MODE_KEY = "easypro_view_mode";

interface PropertiesPageProps {
  catalog?: CatalogMode;
}

function formatPriceChip(min?: string, max?: string) {
  if (!min && !max) return "";
  const minLabel = min ? formatPrice(min) : "0";
  const maxLabel = max ? formatPrice(max) : "∞";
  return `${minLabel} – ${maxLabel}`;
}

export function PropertiesPage({ catalog = "real_estate" }: PropertiesPageProps) {
  const router = useRouter();
  const basePath = catalog === "land" ? "/land" : "/properties";
  const isLandCatalog = catalog === "land";
  const { filters, selectedLocations, setFilters, resetFilters, applyLocations } =
    usePropertyFilters({ basePath, catalog });
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locationOpen, setLocationOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [showMap, setShowMap] = useState(catalog === "land");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const page = Number(filters.page || 1);

  useEffect(() => {
    if (catalog === "real_estate" && filters.property_type === "land") {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (key === "property_type" || value == null || value === "") return;
        params.set(key, String(value));
      });
      const qs = params.toString();
      router.replace(qs ? `/land?${qs}` : "/land");
    }
  }, [catalog, filters, router]);

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
    if (saved === "list" || saved === "grid") setViewMode(saved);
  }, []);

  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  };

  useEffect(() => {
    fetchFilterOptions().then(setOptions).catch(console.error);
  }, []);

  const scopedOptions = useMemo<FilterOptions | null>(() => {
    if (!options) return null;
    const realEstateTypes =
      options.real_estate_types ||
      options.property_types.filter((item) => item.value !== "land");
    const landTypes =
      options.land_types || options.property_types.filter((item) => item.value === "land");
    return {
      ...options,
      property_types: isLandCatalog ? landTypes : realEstateTypes,
    };
  }, [options, isLandCatalog]);

  const queryFilters = useMemo(() => {
    if (isLandCatalog) {
      return { ...filters, property_type: "land" };
    }
    return { ...filters, exclude_property_type: "land" };
  }, [filters, isLandCatalog]);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProperties(queryFilters);
      setProperties(data.results);
      setTotal(data.count);
    } catch (error) {
      console.error(error);
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [queryFilters]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const chips = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    if (filters.search) list.push({ key: "search", label: `«${filters.search}»` });
    if (filters.payment_terms) {
      const terms = filters.payment_terms.split(",").filter(Boolean);
      terms.forEach((term, i) => {
        const opt = options?.payment_terms.find((x) => x.value === term);
        list.push({
          key: `payment-${i}`,
          label: opt?.label || term,
        });
      });
    }
    if (filters.property_type && !isLandCatalog) {
      const p = scopedOptions?.property_types.find((x) => x.value === filters.property_type);
      list.push({ key: "property_type", label: p?.label || filters.property_type });
    }
    if (!isLandCatalog && filters.room_count) {
      list.push({ key: "room_count", label: `${filters.room_count}+ өрөө` });
    }
    const priceLabel = formatPriceChip(filters.price_min, filters.price_max);
    if (priceLabel) list.push({ key: "price", label: priceLabel });
    selectedLocations.forEach((loc, i) => list.push({ key: `loc-${i}`, label: loc }));
    return list;
  }, [filters, selectedLocations, scopedOptions, isLandCatalog]);

  const handleRemoveChip = (key: string) => {
    if (key === "search") setFilters({ search: undefined });
    else if (key.startsWith("payment-")) {
      const idx = Number(key.split("-")[1]);
      const terms = (filters.payment_terms || "").split(",").filter(Boolean);
      terms.splice(idx, 1);
      setFilters({
        payment_terms: terms.length ? terms.join(",") : undefined,
      });
    }
    else if (key === "property_type") setFilters({ property_type: undefined });
    else if (key === "room_count") setFilters({ room_count: undefined });
    else if (key === "price") setFilters({ price_min: undefined, price_max: undefined });
    else if (key.startsWith("loc-")) {
      const idx = Number(key.split("-")[1]);
      applyLocations(selectedLocations.filter((_, i) => i !== idx));
    }
  };

  if (!scopedOptions) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        Ачааллаж байна...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <SearchHeader
        listingTypes={scopedOptions.listing_types.filter(
          (item) => item.value === "sell" || item.value === "rent",
        )}
        listingType={filters.listing_type || "sell"}
        search={filters.search}
        selectedLocations={selectedLocations}
        resultCount={total}
        loading={loading}
        title={isLandCatalog ? "Газар" : "Үл хөдлөх"}
        onListingTypeChange={(listing_type) => setFilters({ listing_type, page: undefined }, true)}
        onSearch={(search) => setFilters({ search: search || undefined, page: undefined })}
        onOpenLocation={() => setLocationOpen(true)}
      >
        <CompactFilterBar
          options={scopedOptions}
          filters={filters}
          hidePropertyType={isLandCatalog}
          hideRoomCount={isLandCatalog}
          hidePaymentTerms={isLandCatalog}
          onOpenAdvanced={() => setFilterOpen(true)}
          onChange={(next) => setFilters(next)}
        />
      </SearchHeader>

      <div className="mx-auto max-w-[1600px] px-3 py-3 md:px-6">
        {chips.length > 0 && (
          <div className="mb-2 rounded-xl bg-white px-3 py-2 shadow-sm">
            <ActiveFilterChips
              chips={chips}
              onRemove={handleRemoveChip}
              onClearAll={resetFilters}
            />
          </div>
        )}

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            {loading ? "..." : total.toLocaleString("mn-MN")}
            <span className="ml-1 font-normal text-slate-500">
              {isLandCatalog ? "газар" : "зар"}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <ViewModeToggle value={viewMode} onChange={handleViewMode} />
            <Button
              type={showMap ? "primary" : "default"}
              size="small"
              icon={<MapPinned className="h-3.5 w-3.5" />}
              onClick={() => setShowMap((v) => !v)}
              className="!hidden !rounded-lg lg:!inline-flex"
            >
              Газрын зураг
            </Button>
            <SortDropdown
              options={scopedOptions.ordering}
              value={filters.ordering}
              onChange={(ordering) => setFilters({ ordering, page: undefined })}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_480px] xl:grid-cols-[minmax(0,1fr)_560px]">
          <PropertyList
            properties={properties}
            loading={loading}
            total={total}
            page={page}
            viewMode={viewMode}
            onPageChange={(p) => setFilters({ page: p })}
          />
          <div className="hidden lg:block">
            <div className="sticky top-[168px]">
              {showMap ? (
                <MapPreview
                  properties={properties}
                  className="h-[calc(100vh-180px)] min-h-[480px] w-full"
                />
              ) : (
                <AdvertisementBanner
                  className="min-h-[480px]"
                  href={isLandCatalog ? "/post-land" : "/post-property"}
                  label={isLandCatalog ? "Газар зар нэмэх" : "Зар нэмэх"}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <LocationModal
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        locations={scopedOptions.locations}
        selected={selectedLocations}
        onApply={applyLocations}
      />

      <Drawer
        title="Бусад шүүлтүүр"
        placement="right"
        width={360}
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
      >
        <FilterPanel
          options={scopedOptions}
          filters={filters}
          selectedLocationCount={selectedLocations.length}
          hidePropertyType={isLandCatalog}
          hideRoomCount={isLandCatalog}
          hidePaymentTerms={isLandCatalog}
          onOpenLocation={() => {
            setFilterOpen(false);
            setLocationOpen(true);
          }}
          onChange={(next) => setFilters(next)}
          onReset={resetFilters}
          compact
        />
      </Drawer>

      <Modal open={mapOpen} onCancel={() => setMapOpen(false)} footer={null} width="100%" centered>
        <MapPreview properties={properties} className="h-[70vh]" />
      </Modal>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex gap-2 border-t border-slate-200 bg-white/95 p-2 backdrop-blur lg:hidden">
        <Button block size="middle" icon={<Filter />} onClick={() => setFilterOpen(true)} className="!rounded-lg">
          Шүүлтүүр
        </Button>
        <Button block size="middle" icon={<Map />} onClick={() => setMapOpen(true)} className="!rounded-lg">
          Газрын зураг
        </Button>
      </div>
    </div>
  );
}
