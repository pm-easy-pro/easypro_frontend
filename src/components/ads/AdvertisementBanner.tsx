"use client";

import Link from "next/link";
import { ArrowRight, Building2, Megaphone, Sparkles } from "lucide-react";

interface AdvertisementBannerProps {
  className?: string;
  href?: string;
  label?: string;
}

export function AdvertisementBanner({
  className = "",
  href = "/post-property",
  label = "Зар нэмэх",
}: AdvertisementBannerProps) {
  return (
    <aside className={`flex w-full min-w-0 flex-col gap-4 ${className}`}>
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-[#183E95] via-[#1e4bb8] to-[#2563eb] p-6 text-white shadow-lg transition hover:shadow-xl"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-amber-400/20" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950">
          <Sparkles className="h-3.5 w-3.5" />
          Зар сурталчилгаа
        </span>
        <h3 className="mt-4 text-xl font-bold leading-snug">
          VIP зар — жагсаалтын хамгийн дээр
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/85">
          Илүү их үзэлт, тод харагдах байрлал. Одоо зар нэмээд борлуулалтаа хурдасгаарай.
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 group-hover:gap-3 transition-all">
          {label}
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 text-white">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
            <Megaphone className="h-3.5 w-3.5" />
            Түнш байгууллага
          </p>
          <p className="mt-1 text-lg font-bold">EasyPro Realty</p>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-sm leading-relaxed text-slate-600">
            Мэргэжлийн агент, баталгаажсан зарууд. Орон сууц худалдах, түрээслэх бүх нөхцөлд зөвлөгөө өгнө.
          </p>
          <Link
            href="/properties?listing_type=sell"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#183E95]/10 py-2.5 text-sm font-semibold text-[#183E95] transition hover:bg-[#183E95]/15"
          >
            <Building2 className="h-4 w-4" />
            Агентийн зарууд үзэх
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-[#183E95]/25 bg-[#183E95]/5 p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#183E95]/70">
          Banner зай
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Таны бизнесийн зар энд байрлана.
        </p>
        <a
          href="mailto:ads@easypro.mn"
          className="mt-3 inline-block text-sm font-semibold text-[#183E95] hover:underline"
        >
          ads@easypro.mn
        </a>
      </div>
    </aside>
  );
}
