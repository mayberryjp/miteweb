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
          <v-tab value="processing">PROCESSING</v-tab>
          <v-tab value="network-tuning">NETWORK TUNING</v-tab>
          <v-tab value="retention">RETENTION</v-tab>
          <v-tab value="health">HEALTH</v-tab>
          <v-tab value="hits">PATTERN HITS</v-tab>
          <v-tab value="prompt">PROMPT</v-tab>
          <v-tab value="notifications">NOTIFICATIONS</v-tab>
          <v-tab value="bulk-operations">BULK OPERATIONS</v-tab>
          <v-tab value="actions">DANGEROUS ACTIONS</v-tab>
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
              <h3>Dangerous Actions</h3>
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

            <v-window-item value="processing">
              <h3>Processing Settings</h3>
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
                      <div class="font-weight-medium">AI Discovery Interval (seconds)</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="aiDiscoveryIntervalSeconds"
                          variant="outlined"
                          density="compact"
                          type="number"
                          @blur="flushProcessingAutoSave"
                          :disabled="processingLoading || processingSaving"
                          hide-details
                          class="processing-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Controls how often the AI worker wakes up to process pending pattern classifications. Lower values make classification more responsive; higher values reduce API usage and background load.</div>
                        <div class="setting-default">Default: <span>3600</span></div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td class="setting-name-cell">
                      <div class="font-weight-medium">AI Batch Size</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="aiBatchSize"
                          variant="outlined"
                          density="compact"
                          type="number"
                          @blur="flushProcessingAutoSave"
                          :disabled="processingLoading || processingSaving"
                          hide-details
                          class="processing-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Sets how many pending patterns the AI worker sends for classification in one cycle. Larger batches drain backlog faster but consume rate limit capacity more quickly.</div>
                        <div class="setting-default">Default: <span>20</span></div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td class="setting-name-cell">
                      <div class="font-weight-medium">Processor Interval (seconds)</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="processorIntervalSeconds"
                          variant="outlined"
                          density="compact"
                          type="number"
                          @blur="flushProcessingAutoSave"
                          :disabled="processingLoading || processingSaving"
                          hide-details
                          class="processing-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Defines how often the log processor loop runs. Lower values reduce processing latency, while higher values reduce CPU/database churn.</div>
                        <div class="setting-default">Default: <span>10</span></div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td class="setting-name-cell">
                      <div class="font-weight-medium">Processor Fetch Limit</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="processorFetchLimit"
                          variant="outlined"
                          density="compact"
                          type="number"
                          @blur="flushProcessingAutoSave"
                          :disabled="processingLoading || processingSaving"
                          hide-details
                          class="processing-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Limits how many unprocessed logs are pulled per processor cycle. Higher values improve catch-up speed during backlog, but each cycle may take longer.</div>
                        <div class="setting-default">Default: <span>100</span></div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td class="setting-name-cell">
                      <div class="font-weight-medium">Retention Check Interval (seconds)</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="retentionCheckIntervalSeconds"
                          variant="outlined"
                          density="compact"
                          type="number"
                          @blur="flushProcessingAutoSave"
                          :disabled="processingLoading || processingSaving"
                          hide-details
                          class="processing-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Controls how often retention cleanup runs for old logs/alerts. Lower values clean up more aggressively; higher values reduce cleanup frequency and load.</div>
                        <div class="setting-default">Default: <span>3600</span></div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td class="setting-name-cell">
                      <div class="font-weight-medium">Regex Cache TTL (seconds)</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="regexCacheTtlSeconds"
                          variant="outlined"
                          density="compact"
                          type="number"
                          @blur="flushProcessingAutoSave"
                          :disabled="processingLoading || processingSaving"
                          hide-details
                          class="processing-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">How long compiled regex pattern cache is kept in the processor before refreshing from the database. Lower values pick up regex updates faster; higher values reduce DB lookups.</div>
                        <div class="setting-default">Default: <span>60</span></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-alert
                v-if="processingMessage"
                :type="processingSuccess ? 'success' : 'error'"
                variant="tonal"
                class="mt-4"
                closable
                @click:close="processingMessage = ''"
              >
                {{ processingMessage }}
              </v-alert>
            </v-window-item>

            <v-window-item value="network-tuning">
              <h3>Network Tuning</h3>
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
                      <div class="font-weight-medium">UDP Batch Size</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="udpBatchSize"
                          variant="outlined"
                          density="compact"
                          type="number"
                          @blur="flushNetworkTuningAutoSave"
                          :disabled="networkTuningLoading || networkTuningSaving"
                          hide-details
                          class="network-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Number of UDP-ingested log records buffered before writing a batch to the database. Higher values improve write efficiency under load but can increase memory use and flush latency.</div>
                        <div class="setting-default">Default: <span>500</span></div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td class="setting-name-cell">
                      <div class="font-weight-medium">UDP Batch Flush Interval (seconds)</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="udpBatchFlushIntervalSeconds"
                          variant="outlined"
                          density="compact"
                          type="number"
                          step="0.1"
                          @blur="flushNetworkTuningAutoSave"
                          :disabled="networkTuningLoading || networkTuningSaving"
                          hide-details
                          class="network-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Maximum time UDP logs wait in memory before being flushed, even if batch size is not reached. Lower values improve freshness; higher values improve batching efficiency.</div>
                        <div class="setting-default">Default: <span>1.0</span></div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td class="setting-name-cell">
                      <div class="font-weight-medium">UDP Receive Buffer (bytes)</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="udpRecvBufferBytes"
                          variant="outlined"
                          density="compact"
                          type="number"
                          @blur="flushNetworkTuningAutoSave"
                          :disabled="networkTuningLoading || networkTuningSaving"
                          hide-details
                          class="network-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Requested OS socket receive buffer size for the UDP listener. Increasing this helps absorb bursts and reduce packet drops on busy networks.</div>
                        <div class="setting-default">Default: <span>4194304</span></div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td class="setting-name-cell">
                      <div class="font-weight-medium">TCP Batch Size</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="tcpBatchSize"
                          variant="outlined"
                          density="compact"
                          type="number"
                          @blur="flushNetworkTuningAutoSave"
                          :disabled="networkTuningLoading || networkTuningSaving"
                          hide-details
                          class="network-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Number of TCP-ingested log records buffered per connection before database flush. Larger values can improve throughput but may delay writes for low-volume senders.</div>
                        <div class="setting-default">Default: <span>500</span></div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td class="setting-name-cell">
                      <div class="font-weight-medium">TCP Batch Flush Interval (seconds)</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="tcpBatchFlushIntervalSeconds"
                          variant="outlined"
                          density="compact"
                          type="number"
                          step="0.1"
                          @blur="flushNetworkTuningAutoSave"
                          :disabled="networkTuningLoading || networkTuningSaving"
                          hide-details
                          class="network-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Maximum time buffered TCP logs wait before being flushed when batch size is not reached. Lower values reduce end-to-end delay; higher values favor larger batched writes.</div>
                        <div class="setting-default">Default: <span>1.0</span></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-alert
                v-if="networkTuningMessage"
                :type="networkTuningSuccess ? 'success' : 'error'"
                variant="tonal"
                class="mt-4"
                closable
                @click:close="networkTuningMessage = ''"
              >
                {{ networkTuningMessage }}
              </v-alert>
            </v-window-item>

            <v-window-item value="retention">
              <h3>Retention Settings</h3>
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
                      <div class="font-weight-medium">Log Retention Days</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="logRetentionDays"
                          variant="outlined"
                          density="compact"
                          type="number"
                          @blur="flushRetentionAutoSave"
                          :disabled="retentionLoading || retentionSaving"
                          hide-details
                          class="retention-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Number of days to keep processed log records before automatic cleanup deletes older entries. Increase it for longer forensic history; decrease it to reduce database size growth.</div>
                        <div class="setting-default">Default: <span>14</span></div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td class="setting-name-cell">
                      <div class="font-weight-medium">Alert Retention Days</div>
                    </td>
                    <td class="align-top">
                      <div class="setting-row-flex">
                        <v-text-field
                          v-model="alertRetentionDays"
                          variant="outlined"
                          density="compact"
                          type="number"
                          @blur="flushRetentionAutoSave"
                          :disabled="retentionLoading || retentionSaving"
                          hide-details
                          class="retention-input"
                        />
                      </div>
                      <div class="setting-meta">
                        <div class="setting-details">Number of days to keep alert records before retention cleanup removes older alerts. Higher values preserve incident history longer, while lower values keep the alerts table smaller and faster.</div>
                        <div class="setting-default">Default: <span>30</span></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-alert
                v-if="retentionMessage"
                :type="retentionSuccess ? 'success' : 'error'"
                variant="tonal"
                class="mt-4"
                closable
                @click:close="retentionMessage = ''"
              >
                {{ retentionMessage }}
              </v-alert>
            </v-window-item>

            <v-window-item value="bulk-operations">
              <h3>Bulk Operations</h3>
              <v-divider class="my-4"></v-divider>
              <BulkOperationsPanel />
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
              <h3>Health</h3>
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
                    <td class="text-medium-emphasis">Backend Version</td>
                    <td class="font-weight-medium">{{ health.version }}</td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis">Frontend Version</td>
                    <td class="font-weight-medium">{{ appVersion }}</td>
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
import BulkOperationsPanel from "@/components/BulkOperationsPanel.vue";
import PatternHitCountMonitor from "@/components/PatternHitCountMonitor.vue";

