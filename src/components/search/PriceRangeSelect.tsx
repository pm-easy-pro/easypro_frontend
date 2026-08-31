"use client";

import { Select } from "antd";

import { formatPriceShort } from "@/lib/format";

export type PriceValue = string | undefined;

const PRICE_STEPS = [
  100_000,
  200_000,
  300_000,
  500_000,
  800_000,
  1_000_000,
  1_500_000,
  2_000_000,
  3_000_000,
  5_000_000,
  8_000_000,
  10_000_000,
  20_000_000,
  30_000_000,
  50_000_000,
  80_000_000,
  100_000_000,
  200_000_000,
  300_000_000,
  500_000_000,
  800_000_000,
  1_000_000_000,
  1_500_000_000,
  2_000_000_000,
] as const;

const options = PRICE_STEPS.map((v) => ({
  value: String(v),
  label: formatPriceShort(v),
}));

export const compactSelectClass =
  "w-full [&_.ant-select-selector]:!flex [&_.ant-select-selector]:!h-8 [&_.ant-select-selector]:!min-h-8 [&_.ant-select-selector]:!items-center [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!py-0 [&_.ant-select-selector]:!text-xs [&_.ant-select-selection-item]:!leading-8 [&_.ant-select-selection-placeholder]:!leading-8";

interface PriceRangeSelectProps {
  min?: string;
  max?: string;
  onChange: (min?: string, max?: string) => void;
  size?: "small" | "middle" | "large";
  compact?: boolean;
}

export function PriceRangeSelect({
  min,
  max,
  onChange,
  size,
  compact,
}: PriceRangeSelectProps) {
  const selectSize = size ?? (compact ? undefined : "middle");
  const minNum = min ? Number(min) : undefined;
  const maxNum = max ? Number(max) : undefined;

  return (
    <div className={`grid w-full grid-cols-2 gap-1.5 ${compact ? "" : "gap-2"}`}>
      <Select
        size={selectSize}
        allowClear
        placeholder="Доод үнэ"
        value={min}
        onChange={(v) => {
          const nextMin = v || undefined;
          if (nextMin && maxNum != null && Number(nextMin) > maxNum) {
            onChange(nextMin, nextMin);
            return;
          }
          onChange(nextMin, max);
        }}
        className={compact ? compactSelectClass : "w-full"}
        options={options}
      />
      <Select
        size={selectSize}
        allowClear
        placeholder="Дээд үнэ"
        value={max}
        onChange={(v) => {
          const nextMax = v || undefined;
          if (nextMax && minNum != null && Number(nextMax) < minNum) {
            onChange(nextMax, nextMax);
            return;
          }
          onChange(min, nextMax);
        }}
        className={compact ? compactSelectClass : "w-full"}
        options={options}
      />
    </div>
  );
}

