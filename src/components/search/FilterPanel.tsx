"use client";

import { Button, Select } from "antd";
import { MapPin, RotateCcw, SlidersHorizontal } from "lucide-react";

import { AreaRangeInput } from "@/components/search/AreaRangeInput";
import { PaymentTermsSelect } from "@/components/search/PaymentTermsSelect";
import { PriceRangeSelect } from "@/components/search/PriceRangeSelect";
import type { FilterOptions, PropertyFilters } from "@/types";

interface FilterPanelProps {
  options: FilterOptions;
  filters: PropertyFilters;
  selectedLocationCount: number;
  onOpenLocation: () => void;
  onChange: (next: Partial<PropertyFilters>) => void;
  onReset: () => void;
  compact?: boolean;
  hidePropertyType?: boolean;
  hideRoomCount?: boolean;
  hidePaymentTerms?: boolean;
}

export function FilterPanel({
  options,
  filters,
  selectedLocationCount,
  onOpenLocation,
  onChange,
  onReset,
  compact,
  hidePropertyType,
  hideRoomCount,
  hidePaymentTerms,
}: FilterPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <SlidersHorizontal className="h-4 w-4 text-[#183E95]" />
          Нэмэлт шүүлтүүр
        </div>
        <Button type="link" size="small" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={onReset}>
          Цэвэрлэх
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Байршил</label>
          <Button block size="middle" onClick={onOpenLocation} icon={<MapPin className="h-4 w-4" />}>
            {selectedLocationCount > 0
              ? `${selectedLocationCount} сонгосон`
              : "Байршил сонгох"}
          </Button>
        </div>
        {!hidePaymentTerms ? (
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-slate-500">Төлбөрийн нөхцөл</label>
          <PaymentTermsSelect
            compact={false}
            options={options.payment_terms}
            value={filters.payment_terms}
            onChange={(payment_terms) => onChange({ payment_terms, page: undefined })}
          />
        </div>
        ) : null}
        {!hidePropertyType ? (
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Төрөл</label>
          <Select
            allowClear
            placeholder="Бүгд"
            className="w-full"
            value={filters.property_type}
            onChange={(v) => onChange({ property_type: v, page: undefined })}
            options={options.property_types}
          />
        </div>
        ) : null}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Нөхцөл</label>
          <Select
            allowClear
            placeholder="Бүгд"
            className="w-full"
            value={filters.condition}
            onChange={(v) => onChange({ condition: v, page: undefined })}
            options={options.conditions}
          />
        </div>
        {!hideRoomCount ? (
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Өрөө</label>
          <Select
            allowClear
            placeholder="Бүгд"
            className="w-full"
            value={filters.room_count}
            onChange={(v) => onChange({ room_count: v, page: undefined })}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}+ өрөө` }))}
          />
        </div>
        ) : null}
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-slate-500">Үнэ (₮)</label>
          <PriceRangeSelect
            size="middle"
            min={filters.price_min}
            max={filters.price_max}
            onChange={(price_min, price_max) =>
              onChange({ price_min, price_max, page: undefined })
            }
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-slate-500">Талбай (м²)</label>
          <AreaRangeInput
            min={filters.area_min}
            max={filters.area_max}
            onChange={(area_min, area_max) => onChange({ area_min, area_max, page: undefined })}
          />
        </div>
      </div>
    </div>
  );
}
