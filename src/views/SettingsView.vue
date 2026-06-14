<template>
  <v-sheet class="settings-container" color="#0d1117">
    <v-row no-gutters>
      <!-- Left side tabs — vertical on desktop (lg+), horizontal scrollable on
           phones & tablets (< lg) so the rail doesn't squeeze the form. -->
      <v-col cols="12" lg="3">
        <v-tabs
          v-model="activeTab"
          :direction="lgAndUp ? 'vertical' : 'horizontal'"
          :show-arrows="!lgAndUp"
          color="primary"
        >
          <v-tab value="health">BACKEND HEALTH</v-tab>
          <v-tab value="actions">ACTIONS</v-tab>
        </v-tabs>
      </v-col>

      <!-- Right side content -->
      <v-col cols="12" lg="9">
        <v-card-text>
          <v-window v-model="activeTab">
            <!-- Backend Health -->
            <v-window-item value="health">
              <h3>Backend Health</h3>
              <v-divider class="my-4"></v-divider>

              <v-table density="compact" class="rounded-lg" style="background-color: #0d1117;">
                <tbody>
                  <tr>
                    <td class="text-medium-emphasis">Status</td>
                    <td><StatusBadge :status="health?.status === 'ok' ? 'ok' : 'error'" :label="health?.status || 'unknown'" /></td>
                  </tr>
                  <tr v-if="health?.uptime">
                    <td class="text-medium-emphasis">Uptime</td>
                    <td class="font-weight-medium">{{ formatUptime(health.uptime) }}</td>
                  </tr>
                  <tr v-if="health?.version">
                    <td class="text-medium-emphasis">Version</td>
                    <td class="font-weight-medium">{{ health.version }}</td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis">API Base URL</td>
                    <td class="font-weight-medium">{{ apiBaseUrl }}</td>
                  </tr>
                  <tr v-if="stats?.database_size_bytes != null">
                    <td class="text-medium-emphasis">Database Size</td>
                    <td class="font-weight-medium">{{ formatBytes(stats.database_size_bytes) }}</td>
                  </tr>
                  <tr v-if="stats?.logs_last_hour != null">
                    <td class="text-medium-emphasis">Logs Last Hour</td>
                    <td class="font-weight-medium">{{ stats.logs_last_hour.toLocaleString() }}</td>
                  </tr>
                  <tr v-if="stats?.logs_last_24h != null">
                    <td class="text-medium-emphasis">Logs Last 24h</td>
                    <td class="font-weight-medium">{{ stats.logs_last_24h.toLocaleString() }}</td>
                  </tr>
                  <tr v-if="stats?.total_logs != null">
                    <td class="text-medium-emphasis">Total Logs</td>
                    <td class="font-weight-medium">{{ stats.total_logs.toLocaleString() }}</td>
                  </tr>
                  <tr v-if="stats?.alerts_last_hour != null">
                    <td class="text-medium-emphasis">Alerts Last Hour</td>
                    <td class="font-weight-medium">{{ stats.alerts_last_hour.toLocaleString() }}</td>
                  </tr>
                  <tr v-if="stats?.alerts_last_24h != null">
                    <td class="text-medium-emphasis">Alerts Last 24h</td>
                    <td class="font-weight-medium">{{ stats.alerts_last_24h.toLocaleString() }}</td>
                  </tr>
                  <tr v-if="stats?.total_alerts != null">
                    <td class="text-medium-emphasis">Total Alerts</td>
                    <td class="font-weight-medium">{{ stats.total_alerts.toLocaleString() }}</td>
                  </tr>
                  <tr v-if="stats?.total_patterns != null">
                    <td class="text-medium-emphasis">Total Patterns</td>
                    <td class="font-weight-medium">{{ stats.total_patterns.toLocaleString() }}</td>
                  </tr>
                  <tr v-if="stats?.pending_patterns != null">
                    <td class="text-medium-emphasis">Pending Patterns</td>
                    <td class="font-weight-medium">{{ stats.pending_patterns.toLocaleString() }}</td>
                  </tr>
                  <tr v-if="stats?.ai_api_calls_24h != null">
                    <td class="text-medium-emphasis">AI API Calls (24h)</td>
                    <td class="font-weight-medium">{{ stats.ai_api_calls_24h.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </v-table>

              <v-btn
                class="mt-4"
                variant="outlined"
                color="primary"
                :loading="refreshing"
                @click="refreshHealth"
              >
                Refresh Health
              </v-btn>
            </v-window-item>

            <!-- Actions -->
            <v-window-item value="actions">
              <h3>Actions</h3>
              <v-divider class="my-4"></v-divider>

              <div class="maintenance-actions">
                <div class="maintenance-action mb-6">
                  <v-btn
                    color="primary"
                    variant="elevated"
                    min-width="260"
                    elevation="2"
                    prepend-icon="mdi-webhook"
                    :loading="testingDiscord"
                    @click="handleTestDiscord"
                  >
                    Test Discord Webhook
                  </v-btn>
                  <p class="text-body-2 mt-2">
                    Sends a test message to the configured Discord webhook.
                  </p>
                </div>

                <div class="maintenance-action">
                  <v-btn
                    color="error"
                    variant="elevated"
                    min-width="260"
                    elevation="2"
                    prepend-icon="mdi-delete-alert"
                    :loading="deletingAlerts"
                    @click="deleteAlertsDialog = true"
                  >
                    Delete All Alerts
                  </v-btn>
                  <p class="text-body-2 mt-2">
                    This will permanently delete all alert data from the system. This
                    action cannot be undone.
                  </p>
                </div>
              </div>

              <v-alert
                v-if="actionMessage"
                :type="actionSuccess ? 'success' : 'error'"
                variant="tonal"
                class="mt-4"
                closable
                @click:close="actionMessage = ''"
              >
                {{ actionMessage }}
              </v-alert>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-col>
    </v-row>
    <!-- Delete Alerts Confirmation Dialog -->
    <v-dialog v-model="deleteAlertsDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Delete All Alerts</v-card-title>
        <v-card-text>
          Are you sure you want to delete all alerts? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="deleteAlertsDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" variant="text" @click="handleDeleteAllAlerts">
            Delete All
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useDisplay } from "vuetify";
import { getHealth, getStats, testDiscord } from "@/services/system";
import { deleteAllAlerts } from "@/services/alerts";
import type { HealthStatus, StatsData } from "@/types";
import StatusBadge from "@/components/StatusBadge.vue";

const { lgAndUp } = useDisplay();

const activeTab = ref("health");
const health = ref<HealthStatus | null>(null);
const stats = ref<StatsData | null>(null);
const error = ref("");
const refreshing = ref(false);
const testingDiscord = ref(false);
const deletingAlerts = ref(false);
const deleteAlertsDialog = ref(false);
const actionMessage = ref("");
const actionSuccess = ref(false);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

const handleDeleteAllAlerts = async () => {
  deletingAlerts.value = true;
  actionMessage.value = "";
  try {
    await deleteAllAlerts();
    actionMessage.value = "All alerts have been successfully deleted.";
    actionSuccess.value = true;
    await fetchData();
  } catch {
    actionMessage.value = "Failed to delete alerts. Please try again.";
    actionSuccess.value = false;
  } finally {
    deletingAlerts.value = false;
    deleteAlertsDialog.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.settings-container {
  height: 100%;
}

.maintenance-actions {
  display: flex;
  flex-direction: column;
  max-width: 500px;
}

.maintenance-action {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.settings-container :deep(.v-card-text) {
  padding: 8px 0 0;
}

@media (min-width: 1280px) {
  .settings-container :deep(.v-card-text) {
    padding: 16px 0 0 16px;
  }
}
</style>
