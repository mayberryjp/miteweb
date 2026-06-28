<template>
  <div class="pattern-details">
    <v-alert v-if="error" type="error" variant="tonal" closable class="mb-4">{{ error }}</v-alert>

    <v-snackbar v-model="snackbar" :timeout="2500" color="success" location="top">
      {{ snackbarMessage }}
    </v-snackbar>

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
                    <div class="pattern-title flex-grow-1">
                      <div class="d-flex align-start ga-2">
                        <h2 v-if="!editingTitle" class="text-grey custom-heading">
                          {{ patternLabel(pattern) }}
                        </h2>
                        <div v-else class="w-100">
                          <v-text-field
                            v-model="titleDraft"
                            variant="plain"
                            density="default"
                            hide-details
                            class="inline-title-editor"
                          ></v-text-field>
                          <div class="d-flex ga-2 mt-2">
                            <v-btn size="small" color="primary" :loading="savingTitle" @click="saveTitle">Save</v-btn>
                            <v-btn size="small" variant="outlined" @click="cancelEditTitle">Cancel</v-btn>
                          </div>
                        </div>
                        <v-btn
                          v-if="!editingTitle"
                          icon="mdi-pencil"
                          size="x-small"
                          variant="text"
                          color="primary"
                          @click="startEditTitle"
                        ></v-btn>
                      </div>

                      <div class="d-flex align-start ga-2 mt-1">
                        <div v-if="!editingAiExplanation" class="text-grey" style="font-size: 14px; line-height: 1.4; font-weight: 400; letter-spacing: 0.25px; opacity: 0.7;">
                          {{ pattern.ai_explanation || "No AI explanation yet." }}
                        </div>
                        <div v-else class="w-100">
                          <v-textarea
                            v-model="aiExplanationDraft"
                            variant="outlined"
                            rows="3"
                            auto-grow
                            hide-details
                          ></v-textarea>
                          <div class="d-flex ga-2 mt-2">
                            <v-btn size="small" color="primary" :loading="savingAiExplanation" @click="saveAiExplanation">Save</v-btn>
                            <v-btn size="small" variant="outlined" @click="cancelEditAiExplanation">Cancel</v-btn>
                          </div>
                        </div>
                        <v-btn
                          v-if="!editingAiExplanation"
                          icon="mdi-pencil"
                          size="x-small"
                          variant="text"
                          color="primary"
                          @click="startEditAiExplanation"
                        ></v-btn>
                      </div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="pattern-actions">
                    <v-btn-group variant="outlined" class="rounded-pill pattern-actions-group">
                      <v-btn
                        color="error"
                        @click="deletePatternDialog = true"
                        :loading="deletingPattern"
                        density="comfortable"
                        class="text-body-2"
                      >
                        <v-icon icon="mdi-delete" class="mr-2"></v-icon>
                        Delete Pattern
                      </v-btn>
                      <v-btn
                        v-if="isNoisePattern"
                        :color="isFilterAtListenerEnabled ? 'warning' : 'primary'"
                        @click="requestToggleFilterAtListener"
                        :loading="togglingFilterAtListener"
                        density="comfortable"
                        class="text-body-2"
                      >
                        <v-icon icon="mdi-filter-cog" class="mr-2"></v-icon>
                        {{ filterAtListenerButtonLabel }}
                      </v-btn>
                    </v-btn-group>
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

    <!-- Delete Pattern Confirmation Dialog -->
    <v-dialog v-model="deletePatternDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Delete Pattern</v-card-title>
        <v-card-text>
          Are you sure you want to delete this pattern? This will also delete all associated stats, alerts, and logs. This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="deletePatternDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" variant="text" @click="handleDeletePattern">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="filterAtListenerDialog" max-width="620">
      <v-card>
        <v-card-title class="text-h6">Enable Filter At Listener</v-card-title>
        <v-card-text>
          <div class="mb-2 font-weight-medium">
            The purpose of this rule is to remove high volume noise messages from future database storage. Use with caution.
          </div>
          <div class="mb-2">
            This pattern will be dropped at the listener.
            No logs matching this pattern will be written to the database.
            This is irreversible per log and logs already in DB will remain.
          </div>
          <div class="mb-2">
            Note: tokenization of logs is not applied at the listener. Make sure the
            regex does not include any tokenized values, and adjust it if it does.
          </div>
          <div>
            Continue enabling listener-side filtering for this pattern?
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="filterAtListenerDialog = false">
            Cancel
          </v-btn>
          <v-btn color="warning" variant="text" :loading="togglingFilterAtListener" @click="confirmEnableFilterAtListener">
            Enable
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { updatePattern, getPatternTimeSeries, getPatternLogs, deletePattern } from "@/services/rules";
import type { PatternItem, HourlyStat, LogItem } from "@/types";
import StatsChart from "@/components/StatsChart.vue";
import PatternStats from "@/components/PatternStats.vue";
import { getClassificationColor, getClassificationIcon, getPatternClassification } from "@/utils/classification";
import { formatCompactDateTimeNoSeconds } from "@/utils/datetime";

const route = useRoute();
const router = useRouter();

const patternId = computed(() => Number(route.params.id));
const patterns = inject<Ref<PatternItem[]>>("patterns", ref([]));
const refreshPatterns = inject<() => Promise<void>>("refreshPatterns", async () => {});
const error = ref("");
const loading = ref(true);
const overrideValue = ref("");
const regexValue = ref("");
const saving = ref(false);
const savingRegex = ref(false);
const copyLabel = ref("Copy");
const snackbar = ref(false);
const snackbarMessage = ref("Classification updated");
const regexExpanded = ref(false);
const editingTitle = ref(false);
const titleDraft = ref("");
const savingTitle = ref(false);
const editingAiExplanation = ref(false);
const aiExplanationDraft = ref("");
const savingAiExplanation = ref(false);
const deletingPattern = ref(false);
const deletePatternDialog = ref(false);
const togglingFilterAtListener = ref(false);
const filterAtListenerDialog = ref(false);

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

