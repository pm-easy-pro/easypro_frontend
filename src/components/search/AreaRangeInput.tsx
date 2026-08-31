"use client";

import { InputNumber } from "antd";

interface AreaRangeInputProps {
  min?: string;
  max?: string;
  onChange: (min?: string, max?: string) => void;
}

export function AreaRangeInput({ min, max, onChange }: AreaRangeInputProps) {
  return (
    <div className="flex items-center gap-2">
      <InputNumber
        placeholder="Доод м²"
        className="w-full"
        min={0}
        value={min ? Number(min) : undefined}
        onChange={(v) => onChange(v != null ? String(v) : undefined, max)}
      />
      <span className="text-slate-400">—</span>
      <InputNumber
        placeholder="Дээд м²"
        className="w-full"
        min={0}
        value={max ? Number(max) : undefined}
        onChange={(v) => onChange(min, v != null ? String(v) : undefined)}
      />
    </div>
  );
}
