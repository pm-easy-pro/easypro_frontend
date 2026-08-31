"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { APIProvider, Map, Marker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Loader2, MapPin } from "lucide-react";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export interface LatLng {
  lat: number;
  lng: number;
}

export type GeocodeStatus = "idle" | "searching" | "found" | "not_found";

interface LocationPickerProps {
  value?: LatLng | null;
  center?: LatLng;
  /** Debounced address text (e.g. complex name) — geocodes and pins the map */
  searchQuery?: string;
  onChange: (pos: LatLng) => void;
  onGeocodeStatus?: (status: GeocodeStatus) => void;
  className?: string;
}

function MapClickHandler({ onPick }: { onPick: (pos: LatLng) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      onPick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onPick]);

  return null;
}

function Recenter({
  target,
  zoom,
}: {
  target: LatLng;
  zoom?: number;
}) {
  const map = useMap();
  const { lat, lng } = target;
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat, lng });
    if (zoom != null) {
      map.setZoom(zoom);
    }
  }, [map, lat, lng, zoom]);
  return null;
}

function EnsureMapType({ mapTypeId }: { mapTypeId: string }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.setMapTypeId(mapTypeId);
  }, [map, mapTypeId]);
  return null;
}

function AddressGeocoder({
  searchQuery,
  biasCenter,
  onFound,
  onStatus,
}: {
  searchQuery?: string;
  biasCenter?: LatLng;
  onFound: (pos: LatLng) => void;
  onStatus?: (status: GeocodeStatus) => void;
}) {
  const geocoding = useMapsLibrary("geocoding");
  const lastQuery = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const biasLat = biasCenter?.lat;
  const biasLng = biasCenter?.lng;

  useEffect(() => {
    if (!geocoding) return;

    const query = (searchQuery || "").trim();
    if (query.length < 3) {
      onStatus?.("idle");
      lastQuery.current = "";
      return;
    }

    if (query === lastQuery.current) return;

    if (timer.current) clearTimeout(timer.current);
    onStatus?.("searching");

    timer.current = setTimeout(() => {
      lastQuery.current = query;
      const geocoder = new geocoding.Geocoder();

      const request: google.maps.GeocoderRequest = {
        address: query,
        componentRestrictions: { country: "MN" },
        region: "mn",
      };

      if (biasLat != null && biasLng != null) {
        request.bounds = new google.maps.LatLngBounds(
          { lat: biasLat - 0.12, lng: biasLng - 0.18 },
          { lat: biasLat + 0.12, lng: biasLng + 0.18 },
        );
      }

      geocoder.geocode(request, (results, status) => {
        if (status === "OK" && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          onFound({
            lat: Number(loc.lat().toFixed(6)),
            lng: Number(loc.lng().toFixed(6)),
          });
          onStatus?.("found");
          return;
        }
        onStatus?.("not_found");
      });
    }, 700);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [geocoding, searchQuery, biasLat, biasLng, onFound, onStatus]);

  return null;
}

function PickerInner({
  value,
  center,
  searchQuery,
  onChange,
  onGeocodeStatus,
  className,
}: LocationPickerProps) {
  const fallback = center || { lat: 47.9184, lng: 106.9177 };
  const mapCenter = value || fallback;
  const [followZoom, setFollowZoom] = useState<number | undefined>(undefined);

  const onPick = useCallback(
    (pos: LatLng) => {
      setFollowZoom(16);
      onChange({
        lat: Number(pos.lat.toFixed(6)),
        lng: Number(pos.lng.toFixed(6)),
      });
    },
    [onChange],
  );

  const onGeocoded = useCallback(
    (pos: LatLng) => {
      setFollowZoom(16);
      onChange(pos);
    },
    [onChange],
  );

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${className || ""}`}
    >
      <Map
        defaultCenter={mapCenter}
        defaultZoom={13}
        gestureHandling="greedy"
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        style={{ width: "100%", height: "100%", minHeight: 240 }}
        className="h-60 w-full sm:h-72"
      >
        <EnsureMapType mapTypeId="satellite" />
        <Recenter target={value || fallback} zoom={value ? followZoom : 13} />
        <MapClickHandler onPick={onPick} />
        <AddressGeocoder
          searchQuery={searchQuery}
          biasCenter={center || fallback}
          onFound={onGeocoded}
          onStatus={onGeocodeStatus}
        />
        {value ? <Marker position={value} /> : null}
      </Map>
      <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow">
        <MapPin className="h-3.5 w-3.5 text-[#183E95]" />
        Хаяг бичээд автоматаар олно · эсвэл зураг дээр дарна
      </div>
      {value ? (
        <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shadow">
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </div>
      ) : null}
    </div>
  );
}

export function LocationPicker(props: LocationPickerProps) {
  if (!API_KEY) {
    return (
      <div className="flex h-60 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        Google Maps API key тохируулаагүй
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} libraries={["geocoding"]}>
      <PickerInner {...props} />
    </APIProvider>
  );
}

export function GeocodeStatusHint({ status }: { status: GeocodeStatus }) {
  if (status === "idle") return null;
  if (status === "searching") {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Хаяг хайж байна…
      </p>
    );
  }
  if (status === "found") {
    return (
      <p className="mt-2 text-xs font-medium text-emerald-600">
        Олдлоо — газрын зураг дээр pin тавигдлаа
      </p>
    );
  }
  return (
    <p className="mt-2 text-xs text-amber-600">
      Олдсонгүй — зураг дээр дарж гараар тэмдэглэнэ үү
    </p>
  );
}
