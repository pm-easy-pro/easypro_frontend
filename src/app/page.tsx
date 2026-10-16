import Link from "next/link";
import { ArrowRight, Building2, Trees } from "lucide-react";

import { HomeCategoryGrid } from "@/components/home/HomeCategoryGrid";
import { HomeMapSection } from "@/components/home/HomeMapSection";
import { HomeValueProps } from "@/components/home/HomeValueProps";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { fetchFilterOptions, fetchProperties } from "@/lib/api";
import type { FilterOptions, PaginatedResponse, Property } from "@/types";

export const dynamic = "force-dynamic";

const EMPTY_PROPERTIES: PaginatedResponse<Property> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

const EMPTY_FILTER_OPTIONS: FilterOptions = {
  listing_types: [],
  property_types: [],
  conditions: [],
  districts: [],
  district_choices: [],
  payment_terms: [],
  ordering: [],
  locations: [],
};

function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{title}</h2>
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#183E95] transition hover:underline"
      >
        {linkLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  let featured = EMPTY_PROPERTIES;
  let latest = EMPTY_PROPERTIES;
  let landListings = EMPTY_PROPERTIES;
  let options = EMPTY_FILTER_OPTIONS;

  try {
    [featured, latest, landListings, options] = await Promise.all([
      fetchProperties({ listing_type: "sell", ordering: "most_viewed", exclude_property_type: "land" }),
      fetchProperties({ ordering: "newest", exclude_property_type: "land" }),
      fetchProperties({ property_type: "land", ordering: "newest" }),
      fetchFilterOptions(),
    ]);
  } catch {
    // API unreachable at build/runtime — render empty sections instead of failing the page.
  }

  const latestProperties = latest.results.slice(0, 10);
  const topProperties = featured.results.slice(0, 10);
  const landProperties = landListings.results.slice(0, 10);
  const mapProperties = [...latest.results, ...landListings.results].slice(0, 12);

  return (
    <div className="bg-[#f4f6f9]">
      {/* Newest listings — first after header */}
      <section className="mx-auto max-w-[1600px] px-4 pt-6 pb-10 md:px-6 md:pt-8 md:pb-12">
        <SectionHeader
          title="Шинэ зарууд"
          href="/properties?ordering=newest"
          linkLabel="Бүх шинэ зар"
        />

        {latestProperties.length > 0 ? (
          <PropertyGrid properties={latestProperties} columns={5} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">Одоогоор зар байхгүй байна</p>
            <Link
              href="/post-property"
              className="mt-4 inline-block font-semibold text-[#183E95] hover:underline"
            >
              Эхний зарыг нэмэх →
            </Link>
          </div>
        )}
      </section>

      {/* Featured listings */}
      <section className="mx-auto max-w-[1600px] px-4 pb-10 md:px-6 md:pb-12">
        <SectionHeader
          title="Онцлох зарууд"
          href="/properties?listing_type=sell&ordering=most_viewed"
          linkLabel="Бүх зар үзэх"
        />

        {topProperties.length > 0 ? (
          <PropertyGrid properties={topProperties} columns={5} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">Одоогоор онцлох зар байхгүй байна</p>
          </div>
        )}
      </section>

      {/* Land listings */}
      <section className="mx-auto max-w-[1600px] px-4 pb-10 md:px-6 md:pb-12">
        <SectionHeader
          title="Газрын зарууд"
          href="/land?ordering=newest"
          linkLabel="Бүх газар үзэх"
        />

        {landProperties.length > 0 ? (
          <PropertyGrid properties={landProperties} columns={5} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Trees className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">Одоогоор газар зар байхгүй байна</p>
            <Link
              href="/post-land"
              className="mt-4 inline-block font-semibold text-[#183E95] hover:underline"
            >
              Газар зар нэмэх →
            </Link>
          </div>
        )}
      </section>

      <HomeCategoryGrid propertyTypes={options.property_types} />

      <HomeMapSection properties={mapProperties} />

      {/* District quick links */}
      <section className="mx-auto max-w-[1600px] px-4 pb-16 md:px-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Дүүргээр хайх</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {options.district_choices.map((d) => (
              <Link
                key={d.value}
                href={`/properties?district=${d.value}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#183E95] hover:bg-[#183E95]/5 hover:text-[#183E95]"
              >
                {d.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HomeValueProps />
      <SiteFooter />
    </div>
  );
}
