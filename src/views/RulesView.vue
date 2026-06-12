<template>
  <div class="rules-page">
    <div class="page-header">
      <h1 class="page-title">Rules</h1>
      <button class="btn btn-primary" :disabled="reloading" @click="handleReload">
        {{ reloading ? 'Reloading...' : 'Reload Rules' }}
      </button>
    </div>

    <ApiErrorBanner v-if="error" :message="error" />

    <div v-if="reloadMessage" class="reload-feedback" :class="reloadSuccess ? 'feedback-success' : 'feedback-error'">
      {{ reloadMessage }}
    </div>

    <p class="hint">Rules are edited on disk through YAML or Markdown files.</p>

    <div class="table-wrapper">
      <table v-if="rules.length" class="data-table">
        <thead>
          <tr>
            <th>Enabled</th>
            <th>Severity</th>
            <th>Name</th>
            <th>Description</th>
            <th>Source File</th>
            <th>Cooldown</th>
            <th>Discord</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in rules" :key="rule.name" :class="{ 'error-row': rule.load_status === 'error' }">
            <td>
              <span :class="rule.enabled ? 'dot-on' : 'dot-off'">●</span>
            </td>
            <td><SeverityBadge :severity="rule.severity" /></td>
            <td class="mono">{{ rule.name }}</td>
            <td>{{ rule.description || '—' }}</td>
            <td class="mono text-muted" style="font-size: 11px;">{{ rule.source_file }}</td>
            <td class="mono">{{ rule.cooldown_seconds ? `${rule.cooldown_seconds}s` : '—' }}</td>
            <td>{{ rule.discord ? '✓' : '—' }}</td>
            <td>
              <StatusBadge :status="rule.load_status" :label="rule.load_status" />
              <div v-if="rule.error" class="rule-error">{{ rule.error }}</div>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-else message="No rules loaded. Add YAML or Markdown rule files to the rules directory." icon="📋" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getRules, reloadRules } from "@/services/rules";
import type { RuleItem } from "@/types";
import SeverityBadge from "@/components/SeverityBadge.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import ApiErrorBanner from "@/components/ApiErrorBanner.vue";
import EmptyState from "@/components/EmptyState.vue";

const rules = ref<RuleItem[]>([]);
const error = ref("");
const reloading = ref(false);
const reloadMessage = ref("");
const reloadSuccess = ref(false);

const fetchRules = async () => {
  try {
    rules.value = await getRules();
    error.value = "";
  } catch {
    error.value = "Backend unavailable. Check the Mite backend container.";
  }
};

const handleReload = async () => {
  reloading.value = true;
  reloadMessage.value = "";
  try {
    await reloadRules();
    reloadMessage.value = "Rules reloaded successfully.";
    reloadSuccess.value = true;
    await fetchRules();
  } catch {
    reloadMessage.value = "Failed to reload rules.";
    reloadSuccess.value = false;
  } finally {
    reloading.value = false;
  }
};

onMounted(fetchRules);
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

.hint {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0 0 16px;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: rgba(88, 166, 255, 0.15);
  border-color: var(--accent);
  color: var(--accent);
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

.error-row {
  background: rgba(248, 81, 73, 0.05);
}

.dot-on {
  color: var(--success);
}

.dot-off {
  color: var(--text-muted);
}

.rule-error {
  color: var(--danger);
  font-size: 11px;
  margin-top: 4px;
}

.reload-feedback {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 16px;
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
