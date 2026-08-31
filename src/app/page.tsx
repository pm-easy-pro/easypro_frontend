import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, Trees } from "lucide-react";

import { HomeCategoryGrid } from "@/components/home/HomeCategoryGrid";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeMapSection } from "@/components/home/HomeMapSection";
import { HomeValueProps } from "@/components/home/HomeValueProps";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { fetchFilterOptions, fetchProperties } from "@/lib/api";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80";

export default async function HomePage() {
  const [featured, latest, landListings, options] = await Promise.all([
    fetchProperties({ listing_type: "sell", ordering: "most_viewed", exclude_property_type: "land" }),
    fetchProperties({ ordering: "newest", exclude_property_type: "land" }),
    fetchProperties({ property_type: "land", ordering: "newest" }),
    fetchFilterOptions(),
  ]);

  const latestProperties = latest.results.slice(0, 8);
  const topProperties = featured.results.slice(0, 8);
  const landProperties = landListings.results.slice(0, 8);
  const mapProperties = [...latest.results, ...landListings.results].slice(0, 12);

  const popularLocations = Array.from(
    new Set(
      options.locations.flatMap((loc) =>
        loc.aliases.length > 0
          ? loc.aliases.map((a) => a.name)
          : [loc.official_address],
      ),
    ),
  ).slice(0, 8);

  return (
    <div className="bg-[#f4f6f9]">
      {/* Hero — search-first */}
      <section className="relative overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0a2558]/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#183E95]/40 via-transparent to-[#0f2d6e]/90" />

        <div className="relative mx-auto max-w-[1600px] px-4 py-14 md:px-6 md:py-20 lg:py-24">
          <HomeHero
            listingTypes={options.listing_types}
            propertyTypes={options.property_types}
            popularLocations={popularLocations}
            listingCount={latest.count || featured.count}
            locationCount={options.locations.length}
          />
        </div>
      </section>

      {/* Mobile stats */}
      <section className="border-b border-slate-200 bg-white lg:hidden">
        <div className="mx-auto grid max-w-[1600px] grid-cols-3 divide-x divide-slate-100 px-4 py-4">
          <div className="text-center">
            <p className="text-lg font-bold text-[#183E95]">{(latest.count || featured.count)}+</p>
            <p className="text-xs text-slate-500">Зар</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#183E95]">{options.locations.length}</p>
            <p className="text-xs text-slate-500">Байршил</p>
          </div>
          <div className="text-center">
            <Link href="/properties" className="block">
              <p className="text-lg font-bold text-[#183E95]">→</p>
              <p className="text-xs text-slate-500">Хайх</p>
            </Link>
          </div>
        </div>
      </section>

      <HomeCategoryGrid propertyTypes={options.property_types} />

      <section className="mx-auto max-w-[1600px] px-4 pb-12 md:px-6 md:pb-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
              Газар
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              Бодит газрын зарууд
            </h2>
            <p className="mt-2 text-slate-500">
              {landListings.count.toLocaleString("mn-MN")} идэвхтэй газар зар
            </p>
          </div>
          <Link
            href="/land?ordering=newest"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-200 transition hover:shadow-md"
          >
            Бүх газар үзэх
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {landProperties.length > 0 ? (
          <PropertyGrid properties={landProperties} />
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

      {/* Newest listings */}
      <section className="mx-auto max-w-[1600px] px-4 pb-12 md:px-6 md:pb-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#183E95]">
              Шинэ зарууд
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              Хамгийн сүүлд нэмэгдсэн
            </h2>
            <p className="mt-2 text-slate-500">Саяхан нийтлэгдсэн зарууд</p>
          </div>
          <Link
            href="/properties?ordering=newest"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#183E95] shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
          >
            Бүх шинэ зар
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {latestProperties.length > 0 ? (
          <PropertyGrid properties={latestProperties} />
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
      <section className="mx-auto max-w-[1600px] px-4 pb-16 md:px-6 md:pb-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#183E95]">
              Онцлох зарууд
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              Их үзсэн, шалгагдсан зарууд
            </h2>
            <p className="mt-2 flex items-center gap-2 text-slate-500">
              <ShieldCheck className="h-4 w-4 text-[#183E95]" />
              VIP зар жагсаалтын дээд талд
            </p>
          </div>
          <Link
            href="/properties?listing_type=sell&ordering=most_viewed"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#183E95] shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
          >
            Бүх зар үзэх
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {topProperties.length > 0 ? (
          <PropertyGrid properties={topProperties} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">Одоогоор онцлох зар байхгүй байна</p>
          </div>
        )}
      </section>

      <HomeMapSection properties={mapProperties} />

      {/* District quick links */}
      <section className="mx-auto max-w-[1600px] px-4 pb-16 md:px-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Дүүргээр хайх</h2>
          <p className="mt-1 text-slate-500">Таны сонирхож буй бүсийг сонгоно уу</p>
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