const { lgAndUp } = useDisplay();

const activeTab = ref("general");
const appVersion = __APP_VERSION__;
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
const initialDiscordNotificationsEnabled = ref(false);
const initialDiscordWebhookUrl = ref("");
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

const normalizeSettingValue = (value: string) => value.trim();

const notificationsDirty = computed(
  () =>
    discordNotificationsEnabled.value !== initialDiscordNotificationsEnabled.value
    || normalizeSettingValue(discordWebhookUrl.value) !== initialDiscordWebhookUrl.value,
);

const fetchNotificationsSettings = async () => {
  notificationsLoading.value = true;
  notificationsMessage.value = "";
  try {
    const [enabled, webhook] = await Promise.allSettled([
      getSetting("discord_notifications_enabled"),
      getSetting("discord_webhook_url"),
    ]);

    const loadedEnabled = enabled.status === "fulfilled"
      ? parseBoolSetting(enabled.value)
      : false;
    const loadedWebhook = webhook.status === "fulfilled"
      ? normalizeSettingValue(webhook.value || "")
      : "";

    discordNotificationsEnabled.value = loadedEnabled;
    discordWebhookUrl.value = loadedWebhook;
    initialDiscordNotificationsEnabled.value = loadedEnabled;
    initialDiscordWebhookUrl.value = loadedWebhook;
  } catch {
    notificationsMessage.value = "Failed to load notification settings.";
    notificationsSuccess.value = false;
  } finally {
    notificationsLoading.value = false;
  }
};

