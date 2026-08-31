"use client";

import { Select } from "antd";

import { compactSelectClass } from "@/components/search/PriceRangeSelect";
import type { FilterOption } from "@/types";

interface PaymentTermsSelectProps {
  options: FilterOption[];
  value?: string;
  onChange: (value?: string) => void;
  compact?: boolean;
}

function parseValue(value?: string) {
  return value ? value.split(",").filter(Boolean) : [];
}

export function PaymentTermsSelect({
  options,
  value,
  onChange,
  compact = true,
}: PaymentTermsSelectProps) {
  const selected = parseValue(value);
  const labelByValue = Object.fromEntries(options.map((o) => [o.value, o.label]));

  return (
    <Select
      mode="multiple"
      allowClear
      placeholder="Төлбөрийн нөхцөл"
      className={compact ? compactSelectClass : "w-full"}
      value={selected}
      options={options}
      optionFilterProp="label"
      maxTagCount={0}
      maxTagPlaceholder={(omitted) => {
        if (omitted.length === 1) {
          return labelByValue[String(omitted[0].value)] ?? String(omitted[0].label);
        }
        return `${omitted.length} сонгосон`;
      }}
      onChange={(vals) => onChange(vals.length ? vals.join(",") : undefined)}
      popupMatchSelectWidth={false}
      listHeight={280}
    />
  );
}
