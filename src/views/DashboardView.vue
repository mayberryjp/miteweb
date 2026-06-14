<template>
  <div>
    <v-alert v-if="error" type="error" variant="tonal" closable class="mb-4">{{ error }}</v-alert>

    <v-row>
      <!-- LEFT: Pattern List -->
      <v-col cols="12" lg="3" class="pattern-list-panel">
        <PatternList
          :patterns="patterns"
          :patternStats="patternStats"
          :selectedId="selectedId"
          @select="selectPattern"
        />
      </v-col>

      <!-- RIGHT: KPIs + Detail + Alerts -->
      <v-col cols="12" lg="9">
        <!-- Pattern Detail (when selected) -->
        <v-card v-if="selectedPattern" variant="outlined" color="background-100" class="mb-4 pattern-detail-card">
          <v-card-text>
            <v-btn variant="text" size="small" color="primary" class="mb-2" @click="selectedId = null">
              <v-icon start>mdi-arrow-left</v-icon> Back to overview
            </v-btn>

            <div class="text-h6 font-weight-bold mb-4">{{ patternLabel(selectedPattern) }}</div>

            <v-row dense>
              <v-col cols="6" sm="4">
                <div class="text-caption detail-label text-uppercase">Classification</div>
                <SeverityBadge :severity="selectedPattern.effective_classification || selectedPattern.classification" />
                <v-chip v-if="selectedPattern.user_override" size="x-small" color="warning" class="ml-1">override</v-chip>
              </v-col>
              <v-col cols="6" sm="4">
                <div class="text-caption detail-label text-uppercase">Host</div>
                <div class="text-body-2 font-weight-medium">{{ selectedPattern.host || '—' }}</div>
              </v-col>
              <v-col cols="6" sm="4">
                <div class="text-caption detail-label text-uppercase">Program</div>
                <div class="text-body-2 font-weight-medium">{{ selectedPattern.program || '—' }}</div>
              </v-col>
              <v-col cols="6" sm="4">
                <div class="text-caption detail-label text-uppercase">Hit Count</div>
                <div class="text-body-2 font-weight-medium">{{ selectedPattern.hit_count }}</div>
              </v-col>
              <v-col cols="6" sm="4">
                <div class="text-caption detail-label text-uppercase">First Seen</div>
                <div class="text-body-2 font-weight-medium">{{ formatTime(selectedPattern.first_seen_at) }}</div>
              </v-col>
              <v-col cols="6" sm="4">
                <div class="text-caption detail-label text-uppercase">Last Seen</div>
                <div class="text-body-2 font-weight-medium">{{ formatTime(selectedPattern.last_seen_at) }}</div>
              </v-col>
            </v-row>

            <div v-if="selectedPattern.ai_explanation" class="mt-4">
              <div class="text-caption detail-label text-uppercase mb-1">AI Explanation</div>
              <div class="text-body-2">{{ selectedPattern.ai_explanation }}</div>
            </div>

            <div class="mt-4">
              <div class="text-caption detail-label text-uppercase mb-1">Pattern</div>
              <v-sheet color="background-100" rounded class="pa-3">
                <code class="text-body-2" style="word-break: break-all; white-space: pre-wrap;">{{ selectedPattern.pattern_text }}</code>
              </v-sheet>
            </div>

            <div v-if="selectedPattern.match_regex" class="mt-4">
              <div class="text-caption detail-label text-uppercase mb-1">Match Regex</div>
              <v-textarea
                v-model="regexValue"
                variant="outlined"
                density="compact"
                rows="4"
                class="mb-2"
                style="font-family: monospace;"
              ></v-textarea>
              <div class="d-flex ga-2">
                <v-btn size="small" variant="outlined" @click="copyRegex">{{ copyLabel }}</v-btn>
                <v-btn size="small" color="primary" :disabled="savingRegex || regexValue === selectedPattern.match_regex" :loading="savingRegex" @click="saveRegex(selectedPattern.id)">Save Regex</v-btn>
              </div>
            </div>

            <div class="mt-4">
              <div class="text-caption detail-label text-uppercase mb-1">Sample Message</div>
              <v-sheet color="background-100" rounded class="pa-3">
                <code class="text-body-2" style="word-break: break-all; white-space: pre-wrap;">{{ selectedPattern.sample_message }}</code>
              </v-sheet>
            </div>

            <div class="mt-4">
              <div class="text-caption detail-label text-uppercase mb-1">Source IPs</div>
              <div v-if="patternSourceIps.length" class="d-flex flex-wrap ga-1">
                <v-chip v-for="ip in patternSourceIps" :key="ip" size="small" variant="outlined">{{ ip }}</v-chip>
              </div>
              <div v-else class="text-body-2 detail-label">{{ loadingIps ? 'Loading...' : 'No source IPs found' }}</div>
            </div>

            <div class="mt-4">
              <div class="text-caption detail-label text-uppercase mb-1">Override Classification</div>
              <div class="d-flex align-center ga-2">
                <v-select
                  v-model="overrideValue"
                  :items="overrideOptions"
                  item-title="text"
                  item-value="value"
                  variant="outlined"
                  density="compact"
                  style="max-width: 220px;"
                ></v-select>
                <v-btn size="small" color="primary" :disabled="saving" :loading="saving" @click="saveOverride(selectedPattern.id)">Save</v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- KPI Banner (default view) -->
        <v-row v-if="!selectedPattern" class="quickstats-background ma-0 rounded-lg mb-4">
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

        <!-- Sub stats -->
        <div v-if="!selectedPattern" class="d-flex flex-wrap ga-4 mb-4 px-1">
          <div class="d-flex align-center ga-1 text-body-2 text-medium-emphasis">
            <span class="status-dot" :class="health?.status === 'ok' ? 'dot-green' : 'dot-red'"></span>
            Backend {{ health?.status === 'ok' ? 'Online' : 'Offline' }}
          </div>
          <div class="d-flex align-center ga-1 text-body-2 text-medium-emphasis">
            Logs (24h): <span class="font-weight-medium">{{ stats?.logs_last_24h ?? '—' }}</span>
          </div>
          <div v-if="stats?.database_size_bytes" class="d-flex align-center ga-1 text-body-2 text-medium-emphasis">
            DB: <span class="font-weight-medium">{{ formatBytes(stats.database_size_bytes) }}</span>
          </div>
        </div>

        <!-- Stats Chart -->
        <div v-if="!selectedPattern" class="mb-4">
          <StatsChart
            :log-stats="hourlyLogs"
            :alert-stats="hourlyAlerts"
            :loading="chartLoading"
            :error="chartError"
          />
        </div>

        <!-- Recent Alerts -->
        <div v-if="!selectedPattern">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-1 font-weight-bold">Recent Alerts</div>
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
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in alerts" :key="a.id">
                <td class="text-no-wrap text-body-2">{{ formatDateTime(a.created_at) }}</td>
                <td><SeverityBadge :severity="a.severity" /></td>
                <td class="text-body-2">{{ a.source_ip || a.host || '—' }}</td>
                <td
                  class="text-body-2"
                  :class="{ 'text-truncate': !expandedAlerts.has(a.id) }"
                  :style="!expandedAlerts.has(a.id) ? 'max-width: 400px; cursor: pointer;' : 'cursor: pointer;'"
                  @click="toggleAlert(a.id)"
                >{{ a.message }}</td>
              </tr>
            </tbody>
          </v-table>
          <div v-else class="text-body-2 text-medium-emphasis text-center pa-6">No recent high/critical alerts.</div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { getHealth, getStats } from "@/services/system";
