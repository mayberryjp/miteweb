<template>
  <div class="settings-page">
    <h1 class="page-title">Settings</h1>

    <ApiErrorBanner v-if="error" :message="error" />

    <!-- Backend Health -->
    <section class="settings-section">
      <h2 class="section-title">Backend Health</h2>
      <div class="settings-card">
        <div class="setting-row">
          <span class="setting-label">Status</span>
          <StatusBadge :status="health?.status === 'ok' ? 'ok' : 'error'" :label="health?.status || 'unknown'" />
        </div>
        <div v-if="health?.uptime" class="setting-row">
          <span class="setting-label">Uptime</span>
          <span class="setting-value mono">{{ formatUptime(health.uptime) }}</span>
        </div>
        <div v-if="health?.version" class="setting-row">
          <span class="setting-label">Version</span>
          <span class="setting-value mono">{{ health.version }}</span>
        </div>
        <div class="setting-row">
          <span class="setting-label">API Base URL</span>
          <span class="setting-value mono">{{ apiBaseUrl }}</span>
        </div>
        <button class="btn" :disabled="refreshing" @click="refreshHealth">
          {{ refreshing ? 'Refreshing...' : 'Refresh Health' }}
        </button>
      </div>
    </section>

    <!-- Configuration Status -->
    <section class="settings-section">
      <h2 class="section-title">Configuration</h2>
      <div class="settings-card">
        <div class="setting-row">
          <span class="setting-label">Discord webhook configured</span>
          <span class="setting-value">{{ stats?.discord_configured ? 'yes' : 'no' }}</span>
        </div>
        <div class="setting-row">
          <span class="setting-label">AI enabled</span>
          <span class="setting-value">{{ stats?.ai_discovery_enabled ? 'yes' : 'no' }}</span>
        </div>
        <div class="setting-row">
          <span class="setting-label">AI endpoint configured</span>
          <span class="setting-value">{{ stats?.ai_configured ? 'yes' : 'no' }}</span>
        </div>
        <div v-if="stats?.retention_days" class="setting-row">
          <span class="setting-label">Retention</span>
          <span class="setting-value mono">{{ stats.retention_days }} days</span>
        </div>
      </div>
    </section>

    <!-- Actions -->
    <section class="settings-section">
      <h2 class="section-title">Actions</h2>
      <div class="settings-card">
        <div class="action-group">
          <button class="btn btn-primary" :disabled="testingDiscord" @click="handleTestDiscord">
            {{ testingDiscord ? 'Sending...' : 'Test Discord Webhook' }}
          </button>
          <button class="btn btn-primary" :disabled="reloadingRules" @click="handleReloadRules">
            {{ reloadingRules ? 'Reloading...' : 'Reload Rules' }}
          </button>
        </div>
        <div v-if="actionMessage" class="action-feedback" :class="actionSuccess ? 'feedback-success' : 'feedback-error'">
          {{ actionMessage }}
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getHealth, getStats, testDiscord } from "@/services/system";
import { reloadRules } from "@/services/rules";
import type { HealthStatus, StatsData } from "@/types";
import StatusBadge from "@/components/StatusBadge.vue";
import ApiErrorBanner from "@/components/ApiErrorBanner.vue";

const health = ref<HealthStatus | null>(null);
const stats = ref<StatsData | null>(null);
const error = ref("");
const refreshing = ref(false);
const testingDiscord = ref(false);
const reloadingRules = ref(false);
const actionMessage = ref("");
const actionSuccess = ref(false);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
};

const fetchData = async () => {
  try {
    const [h, s] = await Promise.allSettled([getHealth(), getStats()]);
    if (h.status === "fulfilled") health.value = h.value;
    if (s.status === "fulfilled") stats.value = s.value;
    error.value = [h, s].some((r) => r.status === "rejected")
      ? "Backend unavailable. Check the Mite backend container."
      : "";
  } catch {
    error.value = "Backend unavailable. Check the Mite backend container.";
  }
};

const refreshHealth = async () => {
  refreshing.value = true;
  await fetchData();
  refreshing.value = false;
};

const handleTestDiscord = async () => {
  testingDiscord.value = true;
  actionMessage.value = "";
  try {
    await testDiscord();
    actionMessage.value = "Discord test message sent successfully.";
    actionSuccess.value = true;
  } catch {
    actionMessage.value = "Failed to send Discord test message.";
    actionSuccess.value = false;
  } finally {
    testingDiscord.value = false;
  }
};

const handleReloadRules = async () => {
  reloadingRules.value = true;
  actionMessage.value = "";
  try {
    await reloadRules();
    actionMessage.value = "Rules reloaded successfully.";
    actionSuccess.value = true;
  } catch {
    actionMessage.value = "Failed to reload rules.";
    actionSuccess.value = false;
  } finally {
    reloadingRules.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px;
  color: var(--text-primary);
}

.settings-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text-primary);
}

.settings-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.setting-row:last-of-type {
  border-bottom: none;
  margin-bottom: 12px;
}

.setting-label {
  color: var(--text-secondary);
  font-size: 13px;
}

.setting-value {
  color: var(--text-primary);
  font-size: 13px;
}

.action-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.action-feedback {
  margin-top: 12px;
  padding: 8px 12px;
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
