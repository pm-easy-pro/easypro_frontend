"use client";

import { useMemo, useState } from "react";
import { Checkbox, Input, Modal } from "antd";
import { MapPin, Search } from "lucide-react";

import { formatDistrict } from "@/lib/format";
import type { Location } from "@/types";

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
  locations: Location[];
  selected: string[];
  onApply: (selected: string[]) => void;
}

export function LocationModal({ open, onClose, locations, selected, onApply }: LocationModalProps) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<string[]>(selected);

  const grouped = useMemo(() => {
    const map = new Map<string, Location[]>();
    locations.forEach((loc) => {
      const key = loc.district;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(loc);
    });
    return Array.from(map.entries());
  }, [locations]);

  const filtered = useMemo(() => {
    if (!query.trim()) return grouped;
    const q = query.toLowerCase();
    return grouped
      .map(([district, locs]) => [
        district,
        locs.filter(
          (l) =>
            l.official_address.toLowerCase().includes(q) ||
            l.aliases.some((a) => a.name.toLowerCase().includes(q)),
        ),
      ])
      .filter(([, locs]) => (locs as Location[]).length > 0) as [string, Location[]][];
  }, [grouped, query]);

  const toggle = (name: string) => {
    setDraft((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  return (
    <Modal
      title="Байршил сонгох"
      open={open}
      onCancel={onClose}
      onOk={() => {
        onApply(draft);
        onClose();
      }}
      okText="Хэрэглэх"
      cancelText="Болих"
      width={640}
      destroyOnHidden
      afterOpenChange={(visible) => visible && setDraft(selected)}
    >
      <Input
        prefix={<Search className="h-4 w-4 text-slate-400" />}
        placeholder="Байршил хайх..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4"
        size="large"
      />
      {draft.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {draft.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-full bg-[#183E95]/10 px-3 py-1 text-sm text-[#183E95]"
            >
              <MapPin className="h-3.5 w-3.5" />
              {name}
            </span>
          ))}
        </div>
      )}
      <div className="max-h-[50vh] space-y-6 overflow-y-auto pr-1">
        {filtered.map(([district, locs]) => (
          <div key={district}>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              {formatDistrict(district)}
            </h4>
            {locs.map((loc) => (
              <div key={loc.id} className="mb-4 rounded-2xl border border-slate-100 p-4">
                <Checkbox
                  checked={draft.includes(loc.official_address)}
                  onChange={() => toggle(loc.official_address)}
                  className="font-semibold text-slate-900"
                >
                  {loc.official_address}
                </Checkbox>
                <div className="mt-3 ml-6 space-y-2">
                  {loc.aliases.map((alias) => (
                    <Checkbox
                      key={alias.id}
                      checked={draft.includes(alias.name)}
                      onChange={() => toggle(alias.name)}
                      className="text-slate-600"
                    >
                      {alias.name}
                    </Checkbox>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Modal>
  );
}
