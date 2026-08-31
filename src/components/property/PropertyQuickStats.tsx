import { Bath, BedDouble, Calendar, FileText, Layers, Maximize2, ScrollText, Trees } from "lucide-react";

import { formatArea, formatFloor, isLandProperty } from "@/lib/format";
import { getLandRightLabel, getLandUseLabel, landRightNeedsContract } from "@/lib/land-options";
import type { Property } from "@/types";

interface PropertyQuickStatsProps {
  property: Property;
}

export function PropertyQuickStats({ property }: PropertyQuickStatsProps) {
  const floorLabel = formatFloor(property.floor, property.total_floor);
  const isLand = isLandProperty(property);

  const items = isLand
    ? [
        { icon: Maximize2, label: "Талбай", value: formatArea(property.area_m2) },
        property.parcel_number
          ? { icon: ScrollText, label: "Нэгж талбар", value: property.parcel_number }
          : null,
        property.land_right_type
          ? {
              icon: FileText,
              label: "Эрхийн төрөл",
              value:
                property.land_right_type === "ownership"
                  ? "Өмчлөх"
                  : property.land_right_type_display || getLandRightLabel(property.land_right_type),
            }
          : null,
        landRightNeedsContract(property.land_right_type) &&
        (property.land_contract_start || property.land_contract_end)
          ? {
              icon: Calendar,
              label: "Гэрээ",
              value: [property.land_contract_start, property.land_contract_end]
                .filter(Boolean)
                .join(" → "),
            }
          : null,
        property.land_use_type
          ? {
              icon: Trees,
              label: "Ашиглалт",
              value: property.land_use_type_display || getLandUseLabel(property.land_use_type),
            }
          : null,
      ]
    : [
        { icon: BedDouble, label: "Өрөө", value: `${property.room_count}` },
        { icon: Maximize2, label: "Талбай", value: formatArea(property.area_m2) },
        floorLabel ? { icon: Layers, label: "Давхар", value: floorLabel } : null,
        property.bathroom_count != null
          ? { icon: Bath, label: "Угаалга", value: `${property.bathroom_count}` }
          : null,
        property.year_built
          ? { icon: Calendar, label: "Он", value: `${property.year_built}` }
          : null,
      ];

  const visible = items.filter(Boolean) as {
    icon: typeof BedDouble;
    label: string;
    value: string;
  }[];

  if (!visible.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
        {visible.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
            <Icon className="h-5 w-5 shrink-0 text-[#183E95]" aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className="truncate text-base font-semibold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