import { getAlerts, getAlertsHourly } from "@/services/alerts";
import { getLogsHourly } from "@/services/logs";
import { getPatterns, updatePattern, getPatternStats } from "@/services/rules";
import type { HealthStatus, StatsData, AlertItem, PatternItem, HourlyStat } from "@/types";
import SeverityBadge from "@/components/SeverityBadge.vue";
import PatternList from "@/components/PatternList.vue";
import StatsChart from "@/components/StatsChart.vue";

const health = ref<HealthStatus | null>(null);
const stats = ref<StatsData | null>(null);
const alerts = ref<AlertItem[]>([]);
const patterns = ref<PatternItem[]>([]);
const totalPatterns = ref(0);
const patternStats = ref<Record<string, { hour: string; count: number }[]>>({});
const error = ref("");
const loading = ref(true);
const selectedId = ref<number | null>(null);
const overrideValue = ref("");
const regexValue = ref("");
const saving = ref(false);
const savingRegex = ref(false);
const copyLabel = ref("Copy");
const expandedAlerts = ref(new Set<number>());
const alertsPerPage = ref(50);
const hourlyLogs = ref<HourlyStat[]>([]);
const hourlyAlerts = ref<HourlyStat[]>([]);
const chartLoading = ref(true);
const chartError = ref(false);

const overrideOptions = [
  { text: "None (use AI)", value: "" },
  { text: "Critical", value: "critical" },
  { text: "High", value: "high" },
  { text: "Medium", value: "medium" },
  { text: "Low", value: "low" },
  { text: "Noise", value: "noise" },
];

