"use client";

import { useEffect, useState } from "react";

import { formatTimeAgo } from "@/lib/format";

interface PropertyTimeAgoProps {
  dateStr: string;
  className?: string;
}

/**
 * Relative time uses Date.now() — render after mount so SSR HTML matches hydration.
 */
export function PropertyTimeAgo({ dateStr, className }: PropertyTimeAgoProps) {
  const [label, setLabel] = useState<string>("—");

  useEffect(() => {
    setLabel(formatTimeAgo(dateStr));
  }, [dateStr]);

  return <span className={className}>{label}</span>;
}
