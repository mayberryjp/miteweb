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
          <v-tab value="general">GENERAL</v-tab>
          <v-tab value="health">BACKEND HEALTH</v-tab>
          <v-tab value="hits">PATTERN HITS</v-tab>
          <v-tab value="prompt">PROMPT</v-tab>
          <v-tab value="notifications">NOTIFICATIONS</v-tab>
          <v-tab value="actions">DANGER ACTIONS</v-tab>
        </v-tabs>
      </v-col>

      <!-- Right side content -->
      <v-col cols="12" lg="9">
        <v-card-text>
          <v-window v-model="activeTab">
            <v-window-item value="general">
              <h3>General Settings</h3>
              <v-divider class="my-4"></v-divider>
              <GeneralSettingsPanel />
            </v-window-item>

            <v-window-item value="actions">
              <h3>Danger Actions</h3>
              <v-divider class="my-4"></v-divider>

              <div class="maintenance-actions">
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

                <div class="maintenance-action mt-6">
                  <v-btn
                    color="error"
                    variant="elevated"
                    min-width="260"
                    elevation="2"
                    prepend-icon="mdi-file-remove"
                    :loading="deletingLogs"
                    @click="deleteLogsDialog = true"
                  >
                    Delete All Logs
                  </v-btn>
                  <p class="text-body-2 mt-2">
                    This will permanently delete all log data from the system. This
                    action cannot be undone.
                  </p>
                </div>

                <div class="maintenance-action mt-6">
                  <v-btn
                    color="error"
                    variant="elevated"
                    min-width="260"
                    elevation="2"
                    prepend-icon="mdi-shape-outline"
                    :loading="deletingPatterns"
                    @click="deletePatternsDialog = true"
                  >
                    Delete All Patterns
                  </v-btn>
                  <p class="text-body-2 mt-2">
                    This will permanently delete all pattern data from the system,
                    reset all log criticality levels, and start running logs through
                    AI analysis again, which may incur costs. This action normally is
                    only used if you've made a major model change, prompt change, etc.
                    This action cannot be undone.
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

            <v-window-item value="notifications">
              <h3>Notifications</h3>
              <v-divider class="my-4"></v-divider>

              <v-table class="settings-form-table" density="compact">
                <thead>
                  <tr>
                    <th class="text-left" colspan="2">Setting</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="setting-name-cell">
                      <div class="font-weight-medium">Discord Notifications</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-switch
                          v-model="discordNotificationsEnabled"
                          color="primary"
                          hide-details
                          density="compact"
                          :disabled="notificationsLoading || notificationsSaving"
                        ></v-switch>
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Enable or disable Discord notifications for alerts and events.</div>
                        <div class="setting-default">Default: <span>Disabled</span></div>
                        <div class="setting-suggested">Suggested: <span>At user's discretion, based on their notification preferences.</span></div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td class="setting-name-cell">
                      <div class="font-weight-medium">Discord Webhook URL</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="discordWebhookUrl"
                          variant="outlined"
                          density="compact"
                          :type="showDiscordWebhook ? 'text' : 'password'"
                          :append-inner-icon="showDiscordWebhook ? 'mdi-eye-off' : 'mdi-eye'"
                          @click:append-inner="showDiscordWebhook = !showDiscordWebhook"
                          @blur="flushNotificationsAutoSave"
                          autocomplete="off"
                          :disabled="notificationsLoading || notificationsSaving"
                          placeholder="Enter your Discord webhook URL"
                          hide-details
                          class="notification-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Webhook URL for the Discord channel where notifications will be sent.</div>
                        <div class="setting-suggested">Suggested: <span>Obtain your own Discord webhook URL from your Discord server integrations. Go to Channel settings and choose integrations and create a new webhook to get the URL.</span></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <div class="d-flex flex-wrap ga-3 mt-4">
                <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-webhook"
                  :loading="testingDiscord"
                  :disabled="notificationsLoading || notificationsSaving"
                  @click="handleTestDiscord"
                >
                  Test Discord Webhook
                </v-btn>
              </div>

              <v-alert
                v-if="notificationsMessage"
                :type="notificationsSuccess ? 'success' : 'error'"
                variant="tonal"
                class="mt-4"
                closable
                @click:close="notificationsMessage = ''"
              >
                {{ notificationsMessage }}
              </v-alert>
            </v-window-item>

            <v-window-item value="prompt">
              <h3>AI Prompt Template</h3>
              <v-divider class="my-4"></v-divider>

              <p class="text-body-2 text-medium-emphasis mb-4">
                Edit the prompt template sent to the AI when analysing syslog patterns.
                Use <strong>Reset to Default</strong> to restore the built-in template.
              </p>

              <v-textarea
                v-model="promptTemplate"
                variant="outlined"
                rows="20"
                auto-grow
                :loading="promptLoading"
                :disabled="promptLoading"
                label="ai_prompt_template"
                class="prompt-textarea"
              />

              <div class="d-flex gap-3 mt-3">
                <v-btn
                  color="primary"
                  variant="elevated"
                  :loading="promptSaving"
                  prepend-icon="mdi-content-save"
                  @click="savePrompt"
                >
                  Save Prompt
                </v-btn>
                <v-btn
                  color="secondary"
                  variant="outlined"
                  :loading="promptResetting"
                  prepend-icon="mdi-restore"
                  @click="resetPrompt"
                >
                  Reset to Default
                </v-btn>
              </div>

              <v-alert
                v-if="promptMessage"
                :type="promptSuccess ? 'success' : 'error'"
                variant="tonal"
                class="mt-4"
                closable
                @click:close="promptMessage = ''"
              >
                {{ promptMessage }}
              </v-alert>
            </v-window-item>

            <v-window-item value="hits">
              <h3>Pattern Hit Counts</h3>
              <v-divider class="my-4"></v-divider>
              <PatternHitCountMonitor />
            </v-window-item>

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
                  <tr v-if="stats?.total_patterns != null">
                    <td class="text-medium-emphasis">Estimated AI API Costs</td>
                    <td class="font-weight-medium">{{ aiApiCosts }}</td>
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

    <v-dialog v-model="deleteLogsDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Delete All Logs</v-card-title>
        <v-card-text>
          Are you sure you want to delete all logs? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="deleteLogsDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" variant="text" @click="handleDeleteAllLogs">
            Delete All
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deletePatternsDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Delete All Patterns</v-card-title>
        <v-card-text>
          Are you sure you want to delete all patterns? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="deletePatternsDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" variant="text" @click="handleDeleteAllPatterns">
            Delete All
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from "vue";
import { useDisplay } from "vuetify";
import { getHealth, getStats, testDiscord, getSetting, updateSetting, resetSetting } from "@/services/system";
import { deleteAllAlerts } from "@/services/alerts";
import { deleteAllLogs } from "@/services/logs";
import { deleteAllPatterns } from "@/services/rules";
import type { HealthStatus, StatsData } from "@/types";
import StatusBadge from "@/components/StatusBadge.vue";
import GeneralSettingsPanel from "@/components/GeneralSettingsPanel.vue";
import PatternHitCountMonitor from "@/components/PatternHitCountMonitor.vue";

