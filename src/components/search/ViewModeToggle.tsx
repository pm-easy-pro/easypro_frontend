"use client";

import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "list" | "grid";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`inline-flex items-center rounded-md p-1.5 transition ${
          value === "list" ? "bg-[#183E95] text-white" : "text-slate-500 hover:text-[#183E95]"
        }`}
        aria-label="Жагсаалт"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`inline-flex items-center rounded-md p-1.5 transition ${
          value === "grid" ? "bg-[#183E95] text-white" : "text-slate-500 hover:text-[#183E95]"
        }`}
        aria-label="Сүлжээ"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );
}
