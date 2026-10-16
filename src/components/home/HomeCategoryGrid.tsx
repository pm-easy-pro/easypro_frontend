import Image from "next/image";
import Link from "next/link";

import type { FilterOption } from "@/types";

const CATEGORY_IMAGES: Record<string, string> = {
  apartment:
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
  house:
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
  office:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  commercial:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
  land:
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80";

const FALLBACK_TYPES: FilterOption[] = [
  { value: "apartment", label: "Орон сууц" },
  { value: "house", label: "Гэр" },
  { value: "office", label: "Оффис" },
  { value: "commercial", label: "Үйлчилгээний байр" },
  { value: "land", label: "Газар" },
];

interface HomeCategoryGridProps {
  propertyTypes: FilterOption[];
}

export function HomeCategoryGrid({ propertyTypes }: HomeCategoryGridProps) {
  const types = propertyTypes.length > 0 ? propertyTypes : FALLBACK_TYPES;

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-10 md:px-6 md:py-14">
      <h2 className="mb-5 text-xl font-bold text-slate-900 md:text-2xl">Ангиллаар хайх</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
        {types.map((type) => {
          const href =
            type.value === "land" ? "/land" : `/properties?property_type=${type.value}`;
          const image = CATEGORY_IMAGES[type.value] || FALLBACK_IMAGE;
          return (
            <Link
              key={type.value}
              href={href}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200 shadow-sm ring-1 ring-slate-200/80 transition hover:shadow-md hover:ring-[#183E95]/30"
            >
              <Image
                src={image}
                alt={type.label}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <p className="absolute bottom-0 left-0 right-0 p-3 text-sm font-semibold text-white md:text-base">
                {type.label}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
