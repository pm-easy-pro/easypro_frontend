"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import type { Property } from "@/types";

export function collectPropertyImages(property: Property): string[] {
  const urls: string[] = [];
  const add = (url?: string | null) => {
    if (url && !urls.includes(url)) urls.push(url);
  };
  add(property.thumbnail_url);
  property.images?.forEach(add);
  return urls.length ? urls : ["/placeholder-property.jpg"];
}

interface PropertyImageSliderProps {
  images: string[];
  alt: string;
  intervalMs?: number;
  sizes?: string;
  imageClassName?: string;
}

export function PropertyImageSlider({
  images,
  alt,
  intervalMs = 3000,
  sizes = "(max-width: 640px) 100vw, 384px",
  imageClassName = "object-cover transition duration-500 group-hover:scale-[1.03]",
}: PropertyImageSliderProps) {
  const slides = useMemo(() => images.filter(Boolean), [images]);
  const slidesKey = slides.join("|");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slidesKey]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [slides.length, intervalMs]);

  return (
    <>
      {slides.map((src, i) => (
        <Image
          key={`${src}-${i}`}
          src={src}
          alt={alt}
          fill
          unoptimized
          sizes={sizes}
          className={`${imageClassName} absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === index ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
      ))}
      {slides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full bg-white shadow transition-all ${
                i === index ? "w-4 opacity-100" : "w-1.5 opacity-55"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
