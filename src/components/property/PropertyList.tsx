"use client";

import { Empty, Pagination, Spin } from "antd";

import { PropertyGrid } from "@/components/property/PropertyGrid";
import { PropertyRowCard } from "@/components/property/PropertyRowCard";
import type { ViewMode } from "@/components/search/ViewModeToggle";
import type { Property } from "@/types";

interface PropertyListProps {
  properties: Property[];
  loading?: boolean;
  total: number;
  page: number;
  pageSize?: number;
  viewMode?: ViewMode;
  onPageChange: (page: number) => void;
}

export function PropertyList({
  properties,
  loading,
  total,
  page,
  pageSize = 12,
  viewMode = "list",
  onPageChange,
}: PropertyListProps) {
  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Spin size="large" />
        <p className="text-sm text-slate-500">Зарууд ачааллаж байна...</p>
      </div>
    );
  }

  if (!properties.length) {
    return (
      <Empty
        description="Таны шүүлтүүрт тохирох зар олдсонгүй"
        className="rounded-2xl border border-dashed border-slate-200 bg-white py-20"
      />
    );
  }

  return (
    <div className="w-full space-y-4">
      {viewMode === "list" ? (
        <div className="space-y-3">
          {properties.map((property) => (
            <PropertyRowCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <PropertyGrid properties={properties} />
      )}

      <div className="flex justify-center rounded-2xl border-t border-slate-100 bg-white py-6">
        <Pagination
          current={page}
          total={total}
          pageSize={pageSize}
          onChange={onPageChange}
          showSizeChanger={false}
          showTotal={(t) => `Нийт ${t} зар`}
        />
      </div>
    </div>
  );
}
