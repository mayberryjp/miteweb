<template>
  <div class="dashboard">
    <h1 class="page-title">Dashboard</h1>

    <ApiErrorBanner v-if="error" :message="error" />

    <!-- Stats Cards -->
    <div class="stats-grid">
      <StatsCard label="Backend" :value="health?.status === 'ok' ? '● Online' : '○ Offline'" />
      <StatsCard label="AI Discovery" :value="stats?.ai_discovery_enabled ? 'Enabled' : 'Disabled'" />
      <StatsCard label="Logs (1h)" :value="stats?.logs_last_hour ?? '—'" />
      <StatsCard label="Logs (24h)" :value="stats?.logs_last_24h ?? '—'" />
      <StatsCard label="Alerts (1h)" :value="stats?.alerts_last_hour ?? '—'" />
      <StatsCard label="Alerts (24h)" :value="stats?.alerts_last_24h ?? '—'" />
      <StatsCard label="Known Hosts" :value="stats?.known_hosts ?? '—'" />
      <StatsCard label="Loaded Rules" :value="stats?.loaded_rules ?? '—'" />
    </div>

    <!-- Recent Alerts -->
    <section class="section">
      <h2 class="section-title">Recent Alerts</h2>
      <div class="table-wrapper">
        <table v-if="alerts.length" class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Severity</th>
              <th>Rule</th>
              <th>Host</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alert in alerts.slice(0, 10)" :key="alert.id">
              <td class="mono nowrap">{{ formatTime(alert.created_at) }}</td>
              <td><SeverityBadge :severity="alert.severity" /></td>
              <td>{{ alert.rule_name }}</td>
              <td class="mono">{{ alert.host || alert.source_ip || '—' }}</td>
              <td class="truncate">{{ alert.message }}</td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else message="No alerts yet. This is good. Rules will appear here when something matches." icon="🔔" />
      </div>
    </section>

    <!-- Recent Logs -->
    <section class="section">
      <h2 class="section-title">Recent Logs</h2>
      <div class="table-wrapper">
        <table v-if="logs.length" class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Host</th>
              <th>Program</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs.slice(0, 10)" :key="log.id">
              <td class="mono nowrap">{{ formatTime(log.received_at) }}</td>
              <td class="mono">{{ log.host || log.source_ip || '—' }}</td>
              <td>{{ log.program || '—' }}</td>
              <td class="truncate mono">{{ log.message }}</td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else message="No logs received yet. Configure a syslog source to send logs to Mite on UDP 1514 or TCP 1515." icon="📜" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { getHealth, getStats } from "@/services/system";
import { getAlerts } from "@/services/alerts";
import { getLogs } from "@/services/logs";
import type { HealthStatus, StatsData, AlertItem, LogItem } from "@/types";
import StatsCard from "@/components/StatsCard.vue";
import SeverityBadge from "@/components/SeverityBadge.vue";
import ApiErrorBanner from "@/components/ApiErrorBanner.vue";
import EmptyState from "@/components/EmptyState.vue";

const health = ref<HealthStatus | null>(null);
const stats = ref<StatsData | null>(null);
const alerts = ref<AlertItem[]>([]);
const logs = ref<LogItem[]>([]);
const error = ref("");

const formatTime = (ts: string) => {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
};

const fetchData = async () => {
  try {
    const [h, s, a, l] = await Promise.allSettled([
      getHealth(),
      getStats(),
      getAlerts(),
      getLogs({ limit: 10 }),
    ]);
    if (h.status === "fulfilled") health.value = h.value;
    if (s.status === "fulfilled") stats.value = s.value;
    if (a.status === "fulfilled") alerts.value = a.value;
    if (l.status === "fulfilled") logs.value = l.value;

    const anyFailed = [h, s, a, l].some((r) => r.status === "rejected");
    error.value = anyFailed
      ? "Backend unavailable. Check the Mite backend container."
      : "";
  } catch {
    error.value = "Backend unavailable. Check the Mite backend container.";
  }
};

let timer: ReturnType<typeof setInterval>;

onMounted(() => {
  fetchData();
  timer = setInterval(fetchData, 10000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px;
  color: var(--text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text-primary);
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
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: var(--bg-hover);
}

.nowrap {
  white-space: nowrap;
}

.truncate {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
