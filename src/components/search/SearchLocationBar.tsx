"use client";

import { ChevronDown, Search } from "lucide-react";

function formatLocationLabel(selected: string[]) {
  if (!selected.length) return "Байршил";
  if (selected.length === 1) return selected[0];
  const joined = selected.slice(0, 2).join(", ");
  if (selected.length > 2) return `${joined} +${selected.length - 2}`;
  return joined;
}

interface SearchLocationBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  selectedLocations: string[];
  onOpenLocation: () => void;
  resultCount?: number;
  loading?: boolean;
}

export function SearchLocationBar({
  query,
  onQueryChange,
  onSearch,
  selectedLocations,
  onOpenLocation,
  resultCount,
  loading,
}: SearchLocationBarProps) {
  const placeholder =
    !query && resultCount != null && !loading
      ? `${resultCount.toLocaleString("mn-MN")} зар байна`
      : "Гарчиг, байршил, 3 өрөө...";

  return (
    <div className="flex min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative flex min-w-0 flex-1 items-center border-r border-slate-200">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#183E95]" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder={placeholder}
          className="h-9 w-full bg-transparent py-2 pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>
      <button
        type="button"
        onClick={onOpenLocation}
        className={`flex max-w-[42%] shrink-0 items-center gap-1.5 px-3 text-left text-sm transition sm:max-w-[38%] ${
          selectedLocations.length
            ? "font-medium text-slate-900 hover:bg-[#183E95]/5"
            : "text-slate-500 hover:bg-slate-50"
        }`}
      >
        <span className="min-w-0 truncate">{formatLocationLabel(selectedLocations)}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
    </div>
  );
}
