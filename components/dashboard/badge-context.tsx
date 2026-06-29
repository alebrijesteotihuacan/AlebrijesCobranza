"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";

export interface BadgeCounts {
  comprobantes: number;
  desconocidos: number;
}

interface BadgeContextValue {
  counts: BadgeCounts;
  refresh: () => Promise<void>;
  setCounts: (c: BadgeCounts) => void;
}

const BadgeContext = createContext<BadgeContextValue | null>(null);

export function BadgeCountsProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial: BadgeCounts;
}) {
  const [counts, setCounts] = useState<BadgeCounts>(initial);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/badges", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as BadgeCounts;
        setCounts(data);
      }
    } catch (e) {
      console.error("refresh badges", e);
    }
  }, []);

  const value = useMemo(
    () => ({ counts, refresh, setCounts }),
    [counts, refresh],
  );

  return <BadgeContext.Provider value={value}>{children}</BadgeContext.Provider>;
}

export function useBadges() {
  const ctx = useContext(BadgeContext);
  if (!ctx) {
    throw new Error("useBadges must be used within BadgeCountsProvider");
  }
  return ctx;
}
