import { defineStore } from "pinia";
import { ref } from "vue";
import { getPatterns, getPatternStats } from "@/services/rules";
import type { PatternItem } from "@/types";

/**
 * Shared cache of discovered patterns and their hourly stats, used by the
 * pattern list and pattern detail views. Replaces the previous
 * provide/inject wiring in MainLayout.
 */
export const usePatternsStore = defineStore("patterns", () => {
  const patterns = ref<PatternItem[]>([]);
  const patternStats = ref<Record<string, { hour: string; count: number }[]>>({});
  const loaded = ref(false);

  const refresh = async () => {
    const [p, ps] = await Promise.allSettled([getPatterns(), getPatternStats(12)]);
    if (p.status === "fulfilled") patterns.value = p.value?.items ?? [];
    if (ps.status === "fulfilled") patternStats.value = ps.value ?? {};
    loaded.value = true;
  };

  return { patterns, patternStats, loaded, refresh };
});
