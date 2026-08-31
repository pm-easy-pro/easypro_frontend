"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  APIProvider,
  InfoWindow,
  Map,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps";

import { formatPrice } from "@/lib/format";
import type { Property } from "@/types";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const UB_CENTER = { lat: 47.9184, lng: 106.9177 };

export interface MapExtraPin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
}

interface MapPreviewProps {
  properties: Property[];
  extraPins?: MapExtraPin[];
  /** When set with extraPins, fit map to this property + amenity pins */
  primaryPropertyId?: number;
  className?: string;
  badgeLabel?: string;
}

function getPosition(property: Property) {
  if (!property.latitude || !property.longitude) return null;
  return {
    lat: Number(property.latitude),
    lng: Number(property.longitude),
  };
}

const MAX_ZOOM = 12;
const FOCUS_MAX_ZOOM = 16;
const DEFAULT_ZOOM = 11;
const SINGLE_PIN_ZOOM = 14;
const DEFAULT_MAP_TYPE = "satellite" as const;

function EnsureMapType({ mapTypeId }: { mapTypeId: string }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.setMapTypeId(mapTypeId);
  }, [map, mapTypeId]);
  return null;
}

function FitBounds({
  positions,
  maxZoom = MAX_ZOOM,
}: {
  positions: { lat: number; lng: number }[];
  maxZoom?: number;
}) {
  const map = useMap();
  const key = positions.map((p) => `${p.lat},${p.lng}`).join("|");

  useEffect(() => {
    if (!map || positions.length === 0) return;
    if (positions.length === 1) {
      map.setCenter(positions[0]);
      map.setZoom(Math.min(SINGLE_PIN_ZOOM, maxZoom));
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    positions.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 80);

    const listener = google.maps.event.addListenerOnce(map, "idle", () => {
      const zoom = map.getZoom();
      if (zoom != null && zoom > maxZoom) {
        map.setZoom(maxZoom);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key encodes positions
  }, [map, key, maxZoom]);

  return null;
}

function PropertyMarkers({ properties }: { properties: Property[] }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const active = properties.find((p) => p.id === activeId) ?? null;
  const activePos = active ? getPosition(active) : null;

  const onMarkerClick = useCallback((id: number) => {
    setActiveId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <>
      {properties.map((property) => {
        const position = getPosition(property);
        if (!position) return null;
        return (
          <Marker
            key={property.id}
            position={position}
            title={`${property.title} — ${formatPrice(property.price, property.listing_type)}`}
            onClick={() => onMarkerClick(property.id)}
          />
        );
      })}
      {active && activePos && (
        <InfoWindow position={activePos} onCloseClick={() => setActiveId(null)}>
          <div className="max-w-[240px] p-1">
            {active.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.thumbnail_url}
                alt=""
                className="mb-2 h-28 w-full rounded-lg object-cover"
              />
            ) : null}
            <p className="text-sm font-semibold text-slate-900 line-clamp-2">
              {active.title}
            </p>
            <p className="mt-1 text-xs text-slate-500">{active.official_address}</p>
            <p className="mt-1 text-sm font-bold text-[#183E95]">
              {formatPrice(active.price, active.listing_type)}
            </p>
            <Link
              href={`/properties/${active.id}`}
              className="mt-2 inline-block text-xs font-semibold text-[#183E95] hover:underline"
            >
              Дэлгэрэнгүй →
            </Link>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function ExtraPinMarkers({ pins }: { pins: MapExtraPin[] }) {
  const [activeId, setActiveId] = useState<string | null>(pins[0]?.id ?? null);
  const active = pins.find((p) => p.id === activeId) ?? null;

  useEffect(() => {
    if (pins.length) setActiveId(pins[0].id);
    else setActiveId(null);
  }, [pins]);

  return (
    <>
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={{ lat: pin.lat, lng: pin.lng }}
          title={pin.title}
          onClick={() => setActiveId(pin.id)}
          icon={{
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          }}
        />
      ))}
      {active ? (
        <InfoWindow
          position={{ lat: active.lat, lng: active.lng }}
          onCloseClick={() => setActiveId(null)}
        >
          <div className="max-w-[220px] p-1">
            <p className="text-sm font-semibold text-slate-900">{active.title}</p>
            {active.subtitle ? (
              <p className="mt-1 text-xs text-slate-500">{active.subtitle}</p>
            ) : null}
          </div>
        </InfoWindow>
      ) : null}
    </>
  );
}

function GoogleMapInner({
  properties,
  extraPins = [],
  primaryPropertyId,
  className,
  badgeLabel,
}: MapPreviewProps) {
  const withCoords = useMemo(
    () => properties.filter((p) => p.latitude && p.longitude).slice(0, 40),
    [properties],
  );

  const focusPositions = useMemo(() => {
    if (!extraPins.length) return null;
    const primary =
      (primaryPropertyId != null
        ? withCoords.find((p) => p.id === primaryPropertyId)
        : withCoords[0]) || null;
    const primaryPos = primary ? getPosition(primary) : null;
    const amenityPositions = extraPins.map((p) => ({ lat: p.lat, lng: p.lng }));
    if (primaryPos) return [primaryPos, ...amenityPositions];
    return amenityPositions;
  }, [extraPins, primaryPropertyId, withCoords]);

  const allPositions = useMemo(
    () =>
      withCoords
        .map(getPosition)
        .filter((p): p is { lat: number; lng: number } => p !== null),
    [withCoords],
  );

  const fitPositions = focusPositions || allPositions;
  const maxZoom = focusPositions ? FOCUS_MAX_ZOOM : MAX_ZOOM;

  return (
    <div
      className={`relative w-full min-w-0 overflow-hidden rounded-3xl border border-slate-200 shadow-inner ${className}`}
    >
      <Map
        defaultCenter={UB_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        defaultMapTypeId={DEFAULT_MAP_TYPE}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl
        streetViewControl={false}
        fullscreenControl
        style={{ width: "100%", height: "100%", minHeight: 280 }}
        className="h-full min-h-[280px] w-full"
      >
        <EnsureMapType mapTypeId={DEFAULT_MAP_TYPE} />
        <FitBounds positions={fitPositions} maxZoom={maxZoom} />
        <PropertyMarkers properties={withCoords} />
        {extraPins.length > 0 ? <ExtraPinMarkers pins={extraPins} /> : null}
      </Map>
      {withCoords.length === 0 && extraPins.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-100/80">
          <p className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow">
            Координаттай зар олдсонгүй
          </p>
        </div>
      )}
      <div className="pointer-events-none absolute left-3 top-3 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#183E95] shadow">
        {badgeLabel ??
          (extraPins.length
            ? `Зар + ${extraPins.length} ойролцоох`
            : `${withCoords.length} зар`)}
      </div>
    </div>
  );
}

export function MapPreview({
  properties,
  extraPins,
  primaryPropertyId,
  className = "",
  badgeLabel,
}: MapPreviewProps) {
  if (!API_KEY) {
    return (
      <div
        className={`flex min-h-[280px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-100 ${className}`}
      >
        <p className="px-4 text-center text-sm text-slate-600">
          Google Maps API key тохируулаагүй байна.
          <br />
          <code className="text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <GoogleMapInner
        properties={properties}
        extraPins={extraPins}
        primaryPropertyId={primaryPropertyId}
        className={className}
        badgeLabel={badgeLabel}
      />
    </APIProvider>
  );
}
