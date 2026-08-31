"use client";

import { useEffect, useMemo, useState } from "react";
import {
  APIProvider,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import {
  Baby,
  Bus,
  Coffee,
  GraduationCap,
  Pill,
  ShoppingBag,
  Store,
} from "lucide-react";

import { useAmenityPin } from "@/components/property/AmenityPinContext";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const RADIUS_M = 2000;
const PER_CATEGORY = 5;

type AmenityCategory =
  | "school"
  | "kindergarten"
  | "shopping"
  | "cafe"
  | "pharmacy"
  | "bus_stop";

interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  distanceM: number;
  rating?: number;
  category: AmenityCategory;
  lat: number;
  lng: number;
}

interface NearbyAmenitiesProps {
  latitude?: string | number | null;
  longitude?: string | number | null;
  className?: string;
}

const CATEGORY_META: Record<
  AmenityCategory,
  { label: string; icon: typeof GraduationCap; color: string }
> = {
  school: {
    label: "Сургууль",
    icon: GraduationCap,
    color: "text-[#183E95] bg-blue-50",
  },
  kindergarten: {
    label: "Цэцэрлэг",
    icon: Baby,
    color: "text-amber-700 bg-amber-50",
  },
  shopping: {
    label: "Худалдаа, үйлчилгээ",
    icon: ShoppingBag,
    color: "text-emerald-700 bg-emerald-50",
  },
  cafe: {
    label: "Кофе шоп",
    icon: Coffee,
    color: "text-orange-700 bg-orange-50",
  },
  pharmacy: {
    label: "Эмийн сан",
    icon: Pill,
    color: "text-rose-700 bg-rose-50",
  },
  bus_stop: {
    label: "Автобусны буудал",
    icon: Bus,
    color: "text-sky-700 bg-sky-50",
  },
};

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

function formatDistance(m: number) {
  if (m < 1000) return `${m} м`;
  return `${(m / 1000).toFixed(1)} км`;
}

function searchNearby(
  service: google.maps.places.PlacesService,
  request: google.maps.places.PlaceSearchRequest,
): Promise<google.maps.places.PlaceResult[]> {
  return new Promise((resolve) => {
    service.nearbySearch(request, (results, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        results
      ) {
        resolve(results);
      } else {
        resolve([]);
      }
    });
  });
}

