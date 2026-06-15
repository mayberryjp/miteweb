<template>
  <div>
    <v-alert v-if="error" type="error" variant="tonal" closable class="mb-4">{{ error }}</v-alert>

        <!-- KPI Banner -->
        <v-row class="quickstats-background ma-0 rounded-lg mb-4">
          <v-col
            v-for="(stat, index) in statusStats"
            :key="index"
            cols="6"
            sm="6"
            md
            class="bg-transparent"
          >
            <v-card variant="plain" class="text-center pa-2 pa-sm-4 bg-transparent border-none">
              <div class="font-weight-medium stat-label mb-1">
                {{ stat.label }}
              </div>
              <div class="stat-description mb-1">{{ stat.description }}</div>
              <div :class="['font-weight-bold stat-value', stat.color]">
                {{ stat.value }}
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Stats Chart -->
        <div class="mb-4">
          <StatsChart
            :log-stats="hourlyLogs"
            :alert-stats="hourlyAlerts"
            :noise-stats="hourlyNoise"
            :loading="chartLoading"
            :error="chartError"
          />
        </div>

        <!-- Recent Alerts -->
        <div>
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-1 font-weight-bold">Recent Critical Alerts</div>
            <v-select
              v-model="alertsPerPage"
              :items="[10, 25, 50, 100]"
              density="compact"
              variant="outlined"
              hide-details
              label="Items per page"
              style="max-width: 150px;"
            ></v-select>
          </div>
          <v-table v-if="alerts.length" density="compact" class="rounded-lg alerts-table" style="background-color: #0d1117;">
            <thead>
              <tr>
                <th style="width: 140px;">Time</th>
                <th style="width: 90px;">Severity</th>
                <th style="width: 120px;">Source</th>
                <th style="width: 100px;">Pattern #</th>
                <th>Message</th>
                <th style="width: 50px;">Delete</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in alerts" :key="a.id">
                <td class="text-no-wrap text-body-2">{{ formatDateTime(a.created_at) }}</td>
                <td><SeverityBadge :severity="a.severity" /></td>
                <td class="text-body-2">{{ a.source_ip || a.host || '—' }}</td>
                <td class="text-body-2">{{ a.pattern_id ?? '—' }}</td>
                <td
                  class="text-body-2"
                  :class="{ 'text-truncate': !expandedAlerts.has(a.id) }"
                  :style="!expandedAlerts.has(a.id) ? 'max-width: 400px; cursor: pointer;' : 'cursor: pointer;'"
                  @click="toggleAlert(a.id)"
                >{{ a.message }}</td>
                <td class="text-center">
                  <v-btn
                    icon
                    variant="text"
                    size="x-small"
                    color="error"
                    @click.stop="handleDeleteAlert(a.id)"
                  >
                    <v-icon size="small">mdi-close</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <div v-else class="text-body-2 text-medium-emphasis text-center pa-6">No recent alerts.</div>
        </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { getHealth, getStats } from "@/services/system";
import { getAlerts, getAlertsHourly, deleteAlert } from "@/services/alerts";
import { getLogsHourly, getLogsNoiseHourly } from "@/services/logs";
import type { HealthStatus, StatsData, AlertItem, HourlyStat } from "@/types";
import SeverityBadge from "@/components/SeverityBadge.vue";
import StatsChart from "@/components/StatsChart.vue";

const health = ref<HealthStatus | null>(null);
const stats = ref<StatsData | null>(null);
const alerts = ref<AlertItem[]>([]);
const error = ref("");
const loading = ref(true);
const hourlyLogs = ref<HourlyStat[]>([]);
const hourlyAlerts = ref<HourlyStat[]>([]);
const hourlyNoise = ref<HourlyStat[]>([]);
const expandedAlerts = ref(new Set<number>());
const alertsPerPage = ref(50);
const chartLoading = ref(true);
const chartError = ref(false);

const fmtNum = (v: number | undefined | null): string => {
  return v != null ? v.toLocaleString() : "—";
};

const statusStats = computed(() => [
  {
    label: "Logs",
    description: "Last Hour",
    value: fmtNum(stats.value?.logs_last_hour),
    color: "text-blue-accent-3",
  },
  {
    label: "Patterns",
    description: "Total",
    value: fmtNum(stats.value?.total_patterns),
    color: "text-green-accent-3",
  },
  {
    label: "Patterns",
    description: "Pending",
    value: fmtNum(stats.value?.pending_patterns),
    color: (stats.value?.pending_patterns ?? 0) > 0 ? "text-yellow" : "text-green-accent-3",
  },
  {
    label: "Alerts",
    description: "Unacknowledged",
    value: fmtNum(stats.value?.alerts_last_24h),
    color: (stats.value?.alerts_last_24h ?? 0) > 0 ? "text-red" : "text-green-accent-3",
  },
  {
    label: "AI Calls",
    description: "Last 24h",
    value: fmtNum(stats.value?.ai_api_calls_24h),
    color: "text-purple",
  },
]);

