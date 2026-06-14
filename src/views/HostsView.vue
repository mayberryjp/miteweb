<template>
  <div class="hosts-page">
    <ApiErrorBanner v-if="error" :message="error" />

    <!-- Search -->
    <div class="search-container">
      <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
      </svg>
      <input
        v-model="searchTerm"
        type="text"
        class="search-input"
        placeholder="Search hosts..."
      />
    </div>

    <!-- Host List -->
    <div class="host-list custom-scrollbar">
      <div
        v-for="host in filteredHosts"
        :key="host.id"
        class="host-list-item"
        :class="{ 'selected-host': selectedId === host.id }"
        @click="selectHost(host)"
      >
        <div class="host-row">
          <div class="icon-container">
            <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24" :style="{ color: getScoreColor(host.alert_count) }">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
            </svg>
          </div>
          <div class="host-info">{{ host.host || host.source_ip }}</div>
          <AlertBarChart :alertIntervals="getAlertIntervals(host.source_ip)" class="host-bars" />
          <div class="threat-score-text" :style="{ color: getScoreColor(host.alert_count) }">
            {{ host.alert_count }}
          </div>
        </div>
      </div>

      <EmptyState v-if="!filteredHosts.length && !error" message="No hosts discovered yet." />
    </div>

    <!-- Host Detail -->
    <div v-if="selectedHost" class="host-detail-panel">
      <button class="back-btn" @click="selectedId = null">← Back to list</button>
      <h2 class="detail-title">{{ selectedHost.host || selectedHost.source_ip }}</h2>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Host</span>
          <span class="detail-value mono">{{ selectedHost.host || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Source IP</span>
          <span class="detail-value mono">{{ selectedHost.source_ip }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">First Seen</span>
          <span class="detail-value mono">{{ formatTime(selectedHost.first_seen_at) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Last Seen</span>
          <span class="detail-value mono">{{ formatTime(selectedHost.last_seen_at) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Log Count</span>
          <span class="detail-value mono">{{ selectedHost.log_count }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Alert Count</span>
          <span class="detail-value mono">{{ selectedHost.alert_count }}</span>
        </div>
      </div>
      <div class="detail-actions">
        <router-link
          :to="{ name: 'logs', query: { host: selectedHost.host || selectedHost.source_ip } }"
          class="btn btn-secondary btn-sm"
        >View Logs</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { getHosts } from "@/services/hosts";
import { getPatternStats } from "@/services/rules";
import type { HostItem } from "@/types";
import ApiErrorBanner from "@/components/ApiErrorBanner.vue";
import EmptyState from "@/components/EmptyState.vue";
import AlertBarChart from "@/components/AlertBarChart.vue";

const hosts = ref<HostItem[]>([]);
const hostStats = ref<Record<string, { hour: string; count: number }[]>>({});
const error = ref("");
const searchTerm = ref("");
const selectedId = ref<number | null>(null);

const sortedHosts = computed(() =>
  [...hosts.value].sort((a, b) => b.alert_count - a.alert_count)
);

const filteredHosts = computed(() => {
  if (!searchTerm.value.trim()) return sortedHosts.value;
  const q = searchTerm.value.toLowerCase();
  return sortedHosts.value.filter(
    (h) =>
      (h.host || "").toLowerCase().includes(q) ||
      h.source_ip.toLowerCase().includes(q)
  );
});

const selectedHost = computed(() =>
  selectedId.value ? hosts.value.find((h) => h.id === selectedId.value) ?? null : null
);

const selectHost = (host: HostItem) => {
  selectedId.value = selectedId.value === host.id ? null : host.id;
};

const getScoreColor = (score: number): string => {
  if (score === 0) return '#00C853';
  if (score <= 24) return '#FFD600';
  if (score <= 50) return '#FF9800';
  if (score <= 75) return '#F44336';
  return '#B71C1C';
};

const getAlertIntervals = (sourceIp: string): number[] => {
  const intervals = hostStats.value[sourceIp] || [];
  return intervals.map((i) => i.count);
};

const formatTime = (ts: string) => {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
};

onMounted(async () => {
  try {
    const [h, s] = await Promise.allSettled([
      getHosts(),
      getPatternStats(12),
    ]);
    if (h.status === "fulfilled") hosts.value = h.value;
    if (s.status === "fulfilled") hostStats.value = s.value ?? {};
    error.value = "";
  } catch {
    error.value = "Backend unavailable. Check the Mite backend container.";
  }
});
</script>

<style scoped>
.hosts-page {
  max-width: 720px;
}

/* Search */
.search-container {
  position: relative;
  margin-bottom: 12px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: #161b22;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 12px 10px 38px;
  font-size: 14px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  border-color: var(--accent);
}

/* Host list */
.host-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  max-height: 70vh;
}

.host-list-item {
  margin-bottom: 0;
  padding: 8px 16px;
  color: #b1b8c0;
  text-transform: uppercase;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.host-list-item:hover {
  background: var(--bg-hover);
}

.host-list-item.selected-host {
  background-color: rgba(66, 165, 245, 0.2);
  border-left: 3px solid #42a5f5;
}

.host-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  min-width: 40px;
}

.host-info {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.3px;
}

.host-bars {
  flex-shrink: 0;
  width: 120px;
}

.threat-score-text {
  font-size: 14px;
  font-weight: bold;
  width: 30px;
  min-width: 30px;
  text-align: right;
}

/* Detail panel */
.host-detail-panel {
  margin-top: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  align-self: flex-start;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  font-weight: 600;
  color: var(--text-muted);
}

.detail-value {
  font-size: 13px;
  color: var(--text-primary);
}

.detail-actions {
  display: flex;
  gap: 8px;
}

/* Custom scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  border: none;
}
</style>
