"use client";

import { Select } from "antd";

import type { FilterOption } from "@/types";

interface SortDropdownProps {
  options: FilterOption[];
  value?: string;
  onChange: (value: string) => void;
}

export function SortDropdown({ options, value, onChange }: SortDropdownProps) {
  return (
    <Select
      size="small"
      placeholder="Эрэмбэлэх"
      value={value || "newest"}
      onChange={onChange}
      className="min-w-[140px] [&_.ant-select-selector]:!h-8 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!text-xs"
      options={options.map((o) => ({ value: o.value, label: o.label }))}
    />
  );
}
