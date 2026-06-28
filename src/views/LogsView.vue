<template>
  <div>
    <!-- Mode Toggle & Header -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div class="d-flex align-center ga-3">
        <div class="text-h5 font-weight-bold">Logs</div>
        <v-btn-toggle v-model="mode" mandatory size="small">
          <v-btn value="live" prepend-icon="mdi-play-circle-outline">Live</v-btn>
          <v-btn value="search" prepend-icon="mdi-magnify">Search</v-btn>
        </v-btn-toggle>
      </div>
      <div class="d-flex align-center ga-3">
        <template v-if="mode === 'live'">
          <LiveStatusIndicator :status="liveStatus" />
          <span class="text-caption log-text">{{ filteredLogs.length }} entries</span>
          <v-btn
            size="small"
            :color="isLive ? 'warning' : 'success'"
            variant="tonal"
            @click="toggleLive"
          >{{ isLive ? 'Pause' : 'Resume' }}</v-btn>
          <v-btn size="small" variant="outlined" @click="clearLogs">Clear</v-btn>
        </template>
        <template v-if="mode === 'search'">
          <span class="text-caption log-text">{{ filteredLogs.length }} results</span>
          <v-btn size="small" variant="outlined" @click="clearSearchFilters" :disabled="!hasSearchFilters">Clear</v-btn>
        </template>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" closable class="mb-4">{{ error }}</v-alert>

    <!-- Live Mode Filters -->
    <v-row v-if="mode === 'live'" dense class="mb-4">
      <v-col cols="12" sm="6" md>
        <v-text-field
          v-model="liveFilters.search"
          density="compact"
          variant="outlined"
          placeholder="Filter messages..."
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
        ></v-text-field>
      </v-col>
      <v-col cols="6" sm="3" md="2" class="d-flex align-center">
        <v-switch
          v-model="liveFilters.hideNoise"
          density="compact"
          color="primary"
          hide-details
          label="Hide noise"
        ></v-switch>
      </v-col>
      <v-col cols="6" sm="3" md="1">
        <v-select
          v-model="liveFilters.limit"
          :items="[50, 100, 200, 500]"
          density="compact"
          variant="outlined"
          hide-details
        ></v-select>
      </v-col>
      <v-col v-if="hasLiveActiveFilters" cols="auto">
        <v-btn size="small" variant="outlined" @click="clearLiveFilters">Clear</v-btn>
      </v-col>
    </v-row>

    <!-- Search Mode Filters -->
    <v-row v-if="mode === 'search'" dense class="mb-4">
      <v-col cols="12" sm="6" md="8">
        <v-text-field
          v-model="searchFilters.keyword"
          density="compact"
          variant="outlined"
          placeholder="Search keywords..."
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          @keyup.enter="performSearch"
        ></v-text-field>
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-select
          v-model="searchFilters.limit"
          :items="[50, 100, 200, 500, 1000]"
          density="compact"
          variant="outlined"
          label="Limit"
          hide-details
        ></v-select>
      </v-col>

      <!-- Date Range Sliders -->
      <v-col cols="12" class="mb-2">
        <div class="text-caption log-label mb-2">Date Range</div>
        <v-range-slider
          v-model="dateRange"
          :min="0"
          :max="maxDays"
          step="1"
          hide-details
          color="primary"
          @update:model-value="performSearch"
        >
          <template #prepend>
            <span class="text-caption log-text">{{ getDayLabel(maxDays - dateRange[0]) }}</span>
          </template>
          <template #append>
            <span class="text-caption log-text">{{ getDayLabel(maxDays - dateRange[1]) }}</span>
          </template>
        </v-range-slider>
      </v-col>

      <v-col cols="12" class="d-flex ga-2">
        <v-btn size="small" color="primary" variant="tonal" @click="performSearch" :loading="searching">
          <v-icon start>mdi-magnify</v-icon>
          Search
        </v-btn>
        <v-btn v-if="hasSearchFilters" size="small" variant="outlined" @click="clearSearchFilters">
          Clear
        </v-btn>
      </v-col>
    </v-row>

    <!-- Log Stream -->
    <v-card v-if="logs.length" variant="outlined" color="background-100">
      <v-list density="compact" class="pa-0 bg-transparent">
        <template v-for="log in filteredLogs" :key="log.id">
          <v-list-item
            class="log-entry"
            :class="{ 'log-expanded': expandedId === log.id }"
            @click="toggleExpand(log.id)"
          >
            <div class="d-flex align-center ga-2 w-100">
              <span class="text-caption log-text text-no-wrap">{{ formatTime(log.received_at) }}</span>
              <v-chip size="x-small" variant="tonal" color="primary" class="text-uppercase">
                {{ getPatternClassification(log) }}
              </v-chip>
              <span class="text-body-2 log-text text-no-wrap" style="min-width: 80px;">{{ log.source_ip || '—' }}</span>
              <span class="text-body-2 log-text text-no-wrap" style="min-width: 160px;">{{ getPatternName(log) }}</span>
              <span class="text-body-2 log-message">{{ log.message }}</span>
            </div>
          </v-list-item>

          <!-- Expanded detail -->
          <v-list-item v-if="expandedId === log.id" class="log-detail-item">
            <v-sheet color="background-100" rounded class="pa-4">
              <v-row dense>
                <v-col cols="6" sm="3">
                  <div class="text-caption log-label text-uppercase">Source IP</div>
                  <div class="text-body-2 font-weight-medium">{{ log.source_ip || '—' }}</div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption log-label text-uppercase">Host</div>
                  <div class="text-body-2 font-weight-medium">{{ log.host || '—' }}</div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption log-label text-uppercase">Facility</div>
                  <div class="text-body-2 font-weight-medium">{{ log.facility || '—' }}</div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption log-label text-uppercase">Program</div>
                  <div class="text-body-2 font-weight-medium">{{ log.program || '—' }}</div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption log-label text-uppercase">Classification</div>
                  <div class="text-body-2 font-weight-medium text-uppercase">{{ getPatternClassification(log) }}</div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption log-label text-uppercase">PID</div>
                  <div class="text-body-2 font-weight-medium">{{ log.pid || '—' }}</div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption log-label text-uppercase">Log ID</div>
                  <div class="text-body-2 font-weight-medium">{{ log.id }}</div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption log-label text-uppercase">Pattern</div>
                  <div class="text-body-2 font-weight-medium">{{ getPatternName(log) }}</div>
                </v-col>
              </v-row>
              <div class="mt-3">
                <div class="text-caption log-label text-uppercase mb-1">Full Message</div>
                <v-sheet color="background-200" rounded class="pa-3">
                  <code class="text-body-2" style="word-break: break-all; white-space: pre-wrap;">{{ log.message }}</code>
                </v-sheet>
              </div>
            </v-sheet>
          </v-list-item>
        </template>
      </v-list>
    </v-card>

    <div v-else class="text-body-1 log-text text-center pa-12">
      <v-icon size="48" class="mb-4" color="grey">mdi-text-box-outline</v-icon>
      <div>No logs received yet. Configure a syslog source to send logs to Mite.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { getLogs, getRecentLogs } from "@/services/logs";
