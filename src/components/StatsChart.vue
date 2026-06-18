<template>
  <v-card color="#0d1117" class="stats-chart-card">
    <v-card-title class="stats-chart-header d-flex align-center px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 stats-chart-title">
        Log, Alert, Noise, and Pattern Rates
      </span>
    </v-card-title>
    <v-divider></v-divider>

    <v-card-text v-if="loading" class="stats-state text-center">
      <v-progress-circular indeterminate color="primary" size="28" class="mb-2"></v-progress-circular>
      <div class="text-grey">Loading chart data...</div>
    </v-card-text>

    <v-card-text v-else-if="error" class="stats-state text-center">
      <v-icon color="warning" size="28" class="mb-2">mdi-alert-circle-outline</v-icon>
      <div class="text-grey">Chart data could not be loaded.</div>
    </v-card-text>

    <v-card-text v-else-if="!hasData" class="stats-state text-center">
      <v-icon color="grey" size="28" class="mb-2">mdi-chart-line</v-icon>
      <div class="text-grey">No data available.</div>
    </v-card-text>

    <div v-else class="stats-chart-wrap">
      <apexchart
        type="line"
        height="320"
        :options="chartOptions"
        :series="series"
      ></apexchart>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { HourlyStat } from "@/types";

const props = defineProps<{
  logStats: HourlyStat[];
  alertStats: HourlyStat[];
  noiseStats?: HourlyStat[];
  patternStats100?: HourlyStat[];
  loading: boolean;
  error: boolean;
}>();

const noiseStats = computed(() => props.noiseStats ?? []);
const patternStats100 = computed(() => props.patternStats100 ?? []);

const hasData = computed(() =>
  props.logStats.length > 0 ||
  props.alertStats.length > 0 ||
  noiseStats.value.length > 0 ||
  patternStats100.value.length > 0
);

const formatHour = (hour: string) => {
  try {
    const d = new Date(hour);
    if (Number.isNaN(d.getTime())) return hour;
    return d.toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return hour;
  }
};

const sortedByHour = (stats: HourlyStat[]) => [...stats].sort((a, b) => a.hour.localeCompare(b.hour));

const baseHours = computed(() => {
  const allHours = [
    ...props.logStats.map((s) => s.hour),
    ...props.alertStats.map((s) => s.hour),
    ...noiseStats.value.map((s) => s.hour),
    ...patternStats100.value.map((s) => s.hour),
  ];
  return [...new Set(allHours)].sort((a, b) => a.localeCompare(b));
});

const categories = computed(() => baseHours.value.map((hour) => formatHour(hour)));

const toSeriesData = (stats: HourlyStat[]) => {
  const byHour = new Map(sortedByHour(stats).map((s) => [s.hour, s.count]));
  return baseHours.value.map((hour) => byHour.get(hour) ?? null);
};

const series = computed(() => [
  {
    name: "Logs",
    type: "line",
    data: toSeriesData(props.logStats),
  },
  {
    name: "Alerts",
    type: "bar",
    data: toSeriesData(props.alertStats),
    yAxisIndex: 1,
  },
  {
    name: "Noise",
    type: "line",
    data: toSeriesData(noiseStats.value),
  },
  {
    name: "Patterns",
    type: "line",
    data: toSeriesData(patternStats100.value),
  },
]);

const chartOptions = computed(() => ({
  chart: {
    id: "log-alert-rates-chart",
    background: "#0d1117",
    toolbar: { show: false },
    animations: { enabled: true, easing: "easeinout", speed: 800 },
    zoom: { enabled: false },
  },
  colors: ["#5CDD8B", "#B71C1C", "#FF9800", "#1E88E5"],
  fill: { opacity: [1, 0.3, 1, 1] },
  stroke: { curve: "smooth", width: [3, 0, 2, 2] },
  dataLabels: { enabled: false },
  tooltip: {
    theme: "dark",
    shared: true,
    y: [
      { formatter: (val: number) => `${Math.round(val).toLocaleString()} logs` },
      { formatter: (val: number) => `${Math.round(val).toLocaleString()} alerts` },
      { formatter: (val: number) => `${Math.round(val).toLocaleString()} noise` },
      { formatter: (val: number) => `${Math.round(val).toLocaleString()} patterns` },
    ],
  },
  grid: {
    borderColor: "#333",
    row: { colors: ["transparent", "transparent"], opacity: 0.1 },
  },
  xaxis: {
    categories: categories.value,
    labels: {
      rotate: -45,
      style: { colors: "#b1b8c0" },
    },
    axisBorder: { color: "#333" },
    axisTicks: { color: "#333" },
  },
  yaxis: [
    {
      title: { text: "Logs", style: { color: "#5CDD8B" } },
      labels: {
        style: { colors: "#b1b8c0" },
        formatter: (val: number) => Math.round(val).toLocaleString(),
      },
    },
    {
      opposite: true,
      title: { text: "Alerts", style: { color: "#B71C1C" } },
      labels: {
        style: { colors: "#b1b8c0" },
        formatter: (val: number) => Math.round(val).toLocaleString(),
      },
    },
    {
      show: false,
      seriesName: "Noise",
    },
    {
      show: false,
      seriesName: "Patterns",
    },
  ],
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "right",
    labels: { colors: "#b1b8c0" },
  },
  responsive: [
    {
      breakpoint: 600,
      options: {
        chart: { height: 280 },
        legend: { position: "bottom", horizontalAlign: "center" },
        xaxis: { labels: { show: false } },
      },
    },
  ],
}));
</script>

<style scoped>
.stats-chart-card {
  overflow: hidden;
}

.stats-chart-title {
  font-family: var(--app-font-family);
  color: #ffffff;
}

.stats-chart-wrap {
  padding: 12px 12px 4px;
}

.stats-state {
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

:deep(.apexcharts-tooltip) {
  background: #1e1e1e !important;
  border: none !important;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4) !important;
}

:deep(.apexcharts-tooltip-title) {
  background: #2d2d2d !important;
  border-bottom: 1px solid #3a3a3a !important;
}
</style>