const saveNotificationsSettings = async () => {
  if (!notificationsDirty.value) return;
  if (notificationsSaving.value) {
    notificationsPendingSave.value = true;
    return;
  }

  notificationsSaving.value = true;
  notificationsMessage.value = "";
  try {
    const normalizedWebhook = normalizeSettingValue(discordWebhookUrl.value);

    const updates: Promise<void>[] = [];
    if (discordNotificationsEnabled.value !== initialDiscordNotificationsEnabled.value) {
      updates.push(updateSetting("discord_notifications_enabled", discordNotificationsEnabled.value ? "true" : "false"));
    }
    if (normalizedWebhook !== initialDiscordWebhookUrl.value) {
      updates.push(updateSetting("discord_webhook_url", normalizedWebhook));
    }

    if (updates.length === 0) return;

    await Promise.all(updates);

    discordWebhookUrl.value = normalizedWebhook;
    initialDiscordNotificationsEnabled.value = discordNotificationsEnabled.value;
    initialDiscordWebhookUrl.value = normalizedWebhook;
    notificationsMessage.value = "Notification settings auto-saved.";
    notificationsSuccess.value = true;
  } catch {
    notificationsMessage.value = "Failed to save notification settings.";
    notificationsSuccess.value = false;
  } finally {
    notificationsSaving.value = false;
    if (notificationsPendingSave.value && notificationsDirty.value) {
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
  if (!notificationsDirty.value) return;
  notificationsPendingSave.value = true;
  scheduleNotificationsAutoSave();
});

// Processing tab state
const processingLoading = ref(false);
const processingSaving = ref(false);
const processingMessage = ref("");
const processingSuccess = ref(false);
const aiDiscoveryIntervalSeconds = ref("");
const aiBatchSize = ref("");
const processorIntervalSeconds = ref("");
const processorFetchLimit = ref("");
const retentionCheckIntervalSeconds = ref("");
const regexCacheTtlSeconds = ref("");
const initialAiDiscoveryIntervalSeconds = ref("");
const initialAiBatchSize = ref("");
const initialProcessorIntervalSeconds = ref("");
const initialProcessorFetchLimit = ref("");
const initialRetentionCheckIntervalSeconds = ref("");
const initialRegexCacheTtlSeconds = ref("");
const processingPendingSave = ref(false);
let processingAutoSaveTimer: ReturnType<typeof setTimeout> | null = null;

const processingDirty = computed(
  () =>
    normalizeSettingValue(aiDiscoveryIntervalSeconds.value) !== initialAiDiscoveryIntervalSeconds.value
    || normalizeSettingValue(aiBatchSize.value) !== initialAiBatchSize.value
    || normalizeSettingValue(processorIntervalSeconds.value) !== initialProcessorIntervalSeconds.value
    || normalizeSettingValue(processorFetchLimit.value) !== initialProcessorFetchLimit.value
    || normalizeSettingValue(retentionCheckIntervalSeconds.value) !== initialRetentionCheckIntervalSeconds.value
    || normalizeSettingValue(regexCacheTtlSeconds.value) !== initialRegexCacheTtlSeconds.value,
);

const fetchProcessingSettings = async () => {
  processingLoading.value = true;
  processingMessage.value = "";
  try {
    const results = await Promise.allSettled([
      getSetting("ai_discovery_interval_seconds"),
      getSetting("ai_batch_size"),
      getSetting("processor_interval_seconds"),
      getSetting("processor_fetch_limit"),
      getSetting("retention_check_interval_seconds"),
      getSetting("regex_cache_ttl_seconds"),
    ]);

    const loadedAiDiscoveryIntervalSeconds = results[0].status === "fulfilled" ? normalizeSettingValue(results[0].value || "") : "";
    const loadedAiBatchSize = results[1].status === "fulfilled" ? normalizeSettingValue(results[1].value || "") : "";
    const loadedProcessorIntervalSeconds = results[2].status === "fulfilled" ? normalizeSettingValue(results[2].value || "") : "";
    const loadedProcessorFetchLimit = results[3].status === "fulfilled" ? normalizeSettingValue(results[3].value || "") : "";
    const loadedRetentionCheckIntervalSeconds = results[4].status === "fulfilled" ? normalizeSettingValue(results[4].value || "") : "";
    const loadedRegexCacheTtlSeconds = results[5].status === "fulfilled" ? normalizeSettingValue(results[5].value || "") : "";

    aiDiscoveryIntervalSeconds.value = loadedAiDiscoveryIntervalSeconds;
    aiBatchSize.value = loadedAiBatchSize;
    processorIntervalSeconds.value = loadedProcessorIntervalSeconds;
    processorFetchLimit.value = loadedProcessorFetchLimit;
    retentionCheckIntervalSeconds.value = loadedRetentionCheckIntervalSeconds;
    regexCacheTtlSeconds.value = loadedRegexCacheTtlSeconds;

    initialAiDiscoveryIntervalSeconds.value = loadedAiDiscoveryIntervalSeconds;
    initialAiBatchSize.value = loadedAiBatchSize;
    initialProcessorIntervalSeconds.value = loadedProcessorIntervalSeconds;
    initialProcessorFetchLimit.value = loadedProcessorFetchLimit;
    initialRetentionCheckIntervalSeconds.value = loadedRetentionCheckIntervalSeconds;
    initialRegexCacheTtlSeconds.value = loadedRegexCacheTtlSeconds;
  } catch {
    processingMessage.value = "Failed to load processing settings.";
    processingSuccess.value = false;
  } finally {
    processingLoading.value = false;
  }
};

const saveProcessingSettings = async () => {
  if (!processingDirty.value) return;
  if (processingSaving.value) {
    processingPendingSave.value = true;
    return;
  }

  processingSaving.value = true;
  processingMessage.value = "";
  try {
    const normalizedAiDiscoveryIntervalSeconds = normalizeSettingValue(aiDiscoveryIntervalSeconds.value);
    const normalizedAiBatchSize = normalizeSettingValue(aiBatchSize.value);
    const normalizedProcessorIntervalSeconds = normalizeSettingValue(processorIntervalSeconds.value);
    const normalizedProcessorFetchLimit = normalizeSettingValue(processorFetchLimit.value);
    const normalizedRetentionCheckIntervalSeconds = normalizeSettingValue(retentionCheckIntervalSeconds.value);
    const normalizedRegexCacheTtlSeconds = normalizeSettingValue(regexCacheTtlSeconds.value);

    const updates: Promise<void>[] = [];
    if (normalizedAiDiscoveryIntervalSeconds !== initialAiDiscoveryIntervalSeconds.value) {
      updates.push(updateSetting("ai_discovery_interval_seconds", normalizedAiDiscoveryIntervalSeconds));
    }
    if (normalizedAiBatchSize !== initialAiBatchSize.value) {
      updates.push(updateSetting("ai_batch_size", normalizedAiBatchSize));
    }
    if (normalizedProcessorIntervalSeconds !== initialProcessorIntervalSeconds.value) {
      updates.push(updateSetting("processor_interval_seconds", normalizedProcessorIntervalSeconds));
    }
    if (normalizedProcessorFetchLimit !== initialProcessorFetchLimit.value) {
      updates.push(updateSetting("processor_fetch_limit", normalizedProcessorFetchLimit));
    }
    if (normalizedRetentionCheckIntervalSeconds !== initialRetentionCheckIntervalSeconds.value) {
      updates.push(updateSetting("retention_check_interval_seconds", normalizedRetentionCheckIntervalSeconds));
    }
    if (normalizedRegexCacheTtlSeconds !== initialRegexCacheTtlSeconds.value) {
      updates.push(updateSetting("regex_cache_ttl_seconds", normalizedRegexCacheTtlSeconds));
    }

    if (updates.length === 0) return;

    await Promise.all(updates);

    aiDiscoveryIntervalSeconds.value = normalizedAiDiscoveryIntervalSeconds;
    aiBatchSize.value = normalizedAiBatchSize;
    processorIntervalSeconds.value = normalizedProcessorIntervalSeconds;
    processorFetchLimit.value = normalizedProcessorFetchLimit;
    retentionCheckIntervalSeconds.value = normalizedRetentionCheckIntervalSeconds;
    regexCacheTtlSeconds.value = normalizedRegexCacheTtlSeconds;

    initialAiDiscoveryIntervalSeconds.value = normalizedAiDiscoveryIntervalSeconds;
    initialAiBatchSize.value = normalizedAiBatchSize;
    initialProcessorIntervalSeconds.value = normalizedProcessorIntervalSeconds;
    initialProcessorFetchLimit.value = normalizedProcessorFetchLimit;
    initialRetentionCheckIntervalSeconds.value = normalizedRetentionCheckIntervalSeconds;
    initialRegexCacheTtlSeconds.value = normalizedRegexCacheTtlSeconds;
    processingMessage.value = "Processing settings auto-saved.";
    processingSuccess.value = true;
  } catch {
    processingMessage.value = "Failed to save processing settings.";
    processingSuccess.value = false;
  } finally {
    processingSaving.value = false;
    if (processingPendingSave.value && processingDirty.value) {
      scheduleProcessingAutoSave();
    }
  }
};

const scheduleProcessingAutoSave = () => {
  if (processingAutoSaveTimer) clearTimeout(processingAutoSaveTimer);
  processingAutoSaveTimer = setTimeout(() => {
    processingAutoSaveTimer = null;
    if (!processingPendingSave.value) return;
    processingPendingSave.value = false;
    void saveProcessingSettings();
  }, 600);
};

const flushProcessingAutoSave = () => {
  if (!processingPendingSave.value) return;
  if (processingAutoSaveTimer) {
    clearTimeout(processingAutoSaveTimer);
    processingAutoSaveTimer = null;
  }
  processingPendingSave.value = false;
  void saveProcessingSettings();
};

watch([aiDiscoveryIntervalSeconds, aiBatchSize, processorIntervalSeconds, processorFetchLimit, retentionCheckIntervalSeconds, regexCacheTtlSeconds], () => {
  if (processingLoading.value) return;
  if (!processingDirty.value) return;
  processingPendingSave.value = true;
  scheduleProcessingAutoSave();
});

// Network Tuning tab state
const networkTuningLoading = ref(false);
const networkTuningSaving = ref(false);
const networkTuningMessage = ref("");
const networkTuningSuccess = ref(false);
const udpBatchSize = ref("");
const udpBatchFlushIntervalSeconds = ref("");
const udpRecvBufferBytes = ref("");
const tcpBatchSize = ref("");
const tcpBatchFlushIntervalSeconds = ref("");
const initialUdpBatchSize = ref("");
const initialUdpBatchFlushIntervalSeconds = ref("");
const initialUdpRecvBufferBytes = ref("");
const initialTcpBatchSize = ref("");
const initialTcpBatchFlushIntervalSeconds = ref("");
const networkTuningPendingSave = ref(false);
let networkTuningAutoSaveTimer: ReturnType<typeof setTimeout> | null = null;

const networkTuningDirty = computed(
  () =>
    normalizeSettingValue(udpBatchSize.value) !== initialUdpBatchSize.value
    || normalizeSettingValue(udpBatchFlushIntervalSeconds.value) !== initialUdpBatchFlushIntervalSeconds.value
    || normalizeSettingValue(udpRecvBufferBytes.value) !== initialUdpRecvBufferBytes.value
    || normalizeSettingValue(tcpBatchSize.value) !== initialTcpBatchSize.value
    || normalizeSettingValue(tcpBatchFlushIntervalSeconds.value) !== initialTcpBatchFlushIntervalSeconds.value,
);

const fetchNetworkTuningSettings = async () => {
  networkTuningLoading.value = true;
  networkTuningMessage.value = "";
  try {
    const results = await Promise.allSettled([
      getSetting("udp_batch_size"),
      getSetting("udp_batch_flush_interval_seconds"),
      getSetting("udp_recv_buffer_bytes"),
      getSetting("tcp_batch_size"),
      getSetting("tcp_batch_flush_interval_seconds"),
    ]);

    const loadedUdpBatchSize = results[0].status === "fulfilled" ? normalizeSettingValue(results[0].value || "") : "";
    const loadedUdpBatchFlushIntervalSeconds = results[1].status === "fulfilled" ? normalizeSettingValue(results[1].value || "") : "";
    const loadedUdpRecvBufferBytes = results[2].status === "fulfilled" ? normalizeSettingValue(results[2].value || "") : "";
    const loadedTcpBatchSize = results[3].status === "fulfilled" ? normalizeSettingValue(results[3].value || "") : "";
    const loadedTcpBatchFlushIntervalSeconds = results[4].status === "fulfilled" ? normalizeSettingValue(results[4].value || "") : "";

    udpBatchSize.value = loadedUdpBatchSize;
    udpBatchFlushIntervalSeconds.value = loadedUdpBatchFlushIntervalSeconds;
    udpRecvBufferBytes.value = loadedUdpRecvBufferBytes;
    tcpBatchSize.value = loadedTcpBatchSize;
    tcpBatchFlushIntervalSeconds.value = loadedTcpBatchFlushIntervalSeconds;

    initialUdpBatchSize.value = loadedUdpBatchSize;
    initialUdpBatchFlushIntervalSeconds.value = loadedUdpBatchFlushIntervalSeconds;
    initialUdpRecvBufferBytes.value = loadedUdpRecvBufferBytes;
    initialTcpBatchSize.value = loadedTcpBatchSize;
    initialTcpBatchFlushIntervalSeconds.value = loadedTcpBatchFlushIntervalSeconds;
  } catch {
    networkTuningMessage.value = "Failed to load network tuning settings.";
    networkTuningSuccess.value = false;
  } finally {
    networkTuningLoading.value = false;
  }
};

const saveNetworkTuningSettings = async () => {
  if (!networkTuningDirty.value) return;
  if (networkTuningSaving.value) {
    networkTuningPendingSave.value = true;
    return;
  }

  networkTuningSaving.value = true;
  networkTuningMessage.value = "";
  try {
    const normalizedUdpBatchSize = normalizeSettingValue(udpBatchSize.value);
    const normalizedUdpBatchFlushIntervalSeconds = normalizeSettingValue(udpBatchFlushIntervalSeconds.value);
    const normalizedUdpRecvBufferBytes = normalizeSettingValue(udpRecvBufferBytes.value);
    const normalizedTcpBatchSize = normalizeSettingValue(tcpBatchSize.value);
    const normalizedTcpBatchFlushIntervalSeconds = normalizeSettingValue(tcpBatchFlushIntervalSeconds.value);

    const updates: Promise<void>[] = [];
    if (normalizedUdpBatchSize !== initialUdpBatchSize.value) {
      updates.push(updateSetting("udp_batch_size", normalizedUdpBatchSize));
    }
    if (normalizedUdpBatchFlushIntervalSeconds !== initialUdpBatchFlushIntervalSeconds.value) {
      updates.push(updateSetting("udp_batch_flush_interval_seconds", normalizedUdpBatchFlushIntervalSeconds));
    }
    if (normalizedUdpRecvBufferBytes !== initialUdpRecvBufferBytes.value) {
      updates.push(updateSetting("udp_recv_buffer_bytes", normalizedUdpRecvBufferBytes));
    }
    if (normalizedTcpBatchSize !== initialTcpBatchSize.value) {
      updates.push(updateSetting("tcp_batch_size", normalizedTcpBatchSize));
    }
    if (normalizedTcpBatchFlushIntervalSeconds !== initialTcpBatchFlushIntervalSeconds.value) {
      updates.push(updateSetting("tcp_batch_flush_interval_seconds", normalizedTcpBatchFlushIntervalSeconds));
    }

    if (updates.length === 0) return;

    await Promise.all(updates);

    udpBatchSize.value = normalizedUdpBatchSize;
    udpBatchFlushIntervalSeconds.value = normalizedUdpBatchFlushIntervalSeconds;
    udpRecvBufferBytes.value = normalizedUdpRecvBufferBytes;
    tcpBatchSize.value = normalizedTcpBatchSize;
    tcpBatchFlushIntervalSeconds.value = normalizedTcpBatchFlushIntervalSeconds;

    initialUdpBatchSize.value = normalizedUdpBatchSize;
    initialUdpBatchFlushIntervalSeconds.value = normalizedUdpBatchFlushIntervalSeconds;
    initialUdpRecvBufferBytes.value = normalizedUdpRecvBufferBytes;
    initialTcpBatchSize.value = normalizedTcpBatchSize;
    initialTcpBatchFlushIntervalSeconds.value = normalizedTcpBatchFlushIntervalSeconds;
    networkTuningMessage.value = "Network tuning settings auto-saved.";
    networkTuningSuccess.value = true;
  } catch {
    networkTuningMessage.value = "Failed to save network tuning settings.";
    networkTuningSuccess.value = false;
  } finally {
    networkTuningSaving.value = false;
    if (networkTuningPendingSave.value && networkTuningDirty.value) {
      scheduleNetworkTuningAutoSave();
    }
  }
};

const scheduleNetworkTuningAutoSave = () => {
  if (networkTuningAutoSaveTimer) clearTimeout(networkTuningAutoSaveTimer);
  networkTuningAutoSaveTimer = setTimeout(() => {
    networkTuningAutoSaveTimer = null;
    if (!networkTuningPendingSave.value) return;
    networkTuningPendingSave.value = false;
    void saveNetworkTuningSettings();
  }, 600);
};

const flushNetworkTuningAutoSave = () => {
  if (!networkTuningPendingSave.value) return;
  if (networkTuningAutoSaveTimer) {
    clearTimeout(networkTuningAutoSaveTimer);
    networkTuningAutoSaveTimer = null;
  }
  networkTuningPendingSave.value = false;
  void saveNetworkTuningSettings();
};

watch([udpBatchSize, udpBatchFlushIntervalSeconds, udpRecvBufferBytes, tcpBatchSize, tcpBatchFlushIntervalSeconds], () => {
  if (networkTuningLoading.value) return;
  if (!networkTuningDirty.value) return;
  networkTuningPendingSave.value = true;
  scheduleNetworkTuningAutoSave();
});

// Retention tab state
const retentionLoading = ref(false);
const retentionSaving = ref(false);
const retentionMessage = ref("");
const retentionSuccess = ref(false);
const logRetentionDays = ref("");
const alertRetentionDays = ref("");
const initialLogRetentionDays = ref("");
const initialAlertRetentionDays = ref("");
const retentionPendingSave = ref(false);
let retentionAutoSaveTimer: ReturnType<typeof setTimeout> | null = null;

const retentionDirty = computed(
  () =>
    normalizeSettingValue(logRetentionDays.value) !== initialLogRetentionDays.value
    || normalizeSettingValue(alertRetentionDays.value) !== initialAlertRetentionDays.value,
);

const fetchRetentionSettings = async () => {
  retentionLoading.value = true;
  retentionMessage.value = "";
  try {
    const results = await Promise.allSettled([
      getSetting("log_retention_days"),
      getSetting("alert_retention_days"),
    ]);

    const loadedLogRetentionDays = results[0].status === "fulfilled" ? normalizeSettingValue(results[0].value || "") : "";
    const loadedAlertRetentionDays = results[1].status === "fulfilled" ? normalizeSettingValue(results[1].value || "") : "";

    logRetentionDays.value = loadedLogRetentionDays;
    alertRetentionDays.value = loadedAlertRetentionDays;
    initialLogRetentionDays.value = loadedLogRetentionDays;
    initialAlertRetentionDays.value = loadedAlertRetentionDays;
  } catch {
    retentionMessage.value = "Failed to load retention settings.";
    retentionSuccess.value = false;
  } finally {
    retentionLoading.value = false;
  }
};

const saveRetentionSettings = async () => {
  if (!retentionDirty.value) return;
  if (retentionSaving.value) {
    retentionPendingSave.value = true;
    return;
  }

  retentionSaving.value = true;
  retentionMessage.value = "";
  try {
    const normalizedLogRetentionDays = normalizeSettingValue(logRetentionDays.value);
    const normalizedAlertRetentionDays = normalizeSettingValue(alertRetentionDays.value);

    const updates: Promise<void>[] = [];
    if (normalizedLogRetentionDays !== initialLogRetentionDays.value) {
      updates.push(updateSetting("log_retention_days", normalizedLogRetentionDays));
    }
    if (normalizedAlertRetentionDays !== initialAlertRetentionDays.value) {
      updates.push(updateSetting("alert_retention_days", normalizedAlertRetentionDays));
    }

    if (updates.length === 0) return;

    await Promise.all(updates);

    logRetentionDays.value = normalizedLogRetentionDays;
    alertRetentionDays.value = normalizedAlertRetentionDays;
    initialLogRetentionDays.value = normalizedLogRetentionDays;
    initialAlertRetentionDays.value = normalizedAlertRetentionDays;
    retentionMessage.value = "Retention settings auto-saved.";
    retentionSuccess.value = true;
  } catch {
    retentionMessage.value = "Failed to save retention settings.";
    retentionSuccess.value = false;
  } finally {
    retentionSaving.value = false;
    if (retentionPendingSave.value && retentionDirty.value) {
      scheduleRetentionAutoSave();
    }
  }
};

const scheduleRetentionAutoSave = () => {
  if (retentionAutoSaveTimer) clearTimeout(retentionAutoSaveTimer);
  retentionAutoSaveTimer = setTimeout(() => {
    retentionAutoSaveTimer = null;
    if (!retentionPendingSave.value) return;
    retentionPendingSave.value = false;
    void saveRetentionSettings();
  }, 600);
};

const flushRetentionAutoSave = () => {
  if (!retentionPendingSave.value) return;
  if (retentionAutoSaveTimer) {
    clearTimeout(retentionAutoSaveTimer);
    retentionAutoSaveTimer = null;
  }
  retentionPendingSave.value = false;
  void saveRetentionSettings();
};

watch([logRetentionDays, alertRetentionDays], () => {
  if (retentionLoading.value) return;
  if (!retentionDirty.value) return;
  retentionPendingSave.value = true;
  scheduleRetentionAutoSave();
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

let healthRefreshTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  fetchData();
  fetchPrompt();
  fetchNotificationsSettings();
  fetchProcessingSettings();
  fetchNetworkTuningSettings();
  fetchRetentionSettings();
  healthRefreshTimer = setInterval(fetchData, 60_000);
});

onUnmounted(() => {
  if (notificationsAutoSaveTimer) clearTimeout(notificationsAutoSaveTimer);
  if (processingAutoSaveTimer) clearTimeout(processingAutoSaveTimer);
  if (networkTuningAutoSaveTimer) clearTimeout(networkTuningAutoSaveTimer);
  if (retentionAutoSaveTimer) clearTimeout(retentionAutoSaveTimer);
  if (healthRefreshTimer) clearInterval(healthRefreshTimer);
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
