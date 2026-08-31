"use client";

import { useEffect, useState } from "react";
import { Button } from "antd";

import { ListingTypeTabs } from "@/components/search/ListingTypeTabs";
import { SearchLocationBar } from "@/components/search/SearchLocationBar";
import type { FilterOption } from "@/types";

interface SearchHeaderProps {
  listingTypes: FilterOption[];
  listingType?: string;
  search?: string;
  selectedLocations?: string[];
  resultCount?: number;
  loading?: boolean;
  title?: string;
  onListingTypeChange: (value: string) => void;
  onSearch: (value: string) => void;
  onOpenLocation: () => void;
  sticky?: boolean;
  children?: React.ReactNode;
}

export function SearchHeader({
  listingTypes,
  listingType,
  search,
  selectedLocations = [],
  resultCount,
  loading,
  onListingTypeChange,
  onSearch,
  onOpenLocation,
  sticky = true,
  children,
}: SearchHeaderProps) {
  const [query, setQuery] = useState(search || "");

  useEffect(() => {
    setQuery(search || "");
  }, [search]);

  return (
    <section
      className={`${sticky ? "sticky top-14 z-40 md:top-16" : ""} border-b border-slate-200/80 bg-white`}
    >
      <div className="mx-auto max-w-[1600px] space-y-2 px-3 py-2 md:px-6 md:py-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ListingTypeTabs
            compact
            options={listingTypes}
            value={listingType || "sell"}
            onChange={onListingTypeChange}
          />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <SearchLocationBar
              query={query}
              onQueryChange={setQuery}
              onSearch={() => onSearch(query)}
              selectedLocations={selectedLocations}
              onOpenLocation={onOpenLocation}
              resultCount={resultCount}
              loading={loading}
            />
            <Button
              type="primary"
              size="middle"
              className="!hidden !h-9 shrink-0 !rounded-xl !px-4 sm:!inline-flex"
              onClick={() => onSearch(query)}
            >
              Хайх
            </Button>
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}
