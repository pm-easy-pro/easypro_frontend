import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { AgentCard } from "@/components/property/AgentCard";
import { AmenityPinProvider } from "@/components/property/AmenityPinContext";
import { NearbyAmenities } from "@/components/property/NearbyAmenities";
import { PropertyDetailHeader } from "@/components/property/PropertyDetailHeader";
import { PropertyDetailMap } from "@/components/property/PropertyDetailMap";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertyMobileCta } from "@/components/property/PropertyMobileCta";
import { PropertyOfferPanel } from "@/components/property/PropertyOfferPanel";
import { PropertyQuickStats } from "@/components/property/PropertyQuickStats";
import { PropertySpecifications } from "@/components/property/PropertySpecifications";
import { RelatedProperties } from "@/components/property/RelatedProperties";
import { fetchProperty } from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;

  let property;
  try {
    property = await fetchProperty(id);
  } catch {
    notFound();
  }

  const locationLabel =
    property.unofficial_addresses?.[0] || property.official_address;
  const related = property.related_properties || [];
  const mapProperties = [property, ...related];

  return (
    <AmenityPinProvider>
      <div className="bg-[#f4f6f9]">
        <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-6 md:pb-16 md:pt-8">
          <nav className="mb-5 flex items-center gap-1.5 text-sm text-slate-500" aria-label="Breadcrumb">
            <Link
              href={property.property_type === "land" ? "/land" : "/properties"}
              className="transition hover:text-[#183E95]"
            >
              {property.property_type === "land" ? "Газар" : "Үл хөдлөх"}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="truncate font-medium text-slate-700">{property.title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] xl:gap-10">
            {/* Left: gallery → title → details */}
            <div className="min-w-0 space-y-8">
              <PropertyGallery images={property.images} title={property.title} />

              <PropertyDetailHeader property={property} />
              <PropertyQuickStats property={property} />
              <PropertySpecifications property={property} />

              <NearbyAmenities
                latitude={property.latitude}
                longitude={property.longitude}
              />

              <RelatedProperties properties={related} locationLabel={locationLabel} />

              <section id="property-location-map-mobile" className="lg:hidden">
                <h2 className="mb-3 text-lg font-bold text-slate-900">Газрын зураг</h2>
                <PropertyDetailMap
                  properties={mapProperties}
                  primaryPropertyId={property.id}
                  className="h-80 w-full overflow-hidden rounded-2xl"
                />
              </section>
            </div>

            {/* Right: price + contact + map */}
            <aside className="min-w-0">
              <div className="space-y-5 lg:sticky lg:top-24">
                <PropertyOfferPanel property={property}>
                  <AgentCard
                    embedded
                    agent={property.agent_detail}
                    poster={property.posted_by_detail}
                    listingOwnerType={property.listing_owner_type}
                  />
                </PropertyOfferPanel>

                <div
                  id="property-location-map"
                  className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:block"
                >
                  <div className="border-b border-slate-100 px-5 py-3">
                    <h2 className="text-sm font-bold text-slate-900">Байршил</h2>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {property.official_address}
                    </p>
                  </div>
                  <PropertyDetailMap
                    properties={mapProperties}
                    primaryPropertyId={property.id}
                    className="h-85 w-full"
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>

        <PropertyMobileCta
          property={property}
          agent={property.agent_detail}
          poster={property.posted_by_detail}
          listingOwnerType={property.listing_owner_type}
        />
      </div>
    </AmenityPinProvider>
  );
}
