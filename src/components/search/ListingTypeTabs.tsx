"use client";

import { motion } from "framer-motion";

import type { FilterOption } from "@/types";

interface ListingTypeTabsProps {
  options: FilterOption[];
  value?: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

export function ListingTypeTabs({ options, value, onChange, compact }: ListingTypeTabsProps) {
  return (
    <div
      className={`inline-flex shrink-0 rounded-xl bg-slate-100 p-0.5 ring-1 ring-slate-200/60 ${
        compact ? "" : "rounded-2xl p-1"
      }`}
    >
      {options.map((opt) => {
        const active = value === opt.value || (!value && opt.value === "sell");
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative font-semibold transition ${
              compact ? "rounded-lg px-3 py-1.5 text-xs" : "rounded-xl px-4 py-2 text-sm"
            }`}
          >
            {active && (
              <motion.span
                layoutId="listing-tab"
                className={`absolute inset-0 bg-[#183E95] shadow-sm ${
                  compact ? "rounded-lg" : "rounded-xl"
                }`}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className={`relative z-10 ${active ? "text-white" : "text-slate-600"}`}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
