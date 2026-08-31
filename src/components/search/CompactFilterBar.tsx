"use client";

import { Button, Select } from "antd";
import { SlidersHorizontal } from "lucide-react";

import { PaymentTermsSelect } from "@/components/search/PaymentTermsSelect";
import {
  compactSelectClass,
  PriceRangeSelect,
} from "@/components/search/PriceRangeSelect";
import type { FilterOptions, PropertyFilters } from "@/types";

interface CompactFilterBarProps {
  options: FilterOptions;
  filters: PropertyFilters;
  onOpenAdvanced: () => void;
  onChange: (next: Partial<PropertyFilters>) => void;
  hidePropertyType?: boolean;
  hideRoomCount?: boolean;
  hidePaymentTerms?: boolean;
}

const ROOM_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

const selectClass = compactSelectClass;

export function CompactFilterBar({
  options,
  filters,
  onOpenAdvanced,
  onChange,
  hidePropertyType,
  hideRoomCount,
  hidePaymentTerms,
}: CompactFilterBarProps) {
  const landMode = hidePropertyType && hideRoomCount;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-2 py-1.5">
      <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center">
        <div
          className={`grid flex-1 gap-1.5 ${
            landMode
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
              : hidePropertyType && hideRoomCount
                ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5"
          }`}
        >
          {!hidePropertyType ? (
            <Select
              allowClear
              placeholder="Төрөл"
              className={selectClass}
              value={filters.property_type}
              onChange={(v) => onChange({ property_type: v, page: undefined })}
              options={options.property_types}
            />
          ) : null}

          {!hideRoomCount ? (
            <Select
              allowClear
              placeholder="Өрөө"
              className={selectClass}
              value={filters.room_count}
              onChange={(v) => onChange({ room_count: v, page: undefined })}
              options={ROOM_OPTIONS}
            />
          ) : null}

          {!hidePaymentTerms ? (
            <PaymentTermsSelect
              options={options.payment_terms}
              value={filters.payment_terms}
              onChange={(payment_terms) => onChange({ payment_terms, page: undefined })}
            />
          ) : null}

          <div className={`flex min-h-8 items-center ${landMode ? "col-span-1 sm:col-span-2" : "col-span-2 sm:col-span-2"}`}>
            <PriceRangeSelect
              compact
              min={filters.price_min}
              max={filters.price_max}
              onChange={(price_min, price_max) =>
                onChange({ price_min, price_max, page: undefined })
              }
            />
          </div>
        </div>

        <Button
          size="small"
          icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
          onClick={onOpenAdvanced}
          className="!h-8 shrink-0 !rounded-lg !text-xs"
        >
          Бусад
        </Button>
      </div>
    </div>
  );
}
