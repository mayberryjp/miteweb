<template>
  <v-card color="#0d1117" class="stats-chart-card">
    <v-card-title class="stats-chart-header d-flex align-center px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 stats-chart-title">
        Log &amp; Alert Rates
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
  loading: boolean;
  error: boolean;
}>();

const noiseStats = computed(() => props.noiseStats ?? []);

const hasData = computed(() => props.logStats.length > 0 || props.alertStats.length > 0 || noiseStats.value.length > 0);

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

const categories = computed(() => {
  const longest = [props.logStats, props.alertStats, noiseStats.value].reduce(
    (a, b) => (b.length > a.length ? b : a),
    [] as HourlyStat[]
  );
  return [...longest]
    .sort((a, b) => a.hour.localeCompare(b.hour))
    .map((s) => formatHour(s.hour));
});

const sortedLogs = computed(() =>
  [...props.logStats].sort((a, b) => a.hour.localeCompare(b.hour))
);

const sortedAlerts = computed(() =>
  [...props.alertStats].sort((a, b) => a.hour.localeCompare(b.hour))
);

const sortedNoise = computed(() =>
  [...noiseStats.value].sort((a, b) => a.hour.localeCompare(b.hour))
);

const series = computed(() => [
  {
    name: "Logs",
    type: "line",
    data: sortedLogs.value.map((s) => s.count),
  },
  {
    name: "Alerts",
    type: "bar",
    data: sortedAlerts.value.map((s) => s.count),
  },
  {
    name: "Noise",
    type: "line",
    data: sortedNoise.value.map((s) => s.count),
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
  colors: ["#5CDD8B", "#B71C1C", "#FF9800"],
  fill: { opacity: [1, 0.3, 1] },
  stroke: { curve: "smooth", width: [3, 0, 2] },
  dataLabels: { enabled: false },
  tooltip: {
    theme: "dark",
    shared: true,
    y: [
      { formatter: (val: number) => `${Math.round(val).toLocaleString()} logs` },
      { formatter: (val: number) => `${Math.round(val).toLocaleString()} alerts` },
      { formatter: (val: number) => `${Math.round(val).toLocaleString()} noise` },
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
      seriesName: "Logs",
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
