"use client";

import { X } from "lucide-react";

interface Chip {
  key: string;
  label: string;
}

interface ActiveFilterChipsProps {
  chips: Chip[];
  onRemove: (key: string) => void;
  onClearAll?: () => void;
}

export function ActiveFilterChips({ chips, onRemove, onClearAll }: ActiveFilterChipsProps) {
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.key)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#183E95]/20 bg-[#183E95]/5 px-3 py-1.5 text-sm font-medium text-[#183E95] transition hover:bg-[#183E95]/10"
        >
          {chip.label}
          <X className="h-3.5 w-3.5" />
        </button>
      ))}
      {onClearAll && chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm font-medium text-slate-500 underline-offset-2 hover:text-[#183E95] hover:underline"
        >
          Бүгдийг цэвэрлэх
        </button>
      )}
    </div>
  );
}
