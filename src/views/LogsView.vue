<template>
  <div class="logs-page">
    <div class="page-header">
      <h1 class="page-title">Live Logs</h1>
      <div class="header-controls">
        <LiveStatusIndicator :status="liveStatus" />
        <span class="log-count mono">{{ filteredLogs.length }} entries</span>
        <button class="btn" :class="isLive ? 'btn-warning' : 'btn-success'" @click="toggleLive">
          {{ isLive ? 'Pause' : 'Resume' }}
        </button>
      </div>
    </div>

    <ApiErrorBanner v-if="error" :message="error" />

    <!-- Filters -->
    <div class="filter-bar">
      <input v-model="filters.search" type="text" class="filter-input filter-search" placeholder="Filter messages..." />
      <select v-model="filters.severity" class="filter-input filter-sm">
        <option value="">All Severities</option>
        <option v-for="s in severities" :key="s" :value="s">{{ s }}</option>
      </select>
      <input v-model="filters.source_ip" type="text" class="filter-input filter-sm" placeholder="Source IP" />
      <select v-model="filters.limit" class="filter-input filter-sm">
        <option :value="50">50</option>
        <option :value="100">100</option>
        <option :value="200">200</option>
        <option :value="500">500</option>
      </select>
      <button v-if="hasActiveFilters" class="btn btn-secondary" @click="clearFilters">Clear</button>
    </div>

    <!-- Log Stream -->
    <div v-if="logs.length" class="log-stream">
      <div
        v-for="log in filteredLogs"
        :key="log.id"
        class="log-entry"
        :class="{ expanded: expandedId === log.id }"
        @click="toggleExpand(log.id)"
      >
        <div class="log-line">
          <span class="log-time mono">{{ formatTime(log.received_at) }}</span>
          <SeverityBadge v-if="log.severity" :severity="log.severity" />
          <span class="log-source mono">{{ log.source_ip || '—' }}</span>
          <span class="log-message mono">{{ log.message }}</span>
        </div>
        <div v-if="expandedId === log.id" class="log-detail">
          <div class="detail-grid">
            <span class="detail-label">Source IP</span>
            <span class="detail-value mono">{{ log.source_ip || '—' }}</span>
            <span class="detail-label">Host</span>
            <span class="detail-value mono">{{ log.host || '—' }}</span>
            <span class="detail-label">Facility</span>
            <span class="detail-value">{{ log.facility || '—' }}</span>
            <span class="detail-label">Program</span>
            <span class="detail-value">{{ log.program || '—' }}</span>
            <span class="detail-label">PID</span>
            <span class="detail-value mono">{{ log.pid || '—' }}</span>
            <span class="detail-label">Log ID</span>
            <span class="detail-value mono">{{ log.id }}</span>
          </div>
          <div class="detail-full">
            <span class="detail-label">Full Message</span>
            <code class="detail-code">{{ log.message }}</code>
          </div>
        </div>
      </div>
    </div>
    <EmptyState v-else message="No logs received yet. Configure a syslog source to send logs to Mite." />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { getLogs, getRecentLogs } from "@/services/logs";
import type { LogItem } from "@/types";
import SeverityBadge from "@/components/SeverityBadge.vue";
import LiveStatusIndicator from "@/components/LiveStatusIndicator.vue";
import ApiErrorBanner from "@/components/ApiErrorBanner.vue";
import EmptyState from "@/components/EmptyState.vue";

const logs = ref<LogItem[]>([]);
const error = ref("");
const isLive = ref(true);
const expandedId = ref<number | null>(null);
const lastSeenId = ref(0);
const severities = ["emerg", "alert", "crit", "err", "warning", "notice", "info", "debug"];

const filters = reactive({
  search: "",
  source_ip: "",
  severity: "",
  limit: 100,
});

const hasActiveFilters = computed(() => {
  return filters.search || filters.source_ip || filters.severity;
});

const liveStatus = computed<"live" | "paused" | "disconnected">(() => {
  if (error.value) return "disconnected";
  return isLive.value ? "live" : "paused";
});

const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.source_ip && log.source_ip?.toLowerCase() !== filters.source_ip.toLowerCase()) return false;
    if (filters.severity && log.severity?.toLowerCase() !== filters.severity.toLowerCase()) return false;
    return true;
  });
});

const formatTime = (ts: string) => {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return ts;
  }
};

const toggleExpand = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const toggleLive = () => {
  isLive.value = !isLive.value;
};

const clearFilters = () => {
  filters.search = "";
  filters.source_ip = "";
  filters.severity = "";
};

const fetchInitial = async () => {
  try {
    const data = await getLogs({ limit: filters.limit });
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    logs.value = items;
    if (items.length > 0) {
      lastSeenId.value = Math.max(...items.map((l) => l.id));
    }
    error.value = "";
  } catch (e: any) {
    const detail = e?.response ? `${e.response.status} ${e.response.statusText}` : e?.message || "Unknown error";
    error.value = `Backend unavailable: ${detail}`;
  }
};

const pollRecent = async () => {
  if (!isLive.value) return;
  try {
    const data = await getRecentLogs({
      after_id: lastSeenId.value,
      limit: 100,
    });
    const items = Array.isArray(data) ? data : [];
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

onMounted(() => {
  fetchInitial();
  pollTimer = setInterval(pollRecent, 2000);
});

onUnmounted(() => {
  clearInterval(pollTimer);
});
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.filter-input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--font-sans);
  outline: none;
  transition: border-color 0.15s ease;
}

.filter-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.filter-input::placeholder {
  color: var(--text-muted);
}

.filter-search {
  flex: 1;
  min-width: 200px;
}

.filter-sm {
  max-width: 140px;
}

/* Log stream */
.log-stream {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.log-entry {
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.1s ease;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry:hover {
  background: var(--bg-hover);
}

.log-entry.expanded {
  background: var(--bg-tertiary);
}

.log-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 12px;
  min-height: 24px;
}

.log-time {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.log-source {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 80px;
}

.log-message {
  font-size: 11px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

/* Expanded detail */
.log-detail {
  padding: 12px 16px 16px;
  border-top: 1px solid var(--border);
  background: var(--bg-primary);
}

.detail-grid {
  display: grid;
  grid-template-columns: 80px 1fr 80px 1fr;
  gap: 6px 12px;
  font-size: 13px;
  margin-bottom: 12px;
}

.detail-label {
  color: var(--text-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.detail-value {
  color: var(--text-primary);
  font-size: 13px;
}

.detail-full {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-code {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 14px;
  word-break: break-all;
  white-space: pre-wrap;
  color: var(--text-primary);
  line-height: 1.5;
}
</style>
