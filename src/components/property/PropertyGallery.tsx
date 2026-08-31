"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, ImageIcon } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/counter.css";

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const gallery = images.length ? images : [];
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const slides = gallery.map((src, idx) => ({
    src,
    alt: `${title} — зураг ${idx + 1}`,
  }));

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (!gallery.length) return;
      setActive((i) => (i + dir + gallery.length) % gallery.length);
    },
    [gallery.length],
  );

  useEffect(() => {
    if (lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, lightboxOpen]);

  if (!gallery.length) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-slate-100 text-slate-400 md:rounded-3xl">
        <div className="text-center">
          <ImageIcon className="mx-auto h-10 w-10 opacity-50" />
          <p className="mt-2 text-sm">Зураг байхгүй</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-900 md:rounded-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={gallery[active]}
            initial={{ opacity: 0.35, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0"
          >
            <Image
              src={gallery[active]}
              alt={`${title} — зураг ${active + 1}`}
              fill
              className="object-cover"
              unoptimized
              priority
              sizes="(max-width: 1024px) 100vw, 70vw"
            />
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => openLightbox(active)}
          className="absolute inset-0 z-[5] cursor-zoom-in"
          aria-label="Зургийг бүтэн дэлгэцээр харах"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur transition hover:bg-white md:opacity-0 md:group-hover:opacity-100"
              aria-label="Өмнөх зураг"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur transition hover:bg-white md:opacity-0 md:group-hover:opacity-100"
              aria-label="Дараагийн зураг"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => openLightbox(active)}
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Бүтэн дэлгэц"
        >
          <Expand className="h-4 w-4" />
        </button>

        <div className="absolute bottom-3 right-3 z-10 rounded-lg bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {active + 1} / {gallery.length}
        </div>
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {gallery.map((src, idx) => (
            <button
              key={`${src}-${idx}`}
              type="button"
              onClick={() => setActive(idx)}
              onDoubleClick={() => openLightbox(idx)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl transition md:h-20 md:w-28 ${
                active === idx
                  ? "ring-2 ring-[#183E95] ring-offset-2"
                  : "opacity-60 hover:opacity-100"
              }`}
              aria-label={`Зураг ${idx + 1}`}
              aria-current={active === idx}
            >
              <Image src={src} alt="" fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
        plugins={[Thumbnails, Zoom, Counter]}
        carousel={{ finite: false }}
        controller={{ closeOnBackdropClick: true }}
        on={{
          view: ({ index }) => {
            setLightboxIndex(index);
            setActive(index);
          },
        }}
        thumbnails={{
          position: "bottom",
          border: 0,
          borderRadius: 8,
          padding: 8,
          gap: 8,
          imageFit: "cover",
        }}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
        }}
        styles={{
          container: { backgroundColor: "rgba(0, 0, 0, 0.92)" },
        }}
      />
    </div>
  );
}