const isNoisePattern = computed(() => {
  const cls = pattern.value ? getPatternClassification(pattern.value) : "";
  return cls === "noise";
});

const isFilterAtListenerEnabled = computed(() => Boolean(pattern.value?.filter_at_listener));

const filterAtListenerButtonLabel = computed(() =>
  `Filter Out Pattern At Listener: ${isFilterAtListenerEnabled.value ? "Enabled" : "Disabled"}`
);

const patternLabel = (p: PatternItem) => {
  if (p.title) return p.title.toUpperCase();
  if (p.host && p.program) return `${p.host} / ${p.program}`.toUpperCase();
  if (p.host) return p.host.toUpperCase();
  if (p.program) return p.program.toUpperCase();
  return p.pattern_text.substring(0, 40).toUpperCase();
};

const classColor = (p: PatternItem): string => {
  return getClassificationColor(p);
};

const classIconName = (p: PatternItem): string => {
  return getClassificationIcon(p);
};

const loadPatternData = async (id: number) => {
  overrideValue.value = "";
  regexValue.value = "";
  copyLabel.value = "Copy";
  editingTitle.value = false;
  editingAiExplanation.value = false;
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

const startEditTitle = () => {
  if (!pattern.value) return;
  titleDraft.value = pattern.value.title || "";
  editingTitle.value = true;
};

const cancelEditTitle = () => {
  editingTitle.value = false;
};

const saveTitle = async () => {
  if (!pattern.value) return;
  savingTitle.value = true;
  try {
    await updatePattern(pattern.value.id, { title: titleDraft.value.trim() || undefined });
    await refreshPatterns();
    editingTitle.value = false;
  } catch {
    error.value = "Failed to update title.";
  } finally {
    savingTitle.value = false;
  }
};

const startEditAiExplanation = () => {
  if (!pattern.value) return;
  aiExplanationDraft.value = pattern.value.ai_explanation || "";
  editingAiExplanation.value = true;
};

const cancelEditAiExplanation = () => {
  editingAiExplanation.value = false;
};

const saveAiExplanation = async () => {
  if (!pattern.value) return;
  savingAiExplanation.value = true;
  try {
    await updatePattern(pattern.value.id, {
      ai_explanation: aiExplanationDraft.value.trim() || undefined,
    });
    await refreshPatterns();
    editingAiExplanation.value = false;
  } catch {
    error.value = "Failed to update AI explanation.";
  } finally {
    savingAiExplanation.value = false;
  }
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
    snackbarMessage.value = "Classification updated";
    snackbar.value = true;
    await refreshPatterns();
  } catch { error.value = "Failed to update pattern."; }
  finally { saving.value = false; }
};

const setFilterAtListener = async (enabled: boolean) => {
  if (!pattern.value) return;
  togglingFilterAtListener.value = true;
  try {
    await updatePattern(pattern.value.id, { filter_at_listener: enabled });
    await refreshPatterns();
    snackbarMessage.value = enabled
      ? "Pattern will be dropped at listener"
      : "Pattern listener filtering disabled";
    snackbar.value = true;
    if (enabled) filterAtListenerDialog.value = false;
  } catch {
    error.value = "Failed to update listener filter setting.";
  } finally {
    togglingFilterAtListener.value = false;
  }
};

const requestToggleFilterAtListener = async () => {
  if (!pattern.value) return;
  if (!isNoisePattern.value) return;
  if (isFilterAtListenerEnabled.value) {
    await setFilterAtListener(false);
    return;
  }
  filterAtListenerDialog.value = true;
};

const confirmEnableFilterAtListener = async () => {
  await setFilterAtListener(true);
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
  try { await updatePattern(id, { match_regex: regexValue.value }); await refreshPatterns(); }
  catch { error.value = "Failed to update regex."; }
  finally { savingRegex.value = false; }
};

const handleDeletePattern = async () => {
  if (!pattern.value) return;
  deletingPattern.value = true;
  try {
    await deletePattern(pattern.value.id);
    deletePatternDialog.value = false;
    await refreshPatterns();
    router.push({ name: "dashboard" });
  } catch {
    error.value = "Failed to delete pattern.";
  } finally {
    deletingPattern.value = false;
  }
};

const formatDateTime = (ts: string) => {
  return formatCompactDateTimeNoSeconds(ts);
};

onMounted(async () => {
  if (!patterns.value.length) {
    await refreshPatterns();
  }
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

.pattern-actions {
  display: flex;
  align-items: center;
}

/* Let the outlined button group wrap instead of overflowing on narrow screens */
.pattern-actions-group {
  height: auto !important;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.pattern-actions-group > .v-btn {
  margin-left: 0 !important;
}

.pattern-actions .v-btn-group {
  background-color: #0d1117;
  border: 1px solid #0d1117 !important;
}

.pattern-actions .v-btn {
  text-transform: none;
  font-weight: 400;
}

.inline-title-editor {
  max-width: 100%;
}

.inline-title-editor :deep(.v-input__control),
.inline-title-editor :deep(.v-field),
.inline-title-editor :deep(.v-field__field) {
  min-height: 40px !important;
  padding: 0 !important;
}

.inline-title-editor :deep(input) {
  color: #b1b8c0 !important;
  font-size: 34px !important;
  font-weight: 500 !important;
  letter-spacing: 0.25px !important;
  line-height: 40px !important;
  font-family: var(--app-font-family) !important;
  text-transform: uppercase;
  padding: 0 !important;
}
</style>