import { getPatterns } from "@/services/rules";
import { getSettingValue } from "@/services/system";
import type { LogItem } from "@/types";
import LiveStatusIndicator from "@/components/LiveStatusIndicator.vue";
import { formatCompactDateTime } from "@/utils/datetime";

const mode = ref<"live" | "search">("live");
const logs = ref<LogItem[]>([]);
const error = ref("");
const isLive = ref(true);
const expandedId = ref<number | null>(null);
const lastSeenId = ref(0);
const patternNames = ref<Record<number, string>>({});
const patternClassifications = ref<Record<number, string>>({});
const searching = ref(false);

// Max days to search back (from log retention setting)
const maxDays = ref(90);
const dateRange = ref([0, 90]);

const liveFilters = reactive({
  search: "",
  hideNoise: true,
  limit: 100,
});

const searchFilters = reactive({
  keyword: "",
  limit: 100,
});

const hasLiveActiveFilters = computed(() => liveFilters.search);
const hasSearchFilters = computed(() => searchFilters.keyword || dateRange.value[0] !== 0 || dateRange.value[1] !== maxDays.value);

const liveStatus = computed<"live" | "paused" | "disconnected">(() => {
  if (error.value) return "disconnected";
  return isLive.value ? "live" : "paused";
});

const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    if (mode.value === "live") {
      if (liveFilters.search && !log.message.toLowerCase().includes(liveFilters.search.toLowerCase())) return false;
      if (liveFilters.hideNoise && getPatternClassification(log).toLowerCase() === "noise") return false;
    }
    return true;
  });
});

const formatTime = (ts: string) => {
  return formatCompactDateTime(ts);
};

const getDayLabel = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const toggleExpand = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const getPatternName = (log: LogItem) => {
  if (!log.pattern_id) return "Unmatched";
  return patternNames.value[log.pattern_id] || `#${log.pattern_id}`;
};