const statusStats = computed(() => [
  {
    label: "Logs",
    description: "Last Hour",
    value: stats.value?.logs_last_hour ?? "—",
    color: "text-blue-accent-3",
  },
  {
    label: "Patterns",
    description: "Total",
    value: stats.value?.total_patterns ?? "—",
    color: "text-green-accent-3",
  },
  {
    label: "Patterns",
    description: "Pending",
    value: stats.value?.pending_patterns ?? "—",
    color: (stats.value?.pending_patterns ?? 0) > 0 ? "text-yellow" : "text-green-accent-3",
  },
  {
    label: "Alerts",
    description: "Unacknowledged",
    value: stats.value?.alerts_last_24h ?? "—",
    color: (stats.value?.alerts_last_24h ?? 0) > 0 ? "text-red" : "text-green-accent-3",
  },
  {
    label: "AI Calls",
    description: "Last 24h",
    value: stats.value?.ai_api_calls_24h ?? "—",
    color: "text-purple",
  },
]);

const toggleAlert = (id: number) => {
  if (expandedAlerts.value.has(id)) expandedAlerts.value.delete(id);
  else expandedAlerts.value.add(id);
  expandedAlerts.value = new Set(expandedAlerts.value);
};

const patternSourceIps = ref<string[]>([]);
const loadingIps = ref(false);

const selectedPattern = computed(() =>
  selectedId.value ? patterns.value.find((p) => p.id === selectedId.value) ?? null : null
);

const patternLabel = (p: PatternItem) => {
  if (p.title) return p.title.toUpperCase();
  if (p.host && p.program) return `${p.host} / ${p.program}`.toUpperCase();
  if (p.host) return p.host.toUpperCase();
  if (p.program) return p.program.toUpperCase();
  return p.pattern_text.substring(0, 40).toUpperCase();
};

const selectPattern = (p: PatternItem) => {
  if (selectedId.value === p.id) { selectedId.value = null; return; }
  selectedId.value = p.id;
  overrideValue.value = p.user_override || "";
  regexValue.value = p.match_regex || "";
  copyLabel.value = "Copy";
  fetchPatternIps(p.id);
};

const fetchPatternIps = async (patternId: number) => {
  loadingIps.value = true;
  patternSourceIps.value = [];
  try {
    const data = await getAlerts({ limit: 100, pattern_id: patternId });
    const items: AlertItem[] = data?.items ?? [];
    const ips = new Set<string>();
    for (const a of items) { if (a.source_ip) ips.add(a.source_ip); }
    patternSourceIps.value = [...ips].sort();
  } catch { patternSourceIps.value = []; }
  finally { loadingIps.value = false; }
};

const copyRegex = async () => {
  try {
    await navigator.clipboard.writeText(regexValue.value);
    copyLabel.value = "Copied!";
    setTimeout(() => { copyLabel.value = "Copy"; }, 1500);
  } catch { copyLabel.value = "Failed"; }
};

const saveRegex = async (id: number) => {
  savingRegex.value = true;
  try { await updatePattern(id, { match_regex: regexValue.value }); await fetchData(); }
  catch { error.value = "Failed to update regex."; }
  finally { savingRegex.value = false; }
};

const saveOverride = async (id: number) => {
  saving.value = true;
  try { await updatePattern(id, { classification: overrideValue.value || undefined }); await fetchData(); }
  catch { error.value = "Failed to update pattern."; }
  finally { saving.value = false; }
};

const formatTime = (ts: string) => {
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
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

const fetchData = async () => {
  try {
    const [h, s, a, p, ps] = await Promise.allSettled([
      getHealth(), getStats(), getAlerts({ limit: 100 }),
      getPatterns({ limit: 200 }), getPatternStats(12),
    ]);
    if (h.status === "fulfilled") health.value = h.value;
    if (s.status === "fulfilled") stats.value = s.value;
    if (a.status === "fulfilled") {
      const all: AlertItem[] = a.value?.items ?? (Array.isArray(a.value) ? a.value : []);
      alerts.value = all.filter((x) => x.severity === "critical" || x.severity === "high" || x.severity === "crit" || x.severity === "alert" || x.severity === "emerg").slice(0, alertsPerPage.value);
      if (!alerts.value.length) alerts.value = all.slice(0, alertsPerPage.value);
    }
    if (p.status === "fulfilled") { patterns.value = p.value?.items ?? []; totalPatterns.value = p.value?.total ?? 0; }
    if (ps.status === "fulfilled") { patternStats.value = ps.value ?? {}; }
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
      alerts.value = all.filter((x) => x.severity === "critical" || x.severity === "high" || x.severity === "crit" || x.severity === "alert" || x.severity === "emerg").slice(0, alertsPerPage.value);
      if (!alerts.value.length) alerts.value = all.slice(0, alertsPerPage.value);
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
    const [logs, alerts] = await Promise.all([getLogsHourly(24), getAlertsHourly(24)]);
    hourlyLogs.value = logs;
    hourlyAlerts.value = alerts;
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

.pattern-detail-card {
  color: #b1b8c0 !important;
}

.pattern-detail-card :deep(.v-card-text) {
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
