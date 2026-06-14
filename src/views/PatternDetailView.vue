<template>
  <div class="pattern-details">
    <v-alert v-if="error" type="error" variant="tonal" closable class="mb-4">{{ error }}</v-alert>

    <v-snackbar v-model="snackbar" :timeout="2000" color="success" location="top">
      Classification updated
    </v-snackbar>

    <v-row>
      <!-- LEFT: Pattern List -->
      <v-col cols="12" lg="3" class="pattern-list-panel">
        <PatternList
          :patterns="patterns"
          :patternStats="patternStats"
          :selectedId="patternId"
          @select="onSelectPattern"
        />
      </v-col>

      <!-- RIGHT: Pattern Detail -->
      <v-col cols="12" lg="9">
        <transition name="slide-up" mode="out-in">
          <div v-if="pattern" key="detail-content" class="main-content">
            <!-- Header Card -->
            <v-card color="#0d1117" class="mb-4">
              <v-card-text>
                <div class="d-flex flex-column flex-wrap">
                  <div class="d-flex flex-column flex-sm-row align-start align-sm-center">
                    <!-- Classification Icon -->
                    <div class="detail-icon-container me-sm-4 mb-3 mb-sm-0 position-relative">
                      <v-icon :color="classColor(pattern)" size="120" class="icon-with-background">{{ classIconName(pattern) }}</v-icon>
                      <div class="classification-banner" :style="{ backgroundColor: classColor(pattern) }">
                        <span>{{ (pattern.effective_classification || pattern.classification || 'pending').toUpperCase() }}</span>
                      </div>
                    </div>

                    <!-- Pattern Info -->
                    <div class="pattern-title">
                      <h2 class="text-grey custom-heading">
                        {{ patternLabel(pattern) }}
                      </h2>
                      <div v-if="pattern.ai_explanation" class="text-grey mt-1" style="font-size: 14px; line-height: 1.4; font-weight: 400; letter-spacing: 0.25px; opacity: 0.7;">
                        {{ pattern.ai_explanation }}
                      </div>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <v-row class="mb-4">
              <!-- Edit Pattern (collapsible) -->
              <v-col cols="12">
                <v-card color="#0d1117" height="100%">
                  <v-card-title
                    class="d-flex align-center collapsible-header"
                    @click="regexExpanded = !regexExpanded"
                  >
                    <v-icon size="16" class="mr-2" color="#2196F3">{{ regexExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
                    Edit Pattern Match and Classification
                  </v-card-title>
                  <v-card-text v-if="regexExpanded">
                    <div class="d-flex align-center ga-2 mb-4">
                      <div class="text-caption detail-label text-uppercase">Classification</div>
                      <v-select
                        v-model="overrideValue"
                        :items="overrideOptions"
                        item-title="text"
                        item-value="value"
                        variant="outlined"
                        density="compact"
                        hide-details
                        :loading="saving"
                        style="max-width: 180px;"
                        @update:model-value="autoSaveClassification"
                      ></v-select>
                    </div>

                    <div v-if="pattern.match_regex">
                      <div class="text-caption detail-label text-uppercase mb-1">Match Regex</div>
                      <v-textarea
                        v-model="regexValue"
                        variant="outlined"
                        density="compact"
                        rows="2"
                        auto-grow
                        class="mb-2"
                        style="font-family: monospace;"
                      ></v-textarea>
                      <div class="d-flex ga-2">
                        <v-btn size="small" variant="outlined" @click="copyRegex">{{ copyLabel }}</v-btn>
                        <v-btn size="small" color="primary" :disabled="savingRegex || regexValue === pattern.match_regex" :loading="savingRegex" @click="saveRegex(pattern.id)">Save Regex</v-btn>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Pattern Stats -->
            <PatternStats :pattern="pattern" />

            <!-- Per-pattern time series chart -->
            <v-card color="#0d1117" class="mb-4 pa-2">
              <StatsChart
                :log-stats="patternLogStats"
                :alert-stats="patternAlertStats"
                :loading="patternChartLoading"
                :error="patternChartError"
              />
            </v-card>

            <!-- Per-pattern log listing -->
            <v-card color="#0d1117" class="mb-4">
              <v-card-title class="d-flex align-center justify-space-between">
                <span class="text-white">Pattern Logs</span>
                <span class="text-caption text-grey" v-if="patternLogsTotal">
                  {{ patternLogsTotal.toLocaleString() }} total
                </span>
              </v-card-title>
              <v-card-text>
                <v-progress-linear v-if="patternLogsLoading" indeterminate color="primary" class="mb-2"></v-progress-linear>
                <v-table v-if="patternLogs.length" density="compact" class="rounded-lg alerts-table" style="background-color: #0d1117;">
                  <thead>
                    <tr>
                      <th style="width: 140px;">Time</th>
                      <th style="width: 120px;">Source</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="l in patternLogs" :key="l.id">
                      <td class="text-no-wrap text-body-2">{{ formatDateTime(l.received_at) }}</td>
                      <td class="text-body-2">{{ l.source_ip || l.host || '—' }}</td>
                      <td class="text-body-2" style="max-width: 400px; word-break: break-all;">{{ l.message }}</td>
                    </tr>
                  </tbody>
                </v-table>
                <div v-else-if="!patternLogsLoading" class="text-body-2 text-medium-emphasis text-center pa-4">
                  No logs found for this pattern.
                </div>
                <div v-if="patternLogsTotalPages > 1" class="d-flex justify-center mt-3">
                  <v-pagination
                    v-model="patternLogsPage"
                    :length="patternLogsTotalPages"
                    :total-visible="5"
                    density="compact"
                    rounded
                    @update:model-value="changePatternLogsPage"
                  ></v-pagination>
                </div>
              </v-card-text>
            </v-card>
          </div>

          <!-- Loading state -->
          <div v-else-if="loading" key="loading-content" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          </div>

          <div v-else key="notfound-content" class="text-body-2 text-medium-emphasis text-center pa-8">
            Pattern not found.
          </div>
        </transition>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getPatterns, updatePattern, getPatternStats, getPatternTimeSeries, getPatternLogs } from "@/services/rules";
import type { PatternItem, HourlyStat, LogItem } from "@/types";
import SeverityBadge from "@/components/SeverityBadge.vue";
import PatternList from "@/components/PatternList.vue";
import StatsChart from "@/components/StatsChart.vue";
import AlertBarChart from "@/components/AlertBarChart.vue";
import PatternStats from "@/components/PatternStats.vue";

const route = useRoute();
const router = useRouter();

const patternId = computed(() => Number(route.params.id));
const patterns = ref<PatternItem[]>([]);
const patternStats = ref<Record<string, { hour: string; count: number }[]>>({});
const error = ref("");
const loading = ref(true);
const overrideValue = ref("");
const regexValue = ref("");
const saving = ref(false);
const savingRegex = ref(false);
const copyLabel = ref("Copy");
const snackbar = ref(false);
const regexExpanded = ref(false);
const aiExpanded = ref(false);

const patternLogStats = ref<HourlyStat[]>([]);
const patternAlertStats = ref<HourlyStat[]>([]);
const patternChartLoading = ref(false);
const patternChartError = ref(false);
const patternLogs = ref<LogItem[]>([]);
const patternLogsTotal = ref(0);
const patternLogsLoading = ref(false);
const patternLogsPage = ref(1);
const patternLogsPerPage = ref(100);

const overrideOptions = [
  { text: "Critical", value: "critical" },
  { text: "High", value: "high" },
  { text: "Medium", value: "medium" },
  { text: "Low", value: "low" },
  { text: "Noise", value: "noise" },
];

const pattern = computed(() =>
  patterns.value.find((p) => p.id === patternId.value) ?? null
);

const patternLabel = (p: PatternItem) => {
  if (p.title) return p.title.toUpperCase();
  if (p.host && p.program) return `${p.host} / ${p.program}`.toUpperCase();
  if (p.host) return p.host.toUpperCase();
  if (p.program) return p.program.toUpperCase();
  return p.pattern_text.substring(0, 40).toUpperCase();
};

const classColor = (p: PatternItem): string => {
  const cls = (p.effective_classification || p.classification || "pending").toLowerCase();
  if (cls === "critical") return "#F5A623";
  if (cls === "high") return "#1565C0";
  if (cls === "medium") return "#2EC4A0";
  if (cls === "low") return "#64B5F6";
  if (cls === "noise") return "#5a7d7a";
  return "#2196F3";
};

const classIconName = (p: PatternItem): string => {
  const cls = (p.effective_classification || p.classification || "pending").toLowerCase();
  if (cls === "critical") return "mdi-alert-octagon";
  if (cls === "high") return "mdi-alert-circle";
  if (cls === "medium") return "mdi-alert";
  if (cls === "low") return "mdi-information";
  if (cls === "noise") return "mdi-volume-off";
  return "mdi-clock-outline";
};

const getDetailAlertIntervals = (id: number) => {
  const intervals = patternStats.value[String(id)] || [];
  return intervals.map((i: { count: number }) => i.count);
};

const onSelectPattern = (p: PatternItem) => {
  router.push({ name: "pattern-detail", params: { id: p.id } });
};

const loadPatternData = async (id: number) => {
  overrideValue.value = "";
  regexValue.value = "";
  copyLabel.value = "Copy";
  patternLogsPage.value = 1;

  const p = patterns.value.find((x) => x.id === id);
  if (p) {
    overrideValue.value = p.user_override || p.effective_classification || p.classification || "";
    regexValue.value = p.match_regex || "";
  }

  await Promise.all([
    fetchPatternChart(id),
    fetchPatternLogData(id),
  ]);
};

const fetchPatternChart = async (id: number) => {
  patternChartLoading.value = true;
  patternChartError.value = false;
  patternLogStats.value = [];
  patternAlertStats.value = [];
  try {
    const data = await getPatternTimeSeries(id, 100);
    patternLogStats.value = data.stats || [];
    patternAlertStats.value = [];
  } catch {
    patternChartError.value = true;
  } finally {
    patternChartLoading.value = false;
  }
};

const fetchPatternLogData = async (id: number) => {
  patternLogsLoading.value = true;
  try {
    const offset = (patternLogsPage.value - 1) * patternLogsPerPage.value;
    const data = await getPatternLogs(id, { limit: patternLogsPerPage.value, offset });
    patternLogs.value = data.items || [];
    patternLogsTotal.value = data.total || 0;
  } catch {
    patternLogs.value = [];
    patternLogsTotal.value = 0;
  } finally {
    patternLogsLoading.value = false;
  }
};

const patternLogsTotalPages = computed(() =>
  Math.max(1, Math.ceil(patternLogsTotal.value / patternLogsPerPage.value))
);

const changePatternLogsPage = (page: number) => {
  patternLogsPage.value = page;
  fetchPatternLogData(patternId.value);
};

const autoSaveClassification = async () => {
  saving.value = true;
  try {
    await updatePattern(patternId.value, { classification: overrideValue.value || undefined });
    snackbar.value = true;
    await fetchPatterns();
  } catch { error.value = "Failed to update pattern."; }
  finally { saving.value = false; }
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
  try { await updatePattern(id, { match_regex: regexValue.value }); await fetchPatterns(); }
  catch { error.value = "Failed to update regex."; }
  finally { savingRegex.value = false; }
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

const fetchPatterns = async () => {
  try {
    const [p, ps] = await Promise.allSettled([getPatterns(), getPatternStats(12)]);
    if (p.status === "fulfilled") { patterns.value = p.value?.items ?? []; }
    if (ps.status === "fulfilled") { patternStats.value = ps.value ?? {}; }
  } catch { /* silent */ }
};

onMounted(async () => {
  await fetchPatterns();
  loading.value = false;
  if (patternId.value) {
    await loadPatternData(patternId.value);
  }
});

watch(patternId, async (newId) => {
  if (newId) {
    await loadPatternData(newId);
  }
});
</script>

<style scoped>
.pattern-details {
  animation: fadeIn 0.3s ease-in-out;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: center bottom;
}

.slide-up-enter-from {
  transform: translateY(60px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-60px);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Size comes from Vuetify text utilities; this only styles appearance + wrap */
.custom-heading {
  text-transform: uppercase !important;
  font-size: 34px !important;
  font-weight: 500;
  letter-spacing: 0.25px;
  line-height: 40px;
  color: #b1b8c0 !important;
  font-family: var(--app-font-family);
  word-break: break-word;
}

.collapsible-header {
  color: rgb(33, 150, 243) !important;
  font-family: Roboto, sans-serif !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  letter-spacing: 0.25px !important;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  text-transform: none !important;
  min-height: auto !important;
  padding: 12px 16px !important;
}

.text-subtitle-1 {
  color: rgb(92, 221, 139) !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  margin-top: 3px;
  word-break: break-word;
}

.detail-icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 120px;
  margin-right: 16px;
  position: relative;
}

.icon-with-background {
  opacity: 0.15;
}

.pattern-title {
  flex: 1;
}

.classification-banner {
  position: absolute;
  top: 0;
  left: 0;
  padding: 4px 8px;
  text-align: center;
  color: white;
  font-weight: bold;
  border-radius: 50px;
  font-size: 14px;
  opacity: 0.95;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 28px;
  height: 28px;
}

.classification-banner span {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.detail-actions {
  border-top: 1px solid #21262d;
  padding-top: 12px;
}

.detail-label {
  color: #b1b8c0 !important;
}

.alerts-table {
  color: #b1b8c0;
}

.alerts-table :deep(th) {
  color: #b1b8c0 !important;
}

.alerts-table :deep(td) {
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
