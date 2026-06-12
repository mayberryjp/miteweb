<template>
  <div class="logs-page">
    <div class="page-header">
      <h1 class="page-title">Live Logs</h1>
      <div class="header-controls">
        <LiveStatusIndicator :status="liveStatus" />
        <button class="btn" :class="isLive ? 'btn-warning' : 'btn-success'" @click="toggleLive">
          {{ isLive ? 'Pause' : 'Resume' }}
        </button>
      </div>
    </div>

    <ApiErrorBanner v-if="error" :message="error" />

    <!-- Filters -->
    <div class="filter-bar">
      <input v-model="filters.search" type="text" class="filter-input" placeholder="Search messages..." />
      <input v-model="filters.host" type="text" class="filter-input filter-sm" placeholder="Host" />
      <input v-model="filters.source_ip" type="text" class="filter-input filter-sm" placeholder="Source IP" />
      <input v-model="filters.program" type="text" class="filter-input filter-sm" placeholder="Program" />
      <select v-model="filters.severity" class="filter-input filter-sm">
        <option value="">All Severities</option>
        <option v-for="s in severities" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="filters.limit" class="filter-input filter-sm">
        <option :value="50">50</option>
        <option :value="100">100</option>
        <option :value="200">200</option>
        <option :value="500">500</option>
      </select>
      <button class="btn btn-secondary" @click="clearFilters">Clear</button>
    </div>

    <!-- Logs Table -->
    <div class="table-wrapper">
      <table v-if="logs.length" class="data-table log-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Host</th>
            <th>Source IP</th>
            <th>Program</th>
            <th>Severity</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="log in filteredLogs" :key="log.id">
            <tr class="log-row" @click="toggleExpand(log.id)">
              <td class="mono nowrap">{{ formatTime(log.received_at) }}</td>
              <td class="mono">{{ log.host || '—' }}</td>
              <td class="mono">{{ log.source_ip || '—' }}</td>
              <td>{{ log.program || '—' }}</td>
              <td><SeverityBadge v-if="log.severity" :severity="log.severity" /></td>
              <td class="msg-cell mono">{{ log.message }}</td>
            </tr>
            <tr v-if="expandedId === log.id" class="expand-row">
              <td colspan="6">
                <div class="expand-content">
                  <div class="expand-field"><span class="expand-label">Raw Message:</span> <code>{{ log.raw_message }}</code></div>
                  <div class="expand-field"><span class="expand-label">Facility:</span> {{ log.facility || '—' }}</div>
                  <div class="expand-field"><span class="expand-label">Log ID:</span> {{ log.id }}</div>
                  <div class="expand-field"><span class="expand-label">Received At:</span> {{ log.received_at }}</div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <EmptyState v-else message="No logs received yet. Configure a syslog source to send logs to Mite on UDP 1514 or TCP 1515." icon="📜" />
    </div>
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
const severities = ["info", "low", "medium", "high", "critical"];

const filters = reactive({
  search: "",
  host: "",
  source_ip: "",
  program: "",
  severity: "",
  limit: 100,
});

const liveStatus = computed<"live" | "paused" | "disconnected">(() => {
  if (error.value) return "disconnected";
  return isLive.value ? "live" : "paused";
});

const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.host && log.host?.toLowerCase() !== filters.host.toLowerCase()) return false;
    if (filters.source_ip && log.source_ip?.toLowerCase() !== filters.source_ip.toLowerCase()) return false;
    if (filters.program && log.program?.toLowerCase() !== filters.program.toLowerCase()) return false;
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
  filters.host = "";
  filters.source_ip = "";
  filters.program = "";
  filters.severity = "";
};

const fetchInitial = async () => {
  try {
    const data = await getLogs({ limit: filters.limit });
    logs.value = data;
    if (data.length > 0) {
      lastSeenId.value = Math.max(...data.map((l) => l.id));
    }
    error.value = "";
  } catch {
    error.value = "Backend unavailable. Check the Mite backend container.";
  }
};

const pollRecent = async () => {
  if (!isLive.value) return;
  try {
    const data = await getRecentLogs({
      after_id: lastSeenId.value,
      limit: 100,
    });
    if (data.length > 0) {
      logs.value = [...data, ...logs.value].slice(0, 500);
      lastSeenId.value = Math.max(...data.map((l) => l.id));
    }
    error.value = "";
  } catch {
    error.value = "Backend unavailable. Check the Mite backend container.";
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
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.filter-input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.filter-input:focus {
  border-color: var(--accent);
}

.filter-input::placeholder {
  color: var(--text-muted);
}

.filter-sm {
  max-width: 130px;
}

.btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--border);
  font-size: 13px;
  cursor: pointer;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transition: background 0.15s;
}

.btn:hover {
  background: var(--bg-hover);
}

.btn-success {
  background: rgba(63, 185, 80, 0.15);
  border-color: var(--success);
  color: var(--success);
}

.btn-warning {
  background: rgba(210, 153, 34, 0.15);
  border-color: var(--warning);
  color: var(--warning);
}

.btn-secondary {
  color: var(--text-secondary);
}

.table-wrapper {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  text-align: left;
  padding: 10px 12px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.data-table td {
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.log-row {
  cursor: pointer;
}

.log-row:hover {
  background: var(--bg-hover);
}

.log-table {
  font-family: var(--font-mono);
  font-size: 12px;
}

.msg-cell {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nowrap {
  white-space: nowrap;
}

.expand-row td {
  background: var(--bg-tertiary);
  padding: 12px 16px;
}

.expand-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.expand-label {
  color: var(--text-secondary);
  font-weight: 600;
  margin-right: 8px;
}

.expand-content code {
  font-family: var(--font-mono);
  background: var(--bg-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  word-break: break-all;
  display: inline-block;
}
</style>