const getPatternClassification = (log: LogItem) => {
  if (!log.pattern_id) return "unclassified";
  return patternClassifications.value[log.pattern_id] || "unclassified";
};

const refreshPatternNames = async () => {
  try {
    const response = await getPatterns({ limit: 1000, offset: 0 });
    const items = response?.items ?? [];
    const next: Record<number, string> = {};
    const nextClassifications: Record<number, string> = {};
    for (const pattern of items) {
      next[pattern.id] = pattern.title || pattern.pattern_text || `#${pattern.id}`;
      nextClassifications[pattern.id] = pattern.effective_classification || pattern.classification || "unclassified";
    }
    patternNames.value = next;
    patternClassifications.value = nextClassifications;
  } catch {
    // Keep existing cache if patterns refresh fails.
  }
};

const refreshPatternNamesIfMissing = async (items: LogItem[]) => {
  const hasMissingPatternName = items.some((log) => log.pattern_id && !patternNames.value[log.pattern_id]);
  if (hasMissingPatternName) await refreshPatternNames();
};

const toggleLive = () => { isLive.value = !isLive.value; };

const clearLogs = () => {
  logs.value = [];
  expandedId.value = null;
};

const clearLiveFilters = () => {
  liveFilters.search = "";
};

const clearSearchFilters = () => {
  searchFilters.keyword = "";
  dateRange.value = [0, maxDays.value];
  logs.value = [];
  expandedId.value = null;
};

const performSearch = async () => {
  searching.value = true;
  try {
    const daysAgoEnd = maxDays.value - dateRange.value[1];
    const daysAgoStart = maxDays.value - dateRange.value[0];

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - daysAgoEnd);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgoStart);

    const data = await getLogs({
      limit: searchFilters.limit,
      search: searchFilters.keyword || undefined,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    const items = Array.isArray(data) ? data : (data?.items ?? []);
    logs.value = items;
    await refreshPatternNamesIfMissing(items);
    expandedId.value = null;
    error.value = "";
  } catch (e: any) {
    const detail = e?.response ? `${e.response.status} ${e.response.statusText}` : e?.message || "Unknown error";
    error.value = `Search failed: ${detail}`;
  } finally {
    searching.value = false;
  }
};

const fetchInitial = async () => {
  try {
    const data = await getLogs({ limit: liveFilters.limit });
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    logs.value = items;
    await refreshPatternNamesIfMissing(items);
    if (items.length > 0) lastSeenId.value = Math.max(...items.map((l) => l.id));
    error.value = "";
  } catch (e: any) {
    const detail = e?.response ? `${e.response.status} ${e.response.statusText}` : e?.message || "Unknown error";
    error.value = `Backend unavailable: ${detail}`;
  }
};

const pollRecent = async () => {
  if (!isLive.value || mode.value !== "live") return;
  try {
    const data = await getRecentLogs({ after_id: lastSeenId.value, limit: 100 });
    const items = Array.isArray(data) ? data : [];
    await refreshPatternNamesIfMissing(items);
    if (items.length > 0) {
      logs.value = [...items, ...logs.value].slice(0, 500);
      lastSeenId.value = Math.max(...items.map((l) => l.id));
    }
    error.value = "";
  } catch (e: any) {
    if (logs.value.length === 0) {
      const detail = e?.response ? `${e.response.status} ${e.response.statusText}` : e?.message || "Unknown error";
      error.value = `Backend unavailable: ${detail}`;
    }
  }
};

let pollTimer: ReturnType<typeof setInterval>;

const loadRetentionSetting = async () => {
  try {
    const retention = await getSettingValue<number>("log_retention_days");
    if (retention && retention > 0) {
      maxDays.value = retention;
      dateRange.value = [0, retention];
    }
  } catch {
    // Use default 90 days if setting fetch fails
  }
};

onMounted(() => {
  refreshPatternNames();
  loadRetentionSetting();
  fetchInitial();
  pollTimer = setInterval(pollRecent, 2000);
});
onUnmounted(() => { clearInterval(pollTimer); });
</script>

<style scoped>
.log-entry {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
}
.log-entry:hover {
  background-color: #1c232c;
}
.log-expanded {
  background-color: rgba(255, 255, 255, 0.04);
}
.log-message {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}
.log-detail-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.log-text {
  color: #b1b8c0;
}

.log-label {
  color: #b1b8c0;
}

.log-message {
  color: #b1b8c0;
}
</style>
