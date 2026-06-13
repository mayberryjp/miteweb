<template>
  <div class="hosts-page">
    <h1 class="page-title">Hosts</h1>

    <ApiErrorBanner v-if="error" :message="error" />

    <div class="table-wrapper">
      <table v-if="hosts.length" class="data-table">
        <thead>
          <tr>
            <th>Host</th>
            <th>Source IP</th>
            <th>First Seen</th>
            <th>Last Seen</th>
            <th>Logs</th>
            <th>Alerts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="host in hosts" :key="host.id">
            <td class="mono">{{ host.host || '—' }}</td>
            <td class="mono">{{ host.source_ip }}</td>
            <td class="mono nowrap">{{ formatTime(host.first_seen_at) }}</td>
            <td class="mono nowrap">{{ formatTime(host.last_seen_at) }}</td>
            <td class="mono">{{ host.log_count }}</td>
            <td class="mono">{{ host.alert_count }}</td>
            <td class="actions-cell">
              <router-link
                :to="{ name: 'logs', query: { host: host.host || host.source_ip } }"
                class="action-link"
              >Logs</router-link>
              <router-link
                :to="{ name: 'alerts', query: { host: host.host, source_ip: host.source_ip } }"
                class="action-link"
              >Alerts</router-link>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-else message="No hosts discovered yet. Hosts will appear when syslog sources send data." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getHosts } from "@/services/hosts";
import type { HostItem } from "@/types";
import ApiErrorBanner from "@/components/ApiErrorBanner.vue";
import EmptyState from "@/components/EmptyState.vue";

const hosts = ref<HostItem[]>([]);
const error = ref("");

const formatTime = (ts: string) => {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
};

onMounted(async () => {
  try {
    hosts.value = await getHosts();
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

.actions-cell {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-link {
  color: var(--accent);
  text-decoration: none;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.action-link:hover {
  background: var(--bg-hover);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.analyze-feedback {
  margin-top: 16px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
}

.feedback-success {
  background: rgba(63, 185, 80, 0.1);
  border: 1px solid var(--success);
  color: var(--success);
}

.feedback-error {
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid var(--danger);
  color: var(--danger);
}
</style>