const toggleAlert = (id: number) => {
  if (expandedAlerts.value.has(id)) expandedAlerts.value.delete(id);
  else expandedAlerts.value.add(id);
  expandedAlerts.value = new Set(expandedAlerts.value);
};

const handleDeleteAlert = async (id: number) => {
  try {
    await deleteAlert(id);
    alerts.value = alerts.value.filter((a) => a.id !== id);
  } catch {
    console.error("Failed to delete alert", id);
  }
};

const formatDateTime = (ts: string) => {
  try {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ts; }
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const filterRecentCriticalAlerts = (all: AlertItem[]) => {
  const cutoff = Date.now() - 12 * 60 * 60 * 1000;
  return all
    .filter((x) => (x.severity || "").toLowerCase() === "critical")
    .filter((x) => new Date(x.created_at).getTime() >= cutoff)
    .slice(0, alertsPerPage.value);
};

const isCurrentHourBucket = (hour: string) => {
  const d = new Date(hour);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate() &&
    d.getHours() === now.getHours()
  );
};

const fetchData = async () => {
  try {
    const [h, s, a] = await Promise.allSettled([
      getHealth(), getStats(), getAlerts({ limit: 100 }),
    ]);
    if (h.status === "fulfilled") health.value = h.value;
    if (s.status === "fulfilled") stats.value = s.value;
    if (a.status === "fulfilled") {
      const all: AlertItem[] = a.value?.items ?? (Array.isArray(a.value) ? a.value : []);
      alerts.value = filterRecentCriticalAlerts(all);
    }
    error.value = [h, s].some((r) => r.status === "rejected") ? "Backend unavailable. Check the Mite backend container." : "";
  } catch { error.value = "Backend unavailable. Check the Mite backend container."; }
  finally { loading.value = false; }
  fetchChartData();
};

const refreshKpis = async () => {
  try {
    const [h, s, a] = await Promise.allSettled([getHealth(), getStats(), getAlerts({ limit: 100 })]);
    if (h.status === "fulfilled") health.value = h.value;
    if (s.status === "fulfilled") stats.value = s.value;
    if (a.status === "fulfilled") {
      const all: AlertItem[] = a.value?.items ?? (Array.isArray(a.value) ? a.value : []);
      alerts.value = filterRecentCriticalAlerts(all);
    }
  } catch { /* silent */ }
};

let timer: ReturnType<typeof setInterval>;
onMounted(() => { fetchData(); timer = setInterval(refreshKpis, 15000); });
onUnmounted(() => { clearInterval(timer); });

const fetchChartData = async () => {
  chartLoading.value = true;
  chartError.value = false;
  try {
    const [logs, alerts, noise] = await Promise.all([getLogsHourly(100), getAlertsHourly(100), getLogsNoiseHourly(100)]);
    hourlyLogs.value = logs.filter((s) => !isCurrentHourBucket(s.hour));
    hourlyAlerts.value = alerts.filter((s) => !isCurrentHourBucket(s.hour));
    hourlyNoise.value = noise.filter((s) => !isCurrentHourBucket(s.hour));
  } catch {
    chartError.value = true;
  } finally {
    chartLoading.value = false;
  }
};
</script>

<style scoped>
.quickstats-background {
  background-color: #0d1117 !important;
  color: rgba(255, 255, 255, 0.87);
  padding: 5px;
}

.stat-label {
  color: rgb(177, 184, 192);
  font-family: var(--app-font-family);
  font-size: 1.5rem;
  line-height: 2rem;
  letter-spacing: normal;
}

.stat-value {
  font-size: 2.125rem;
  line-height: 2.5rem;
  letter-spacing: 0.0073529412em;
}

.stat-description {
  font-size: 14px;
  color: #8b949e;
  font-weight: 400;
  line-height: 1.2;
  font-family: var(--app-font-family);
}

@media (max-width: 599px) {
  .stat-description {
    font-size: 12px;
  }
}

.text-purple {
  color: #a78bfa !important;
}

.text-yellow {
  color: #eab308 !important;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-green { background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.4); }
.dot-red { background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.4); }

.alerts-table {
  color: #b1b8c0;
}

.alerts-table :deep(th) {
  color: #b1b8c0 !important;
}

.alerts-table :deep(td) {
  color: #b1b8c0 !important;
}

.detail-label {
  color: #b1b8c0 !important;
}

@media (min-width: 1280px) {
  .pattern-list-panel {
    position: sticky;
    top: 68px;
    align-self: flex-start;
    max-height: calc(100vh - 80px);
    overflow-y: auto;
    height: calc(100vh - 80px);
  }
}
</style>
