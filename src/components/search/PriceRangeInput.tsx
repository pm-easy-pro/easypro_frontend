"use client";

import { InputNumber } from "antd";

interface PriceRangeInputProps {
  min?: string;
  max?: string;
  onChange: (min?: string, max?: string) => void;
  compact?: boolean;
}

const compactClass =
  "[&_.ant-input-number]:!h-8 [&_.ant-input-number]:!rounded-lg [&_.ant-input-number-input]:!text-xs";

export function PriceRangeInput({ min, max, onChange, compact }: PriceRangeInputProps) {
  return (
    <div className={`flex items-center gap-1.5 ${compact ? compactClass : ""}`}>
      <InputNumber
        placeholder={compact ? "Доод ₮" : "Доод"}
        className="min-w-0 flex-1"
        size={compact ? "small" : "middle"}
        min={0}
        value={min ? Number(min) : undefined}
        onChange={(v) => onChange(v != null ? String(v) : undefined, max)}
        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        parser={(v) => Number(v?.replace(/,/g, "") || 0)}
        controls={false}
      />
      <span className="shrink-0 text-slate-300">—</span>
      <InputNumber
        placeholder={compact ? "Дээд ₮" : "Дээд"}
        className="min-w-0 flex-1"
        size={compact ? "small" : "middle"}
        min={0}
        value={max ? Number(max) : undefined}
        onChange={(v) => onChange(min, v != null ? String(v) : undefined)}
        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        parser={(v) => Number(v?.replace(/,/g, "") || 0)}
        controls={false}
      />
    </div>
  );
}
