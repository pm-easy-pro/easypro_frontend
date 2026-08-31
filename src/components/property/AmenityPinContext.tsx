"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface AmenityMapPin {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  categoryLabel?: string;
}

interface AmenityPinContextValue {
  selectedPin: AmenityMapPin | null;
  selectPin: (pin: AmenityMapPin | null) => void;
}

const AmenityPinContext = createContext<AmenityPinContextValue | null>(null);

export function AmenityPinProvider({ children }: { children: ReactNode }) {
  const [selectedPin, setSelectedPin] = useState<AmenityMapPin | null>(null);

  const selectPin = useCallback((pin: AmenityMapPin | null) => {
    setSelectedPin((prev) => {
      if (pin && prev?.id === pin.id) return null;
      return pin;
    });
  }, []);

  const value = useMemo(
    () => ({ selectedPin, selectPin }),
    [selectedPin, selectPin],
  );

  return (
    <AmenityPinContext.Provider value={value}>{children}</AmenityPinContext.Provider>
  );
}

export function useAmenityPin() {
  return useContext(AmenityPinContext);
}
