<template>
  <div class="alerts-page">
    <h1 class="page-title">Alerts</h1>

    <ApiErrorBanner v-if="error" :message="error" />

    <!-- Filters -->
    <div class="filter-bar">
      <input v-model="filters.search" type="text" class="filter-input" placeholder="Search messages..." />
      <input v-model="filters.host" type="text" class="filter-input filter-sm" placeholder="Host" />
      <input v-model="filters.source_ip" type="text" class="filter-input filter-sm" placeholder="Source IP" />
      <input v-model="filters.rule_name" type="text" class="filter-input filter-sm" placeholder="Rule name" />
      <select v-model="filters.severity" class="filter-input filter-sm">
        <option value="">All Severities</option>
        <option v-for="s in severities" :key="s" :value="s">{{ s }}</option>
      </select>
      <button class="btn btn-secondary" @click="clearFilters">Clear</button>
    </div>

    <!-- Alerts Table -->
    <div class="table-wrapper">
      <table v-if="filteredAlerts.length" class="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Severity</th>
            <th>Rule</th>
            <th>Host</th>
            <th>Source IP</th>
            <th>Message</th>
            <th>Discord</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="alert in filteredAlerts" :key="alert.id">
            <tr class="alert-row" @click="toggleExpand(alert.id)">
              <td class="mono nowrap">{{ formatTime(alert.created_at) }}</td>
              <td><SeverityBadge :severity="alert.severity" /></td>
              <td>{{ alert.rule_name }}</td>
              <td class="mono">{{ alert.host || '—' }}</td>
              <td class="mono">{{ alert.source_ip || '—' }}</td>
              <td class="truncate">{{ alert.message }}</td>
              <td>{{ alert.discord_sent ? '✓' : '—' }}</td>
            </tr>
            <tr v-if="expandedId === alert.id" class="expand-row">
              <td colspan="7">
                <div class="expand-content">
                  <div v-if="alert.reason" class="expand-field"><span class="expand-label">Reason:</span> {{ alert.reason }}</div>
                  <div v-if="alert.action" class="expand-field"><span class="expand-label">Recommended Action:</span> {{ alert.action }}</div>
                  <div v-if="alert.log_id" class="expand-field"><span class="expand-label">Linked Log ID:</span> {{ alert.log_id }}</div>
                  <div class="expand-field"><span class="expand-label">Full Message:</span> {{ alert.message }}</div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <EmptyState v-else message="No alerts yet. This is good. Rules will appear here when something matches." icon="🔔" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getAlerts } from "@/services/alerts";
import type { AlertItem } from "@/types";
import SeverityBadge from "@/components/SeverityBadge.vue";
import ApiErrorBanner from "@/components/ApiErrorBanner.vue";
import EmptyState from "@/components/EmptyState.vue";

const route = useRoute();
const alerts = ref<AlertItem[]>([]);
const error = ref("");
const expandedId = ref<number | null>(null);
const severities = ["info", "low", "medium", "high", "critical"];

const filters = reactive({
  search: (route.query.search as string) || "",
  host: (route.query.host as string) || "",
  source_ip: (route.query.source_ip as string) || "",
  rule_name: (route.query.rule_name as string) || "",
  severity: (route.query.severity as string) || "",
});

const filteredAlerts = computed(() => {
  return alerts.value.filter((a) => {
    if (filters.search && !a.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.host && a.host?.toLowerCase() !== filters.host.toLowerCase()) return false;
    if (filters.source_ip && a.source_ip?.toLowerCase() !== filters.source_ip.toLowerCase()) return false;
    if (filters.rule_name && a.rule_name?.toLowerCase() !== filters.rule_name.toLowerCase()) return false;
    if (filters.severity && a.severity !== filters.severity) return false;
    return true;
  });
});

const formatTime = (ts: string) => {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
};

const toggleExpand = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const clearFilters = () => {
  filters.search = "";
  filters.host = "";
  filters.source_ip = "";
  filters.rule_name = "";
  filters.severity = "";
};

onMounted(async () => {
  try {
    alerts.value = await getAlerts();
    error.value = "";
  } catch {
    error.value = "Backend unavailable. Check the Mite backend container.";
  }
});
</script>

<style scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--text-primary);
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
}

.btn:hover {
  background: var(--bg-hover);
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
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.alert-row {
  cursor: pointer;
}

.alert-row:hover {
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

.expand-row td {
  background: var(--bg-tertiary);
  padding: 12px 16px;
}

.expand-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.expand-label {
  color: var(--text-secondary);
  font-weight: 600;
  margin-right: 8px;
}
</style>
