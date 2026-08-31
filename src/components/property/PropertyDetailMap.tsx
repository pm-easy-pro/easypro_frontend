"use client";

import { MapPreview } from "@/components/map/MapPreview";
import { useAmenityPin } from "@/components/property/AmenityPinContext";
import type { Property } from "@/types";

interface PropertyDetailMapProps {
  properties: Property[];
  primaryPropertyId?: number;
  className?: string;
}

export function PropertyDetailMap({
  properties,
  primaryPropertyId,
  className,
}: PropertyDetailMapProps) {
  const amenityPin = useAmenityPin();
  const extraPins = amenityPin?.selectedPin
    ? [
        {
          id: amenityPin.selectedPin.id,
          lat: amenityPin.selectedPin.lat,
          lng: amenityPin.selectedPin.lng,
          title: amenityPin.selectedPin.name,
          subtitle: amenityPin.selectedPin.categoryLabel || amenityPin.selectedPin.address,
        },
      ]
    : [];

  return (
    <MapPreview
      properties={properties}
      extraPins={extraPins}
      primaryPropertyId={primaryPropertyId}
      className={className}
    />
  );
}
