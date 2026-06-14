<template>
  <v-row class="ma-0 rounded-lg flex-nowrap">
    <v-col
      class="bg-transparent"
      style="flex: 1 1 0; min-width: 0;"
      v-for="(stat, index) in statusStats"
      :key="index"
    >
      <v-card variant="plain" class="text-center pa-4 bg-transparent border-none">
        <div class="stat-label mb-1">{{ stat.label }}</div>
        <div class="stat-value">{{ stat.value }}</div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PatternItem } from "@/types";

const props = defineProps<{
  pattern: PatternItem;
}>();

const formatDate = (ts: string | undefined | null): string => {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ts; }
};

const getVal = (v: string | undefined | null): string => {
  return v && v !== "null" ? v : "—";
};

const statusStats = computed(() => [
  {
    label: "Pattern ID",
    value: String(props.pattern.id),
  },
  {
    label: "First Seen",
    value: formatDate(props.pattern.first_seen_at),
  },
  {
    label: "Last Seen",
    value: formatDate(props.pattern.last_seen_at),
  },
  {
    label: "Host(s)",
    value: getVal(props.pattern.host),
  },
  {
    label: "Total Logs",
    value: props.pattern.hit_count.toLocaleString(),
  },
]);
</script>

<style scoped>
.stat-label {
  color: rgb(255, 255, 255) !important;
  font-family: Roboto, sans-serif !important;
  font-size: 16px !important;
  font-weight: 400 !important;
  letter-spacing: 0.15px !important;
  line-height: 28px !important;
  text-align: center;
  text-transform: none !important;
  margin-bottom: 4px;
}

.stat-value {
  color: rgb(255, 255, 255);
  font-size: 18px;
  font-weight: 600;
  line-height: 27px;
  text-align: center;
}
</style>