const { lgAndUp } = useDisplay();

const activeTab = ref("general");
const health = ref<HealthStatus | null>(null);
const stats = ref<StatsData | null>(null);
const error = ref("");
const refreshing = ref(false);
const testingDiscord = ref(false);
const deletingAlerts = ref(false);
const deleteAlertsDialog = ref(false);
const deletingLogs = ref(false);
const deleteLogsDialog = ref(false);
const deletingPatterns = ref(false);
const deletePatternsDialog = ref(false);
const actionMessage = ref("");
const actionSuccess = ref(false);
const notificationsLoading = ref(false);
const notificationsSaving = ref(false);
const notificationsMessage = ref("");
const notificationsSuccess = ref(false);
const discordNotificationsEnabled = ref(false);
const discordWebhookUrl = ref("");
const showDiscordWebhook = ref(false);
const notificationsPendingSave = ref(false);
let notificationsAutoSaveTimer: ReturnType<typeof setTimeout> | null = null;

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
const AI_API_COST_PER_PATTERN = 0.00025;

const aiApiCosts = computed(() => {
  const totalPatterns = stats.value?.total_patterns ?? 0;
  const totalCost = totalPatterns * AI_API_COST_PER_PATTERN;
  return `$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
});

const parseBoolSetting = (value: string) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
};

const fetchNotificationsSettings = async () => {
  notificationsLoading.value = true;
  notificationsMessage.value = "";
  try {
    const [enabled, webhook] = await Promise.allSettled([
      getSetting("discord_notifications_enabled"),
      getSetting("discord_webhook_url"),
    ]);

    if (enabled.status === "fulfilled") {
      discordNotificationsEnabled.value = parseBoolSetting(enabled.value);
    } else {
      discordNotificationsEnabled.value = false;
    }

    if (webhook.status === "fulfilled") {
      discordWebhookUrl.value = webhook.value || "";
    } else {
      discordWebhookUrl.value = "";
    }
  } catch {
    notificationsMessage.value = "Failed to load notification settings.";
    notificationsSuccess.value = false;
  } finally {
    notificationsLoading.value = false;
  }
};

const saveNotificationsSettings = async () => {
  if (notificationsSaving.value) {
    notificationsPendingSave.value = true;
    return;
  }

  notificationsSaving.value = true;
  notificationsMessage.value = "";
  try {
    await Promise.all([
      updateSetting("discord_notifications_enabled", discordNotificationsEnabled.value ? "true" : "false"),
      updateSetting("discord_webhook_url", discordWebhookUrl.value.trim()),
    ]);
    notificationsMessage.value = "Notification settings auto-saved.";
    notificationsSuccess.value = true;
  } catch {
    notificationsMessage.value = "Failed to save notification settings.";
    notificationsSuccess.value = false;
  } finally {
    notificationsSaving.value = false;
    if (notificationsPendingSave.value) {
      scheduleNotificationsAutoSave();
    }
  }
};

const scheduleNotificationsAutoSave = () => {
  if (notificationsAutoSaveTimer) clearTimeout(notificationsAutoSaveTimer);
  notificationsAutoSaveTimer = setTimeout(() => {
    notificationsAutoSaveTimer = null;
    if (!notificationsPendingSave.value) return;
    notificationsPendingSave.value = false;
    void saveNotificationsSettings();
  }, 600);
};

const flushNotificationsAutoSave = () => {
  if (!notificationsPendingSave.value) return;
  if (notificationsAutoSaveTimer) {
    clearTimeout(notificationsAutoSaveTimer);
    notificationsAutoSaveTimer = null;
  }
  notificationsPendingSave.value = false;
  void saveNotificationsSettings();
};

watch([discordNotificationsEnabled, discordWebhookUrl], () => {
  if (notificationsLoading.value) return;
  notificationsPendingSave.value = true;
  scheduleNotificationsAutoSave();
});

// Prompt tab state
const promptTemplate = ref("");
const promptLoading = ref(false);
const promptSaving = ref(false);
const promptResetting = ref(false);
const promptMessage = ref("");
const promptSuccess = ref(false);

const fetchPrompt = async () => {
  promptLoading.value = true;
  try {
    promptTemplate.value = await getSetting("ai_prompt_template");
  } catch {
    promptMessage.value = "Failed to load prompt template.";
    promptSuccess.value = false;
  } finally {
    promptLoading.value = false;
  }
};

const savePrompt = async () => {
  promptSaving.value = true;
  promptMessage.value = "";
  try {
    await updateSetting("ai_prompt_template", promptTemplate.value);
    promptMessage.value = "Prompt template saved successfully.";
    promptSuccess.value = true;
  } catch {
    promptMessage.value = "Failed to save prompt template.";
    promptSuccess.value = false;
  } finally {
    promptSaving.value = false;
  }
};

const resetPrompt = async () => {
  promptResetting.value = true;
  promptMessage.value = "";
  try {
    promptTemplate.value = await resetSetting("ai_prompt_template");
    promptMessage.value = "Prompt template reset to default.";
    promptSuccess.value = true;
  } catch {
    promptMessage.value = "Failed to reset prompt template.";
    promptSuccess.value = false;
  } finally {
    promptResetting.value = false;
  }
};

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
  notificationsMessage.value = "";
  try {
    await testDiscord();
    notificationsMessage.value = "Discord test message sent successfully.";
    notificationsSuccess.value = true;
  } catch {
    notificationsMessage.value = "Failed to send Discord test message.";
    notificationsSuccess.value = false;
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

const handleDeleteAllLogs = async () => {
  deletingLogs.value = true;
  actionMessage.value = "";
  try {
    const result = await deleteAllLogs();
    actionMessage.value = `All logs have been successfully deleted (${result.deleted.toLocaleString()} rows).`;
    actionSuccess.value = true;
    await fetchData();
  } catch {
    actionMessage.value = "Failed to delete logs. Please try again.";
    actionSuccess.value = false;
  } finally {
    deletingLogs.value = false;
    deleteLogsDialog.value = false;
  }
};

const handleDeleteAllPatterns = async () => {
  deletingPatterns.value = true;
  actionMessage.value = "";
  try {
    const result = await deleteAllPatterns();
    actionMessage.value = `All patterns have been successfully deleted (${result.deleted.toLocaleString()} rows).`;
    actionSuccess.value = true;
    await fetchData();
  } catch {
    actionMessage.value = "Failed to delete patterns. Please try again.";
    actionSuccess.value = false;
  } finally {
    deletingPatterns.value = false;
    deletePatternsDialog.value = false;
  }
};

onMounted(() => {
  fetchData();
  fetchPrompt();
  fetchNotificationsSettings();
});

onUnmounted(() => {
  if (notificationsAutoSaveTimer) clearTimeout(notificationsAutoSaveTimer);
});
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

.prompt-textarea :deep(textarea) {
  font-family: monospace;
  font-size: 0.85rem;
  line-height: 1.5;
}

.settings-form-table {
  background-color: transparent !important;
}

.settings-form-table :deep(th) {
  color: #b1b8c0 !important;
}

.settings-form-table :deep(td) {
  vertical-align: top;
  border-bottom: none !important;
}

.settings-form-table :deep(tbody tr) {
  border: none !important;
}

.setting-name-cell {
  width: 220px;
  min-width: 220px;
  padding-top: 10px;
}

.align-top {
  vertical-align: top !important;
}

.setting-row-flex {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  width: 100%;
}

.setting-meta {
  margin-bottom: 8px;
}

.setting-details {
  margin-bottom: 2px;
  color: #b1b8c0;
  line-height: 1.4;
}

.setting-default,
.setting-suggested {
  color: #8ab4f8;
  display: inline-block;
  margin-right: 12px;
}

.setting-default span,
.setting-suggested span {
  color: #b1b8c0;
}

.notification-input {
  max-width: 100%;
}
</style>
