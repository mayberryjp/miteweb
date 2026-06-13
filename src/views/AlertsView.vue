<template>
  <div class="alerts-page">
    <div class="page-header">
      <h1 class="page-title">Alerts</h1>
      <div class="header-controls">
        <select v-model="severityFilter" class="filter-input" @change="fetchAlerts">
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span class="result-count mono">{{ total }} total</span>
      </div>
    </div>

    <ApiErrorBanner v-if="error" :message="error" />

    <div class="table-wrapper">
      <table v-if="alerts.length" class="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Severity</th>
            <th>Host</th>
            <th>Source IP</th>
            <th>Pattern</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="alert in alerts" :key="alert.id">
            <tr class="clickable-row" @click="expandedId = expandedId === alert.id ? null : alert.id">
              <td class="mono nowrap">{{ formatTime(alert.created_at) }}</td>
              <td><SeverityBadge :severity="alert.severity" /></td>
              <td class="mono">{{ alert.host || '—' }}</td>
              <td class="mono">{{ alert.source_ip || '—' }}</td>
              <td class="mono truncate">{{ alert.pattern_text || '—' }}</td>
              <td class="truncate">{{ alert.message }}</td>
            </tr>
            <tr v-if="expandedId === alert.id">
              <td colspan="6" class="detail-cell">
                <div class="alert-detail">
                  <div class="detail-row" v-if="alert.reason">
                    <span class="detail-label">Reason</span>
                    <span class="detail-value">{{ alert.reason }}</span>
                  </div>
                  <div class="detail-row" v-if="alert.action">
                    <span class="detail-label">Action</span>
                    <span class="detail-value">{{ alert.action }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Discord</span>
                    <span class="detail-value">{{ alert.discord_sent ? 'Sent' : 'Not sent' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Alert ID</span>
                    <span class="detail-value mono">{{ alert.id }}</span>
                  </div>
                  <div class="detail-row" v-if="alert.log_id">
                    <span class="detail-label">Log ID</span>
                    <span class="detail-value mono">{{ alert.log_id }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Full Message</span>
                    <code class="detail-code">{{ alert.message }}</code>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <EmptyState v-else message="No alerts yet. Alerts are generated when log patterns match classification rules." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAlerts } from "@/services/alerts";
import type { AlertItem } from "@/types";
import SeverityBadge from "@/components/SeverityBadge.vue";
import ApiErrorBanner from "@/components/ApiErrorBanner.vue";
import EmptyState from "@/components/EmptyState.vue";

const alerts = ref<AlertItem[]>([]);
const total = ref(0);
const error = ref("");
const severityFilter = ref("");
const expandedId = ref<number | null>(null);

const formatTime = (ts: string) => {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
};

const fetchAlerts = async () => {
  try {
    const data = await getAlerts({
      limit: 100,
      severity: severityFilter.value || undefined,
    });
    alerts.value = data.items;
    total.value = data.total;
    error.value = "";
  } catch {
    error.value = "Failed to load alerts.";
  }
};

onMounted(fetchAlerts);
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

.result-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.filter-input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 6px 10px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--font-sans);
  outline: none;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background: var(--bg-hover);
}

.truncate {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nowrap {
  white-space: nowrap;
}

.detail-cell {
  background: var(--bg-tertiary);
  padding: 16px 20px !important;
}

.alert-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 13px;
}

.detail-label {
  color: var(--text-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  min-width: 100px;
  flex-shrink: 0;
}

.detail-value {
  color: var(--text-primary);
}

.detail-code {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