function NearbyAmenitiesInner({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const placesLib = useMapsLibrary("places");
  const amenityPin = useAmenityPin();
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<AmenityCategory | "all">("all");
  const selectedId = amenityPin?.selectedPin?.id ?? null;

  useEffect(() => {
    if (!placesLib) return;

    let cancelled = false;
    const container = document.createElement("div");
    const service = new placesLib.PlacesService(container);
    const location = { lat: latitude, lng: longitude };

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const [schools, kindergartens, shopping, cafes, pharmacies, busStops] =
          await Promise.all([
            searchNearby(service, {
              location,
              radius: RADIUS_M,
              type: "school",
            }),
            searchNearby(service, {
              location,
              radius: RADIUS_M,
              keyword: "цэцэрлэг kindergarten",
              type: "school",
            }),
            searchNearby(service, {
              location,
              radius: RADIUS_M,
              type: "shopping_mall",
            }),
            searchNearby(service, {
              location,
              radius: RADIUS_M,
              type: "cafe",
            }),
            searchNearby(service, {
              location,
              radius: RADIUS_M,
              type: "pharmacy",
            }),
            searchNearby(service, {
              location,
              radius: RADIUS_M,
              type: "bus_station",
            }),
          ]);

        const shoppingExtra = await searchNearby(service, {
          location,
          radius: RADIUS_M,
          type: "supermarket",
        });

        const mapResult = (
          results: google.maps.places.PlaceResult[],
          category: AmenityCategory,
        ): NearbyPlace[] =>
          results
            .filter((r) => r.place_id && r.name && r.geometry?.location)
            .map((r) => {
              const loc = r.geometry!.location!;
              const lat = typeof loc.lat === "function" ? loc.lat() : Number(loc.lat);
              const lng = typeof loc.lng === "function" ? loc.lng() : Number(loc.lng);
              return {
                id: r.place_id!,
                name: r.name!,
                address: r.vicinity || r.formatted_address || "",
                distanceM: haversineMeters(latitude, longitude, lat, lng),
                rating: r.rating,
                category,
                lat,
                lng,
              };
            })
            .sort((a, b) => a.distanceM - b.distanceM)
            .slice(0, PER_CATEGORY);

        // Kindergarten: prefer names mentioning цэцэрлэг / kindergarten / preschool
        const kinderFiltered = kindergartens.filter((r) => {
          const n = (r.name || "").toLowerCase();
          return (
            n.includes("цэцэрлэг") ||
            n.includes("kindergarten") ||
            n.includes("preschool") ||
            n.includes("ясли")
          );
        });
        const kinderSource =
          kinderFiltered.length > 0 ? kinderFiltered : kindergartens;

        // Deduplicate shopping mall + supermarket
        const shoppingMerged = [...shopping, ...shoppingExtra];
        const seen = new Set<string>();
        const shoppingUnique = shoppingMerged.filter((r) => {
          if (!r.place_id || seen.has(r.place_id)) return false;
          seen.add(r.place_id);
          return true;
        });

        const all = [
          ...mapResult(schools, "school"),
          ...mapResult(kinderSource, "kindergarten"),
          ...mapResult(shoppingUnique, "shopping"),
          ...mapResult(cafes, "cafe"),
          ...mapResult(pharmacies, "pharmacy"),
          ...mapResult(busStops, "bus_stop"),
        ].sort((a, b) => a.distanceM - b.distanceM);

        if (!cancelled) setPlaces(all);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [placesLib, latitude, longitude]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return places;
    return places.filter((p) => p.category === activeTab);
  }, [places, activeTab]);

  const counts = useMemo(
    () => ({
      all: places.length,
      school: places.filter((p) => p.category === "school").length,
      kindergarten: places.filter((p) => p.category === "kindergarten").length,
      shopping: places.filter((p) => p.category === "shopping").length,
      cafe: places.filter((p) => p.category === "cafe").length,
      pharmacy: places.filter((p) => p.category === "pharmacy").length,
      bus_stop: places.filter((p) => p.category === "bus_stop").length,
    }),
    [places],
  );

  const tabs: { key: AmenityCategory | "all"; label: string }[] = [
    { key: "all", label: "Бүгд" },
    { key: "school", label: "Сургууль" },
    { key: "kindergarten", label: "Цэцэрлэг" },
    { key: "shopping", label: "Худалдаа" },
    { key: "cafe", label: "Кофе шоп" },
    { key: "pharmacy", label: "Эмийн сан" },
    { key: "bus_stop", label: "Автобус" },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white px-5 py-6 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 md:text-xl">Ойролцоох байршил</h2>
          <p className="mt-1 text-sm text-slate-500">
            {RADIUS_M / 1000} км радиус дахь сургууль, цэцэрлэг, худалдаа, кофе шоп, эмийн сан,
            автобусны буудал
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-[#183E95] text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 opacity-70">{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Ойролцоох газрын мэдээлэл ачаалахад алдаа гарлаа. Places API идэвхтэй эсэхийг шалгана уу.
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Ойролцоо хайлтад тохирох газар олдсонгүй
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {filtered.map((place) => {
            const meta = CATEGORY_META[place.category];
            const Icon =
              place.category === "shopping" ? Store : meta.icon;
            const isSelected = selectedId === place.id;
            return (
              <li key={`${place.category}-${place.id}`}>
                <button
                  type="button"
                  onClick={() => {
                    amenityPin?.selectPin({
                      id: place.id,
                      name: place.name,
                      address: place.address,
                      lat: place.lat,
                      lng: place.lng,
                      categoryLabel: meta.label,
                    });
                    const desktop = window.matchMedia("(min-width: 1024px)").matches;
                    const target = document.getElementById(
                      desktop ? "property-location-map" : "property-location-map-mobile",
                    );
                    target?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }}
                  className={`flex w-full items-start gap-3 py-3.5 text-left transition first:pt-0 last:pb-0 ${
                    isSelected
                      ? "-mx-2 rounded-xl bg-[#183E95]/[0.06] px-2 ring-1 ring-[#183E95]/20"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-slate-900">{place.name}</p>
                      <span className="shrink-0 text-sm font-medium text-[#183E95]">
                        {formatDistance(place.distanceM)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {place.address || meta.label}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {meta.label}
                      </span>
                      {place.rating != null && (
                        <span className="text-[11px] text-amber-600">
                          ★ {place.rating.toFixed(1)}
                        </span>
                      )}
                      {isSelected ? (
                        <span className="text-[11px] font-semibold text-[#183E95]">
                          Газрын зураг дээр
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Зураг дээр харах</span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function NearbyAmenities({
  latitude,
  longitude,
  className = "",
}: NearbyAmenitiesProps) {
  const lat = latitude != null && latitude !== "" ? Number(latitude) : NaN;
  const lng = longitude != null && longitude !== "" ? Number(longitude) : NaN;

  if (!API_KEY || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return (
    <div className={className}>
      <APIProvider apiKey={API_KEY} libraries={["places"]}>
        <NearbyAmenitiesInner latitude={lat} longitude={lng} />
      </APIProvider>
    </div>
  );
}
