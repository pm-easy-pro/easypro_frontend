import {
  ArrowUpDown,
  Bath,
  Building2,
  Calendar,
  Car,
  Compass,
  FileText,
  Layers,
  LayoutGrid,
  ScrollText,
  Sofa,
  Square,
  Sun,
  Trees,
  Wind,
} from "lucide-react";

import { formatArea, formatFloor, formatYesNo } from "@/lib/format";
import { getLandRightLabel, getLandUseLabel, landRightNeedsContract } from "@/lib/land-options";
import type { Property } from "@/types";

interface PropertySpecificationsProps {
  property: Property;
}

type SpecItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
};

function SpecRow({ icon: Icon, label, value }: SpecItem) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-b-0">
      <Icon className="h-4 w-4 shrink-0 text-[#183E95]/70" aria-hidden />
      <dt className="w-36 shrink-0 text-sm text-slate-500 sm:w-40">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function SpecSection({ title, items }: { title: string; items: SpecItem[] }) {
  const visible = items.filter((item) => item.value != null && item.value !== "");
  if (!visible.length) return null;

  return (
    <section>
      <h3 className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {title}
      </h3>
      <dl>
        {visible.map((item) => (
          <SpecRow key={item.label} {...item} />
        ))}
      </dl>
    </section>
  );
}

function formatContractRange(start?: string | null, end?: string | null) {
  if (!start && !end) return null;
  if (start && end) return `${start} → ${end}`;
  return start || end;
}

export function PropertySpecifications({ property }: PropertySpecificationsProps) {
  const floorLabel = formatFloor(property.floor, property.total_floor);
  const isApartment = property.property_type === "apartment";
  const isLand = property.property_type === "land";

  if (isLand) {
    const landItems: SpecItem[] = [
      {
        icon: Square,
        label: "Талбай",
        value: formatArea(property.area_m2),
      },
      {
        icon: ScrollText,
        label: "Нэгж талбар",
        value: property.parcel_number || null,
      },
      {
        icon: FileText,
        label: "Эрхийн төрөл",
        value: property.land_right_type
          ? property.land_right_type === "ownership"
            ? "Өмчлөх — хугацаагүй"
            : property.land_right_type_display || getLandRightLabel(property.land_right_type)
          : null,
      },
      {
        icon: Calendar,
        label: "Гэрээний хугацаа",
        value: landRightNeedsContract(property.land_right_type)
          ? formatContractRange(property.land_contract_start, property.land_contract_end)
          : null,
      },
      {
        icon: Trees,
        label: "Ашиглалтын төрөл",
        value:
          property.land_use_type_display ||
          getLandUseLabel(property.land_use_type) ||
          null,
      },
      {
        icon: LayoutGrid,
        label: "Төрөл",
        value: property.property_type_display,
      },
    ];

    return (
      <div className="space-y-8 rounded-2xl border border-slate-200/80 bg-white px-5 py-6 md:px-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 md:text-xl">Газрын мэдээлэл</h2>
          <p className="mt-1 text-sm text-slate-500">Талбай, эрх, ашиглалтын зориулалт</p>
        </div>
        <SpecSection title="Газар" items={landItems} />
      </div>
    );
  }

  const buildingItems: SpecItem[] = [
    {
      icon: Layers,
      label: "Давхар байрлал",
      value: floorLabel
        ? isApartment && property.total_floor
          ? `${property.floor}-р давхар · нийт ${property.total_floor}`
          : floorLabel
        : null,
    },
    {
      icon: Building2,
      label: "Барилгын төрөл",
      value: property.building_type || null,
    },
    {
      icon: LayoutGrid,
      label: "Үл хөдлөх төрөл",
      value: property.property_type_display,
    },
    {
      icon: Calendar,
      label: "Баригдсан он",
      value: property.year_built ? `${property.year_built} он` : null,
    },
    {
      icon: Sun,
      label: "Нөхцөл",
      value: property.condition_display,
    },
  ];

  const unitItems: SpecItem[] = [
    {
      icon: Square,
      label: "Талбай",
      value: formatArea(property.area_m2),
    },
    {
      icon: LayoutGrid,
      label: "Өрөөний тоо",
      value: `${property.room_count} өрөө`,
    },
    {
      icon: Wind,
      label: "Цонхны тоо",
      value: property.window_count != null ? `${property.window_count} цонх` : null,
    },
    {
      icon: Bath,
      label: "Угаалгын өрөө",
      value: property.bathroom_count != null ? `${property.bathroom_count}` : null,
    },
    {
      icon: Compass,
      label: "Харагдац",
      value: property.view_directions_display || null,
    },
  ];

  const amenityItems: SpecItem[] = [
    {
      icon: ArrowUpDown,
      label: "Лифт",
      value: formatYesNo(property.has_elevator),
    },
    {
      icon: Car,
      label: "Гараж",
      value: formatYesNo(property.garage),
    },
    {
      icon: Building2,
      label: "Тагт",
      value: formatYesNo(property.balcony),
    },
    {
      icon: Sofa,
      label: "Тавилгатай",
      value: formatYesNo(property.furnished),
    },
  ];

  return (
    <div className="space-y-8 rounded-2xl border border-slate-200/80 bg-white px-5 py-6 md:px-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 md:text-xl">Дэлгэрэнгүй мэдээлэл</h2>
        <p className="mt-1 text-sm text-slate-500">Барилга, орон сууц, тохь тух</p>
      </div>
      <div className="space-y-8">
        <SpecSection title="Барилга" items={buildingItems} />
        {(isApartment || property.window_count || (property.view_directions?.length ?? 0) > 0) && (
          <SpecSection title="Орон сууц" items={unitItems} />
        )}
        <SpecSection title="Тохь тух" items={amenityItems} />
      </div>
    </div>
  );
}
