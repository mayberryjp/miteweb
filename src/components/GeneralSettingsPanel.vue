<template>
  <div>
    <p class="text-body-2 text-medium-emphasis mb-4">
      General application settings.
    </p>

    <v-table class="settings-form-table" density="compact">
      <thead>
        <tr>
          <th class="text-left" colspan="2">Setting</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="setting-name-cell">
            <div class="font-weight-medium">Minimum Message Length</div>
          </td>
          <td class="align-top">
            <div class="setting-row-flex">
              <v-text-field
                v-model="minMessageLength"
                type="number"
                min="0"
                variant="outlined"
                density="compact"
                :loading="loading || saving"
                :disabled="loading || saving"
                hide-details
                class="general-setting-input"
                @blur="flushAutoSave"
              />
            </div>
            <div class="setting-meta">
              <div class="setting-details">
                Messages shorter than this value will be filtered out by the backend. Logs under this value are difficult to classify because there's not enough detail.
              </div>
              <div class="setting-default">Default: <span>50</span></div>
              <div class="setting-suggested">Suggested: <span>50</span></div>
            </div>
          </td>
        </tr>

        <tr>
          <td class="setting-name-cell">
            <div class="font-weight-medium">AI API Daily Rate Limit</div>
          </td>
          <td class="align-top">
            <div class="setting-row-flex">
              <v-text-field
                v-model="aiApiDailyRateLimit"
                type="number"
                min="1"
                variant="outlined"
                density="compact"
                :loading="loading || saving"
                :disabled="loading || saving"
                hide-details
                class="general-setting-input"
                @blur="flushAutoSave"
              />
            </div>
            <div class="setting-meta">
              <div class="setting-details">
                Maximum number of AI API requests allowed in a 24-hour window. Used to control AI costs.
              </div>
              <div class="setting-default">Default: <span>500</span></div>
              <div class="setting-suggested">Suggested: <span>Set based on your expected daily analysis volume and cost target.</span></div>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-alert
      v-if="message"
      :type="success ? 'success' : 'error'"
      variant="tonal"
      class="mt-4"
      closable
      @click:close="message = ''"
    >
      {{ message }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { getSetting, getSettings, updateSetting } from "@/services/system";

const minMessageLengthSettingKey = "min_message_length";
const aiApiDailyRateLimitSettingKey = "ai_api_daily_rate_limit";
const minMessageLength = ref("0");
const aiApiDailyRateLimit = ref("1");
const initialMinMessageLength = ref("0");
const initialAiApiDailyRateLimit = ref("1");
const loading = ref(false);
const saving = ref(false);
const message = ref("");
const success = ref(false);
const pendingAutoSave = ref(false);
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

const isDirty = computed(
  () =>
    minMessageLength.value !== initialMinMessageLength.value
    || aiApiDailyRateLimit.value !== initialAiApiDailyRateLimit.value,
);

const normalizeMinMessageLength = (value: string) =>
  String(Math.max(0, Number.parseInt(value || "0", 10) || 0));

const normalizeAiApiDailyRateLimit = (value: string) =>
  String(Math.max(1, Number.parseInt(value || "1", 10) || 1));

const fetchSetting = async () => {
  loading.value = true;
  message.value = "";
  try {
    await getSettings();

    const [minMessageLengthResult, aiApiDailyRateLimitResult] = await Promise.allSettled([
      getSetting(minMessageLengthSettingKey),
      getSetting(aiApiDailyRateLimitSettingKey),
    ]);

    const loadedMinMessageLength = minMessageLengthResult.status === "fulfilled"
      ? normalizeMinMessageLength(minMessageLengthResult.value)
      : "0";
    const loadedAiApiDailyRateLimit = aiApiDailyRateLimitResult.status === "fulfilled"
      ? normalizeAiApiDailyRateLimit(aiApiDailyRateLimitResult.value)
      : "1";

    minMessageLength.value = loadedMinMessageLength;
    aiApiDailyRateLimit.value = loadedAiApiDailyRateLimit;
    initialMinMessageLength.value = loadedMinMessageLength;
    initialAiApiDailyRateLimit.value = loadedAiApiDailyRateLimit;
  } catch {
    message.value = "Failed to load general settings.";
    success.value = false;
  } finally {
    loading.value = false;
  }
};

const saveSetting = async () => {
  if (saving.value) {
    pendingAutoSave.value = true;
    return;
  }
  if (!isDirty.value) return;

  saving.value = true;
  message.value = "";
  try {
    const normalizedMinMessageLength = normalizeMinMessageLength(minMessageLength.value);
    const normalizedAiApiDailyRateLimit = normalizeAiApiDailyRateLimit(aiApiDailyRateLimit.value);
    const aiApiDailyRateLimitInteger = Number.parseInt(normalizedAiApiDailyRateLimit, 10);

    const updates: Promise<void>[] = [];
    if (normalizedMinMessageLength !== initialMinMessageLength.value) {
      updates.push(updateSetting(minMessageLengthSettingKey, normalizedMinMessageLength));
    }
    if (normalizedAiApiDailyRateLimit !== initialAiApiDailyRateLimit.value) {
      updates.push(updateSetting(aiApiDailyRateLimitSettingKey, aiApiDailyRateLimitInteger));
    }

    if (updates.length === 0) return;

    await Promise.all(updates);

    minMessageLength.value = normalizedMinMessageLength;
    aiApiDailyRateLimit.value = normalizedAiApiDailyRateLimit;
    initialMinMessageLength.value = normalizedMinMessageLength;
    initialAiApiDailyRateLimit.value = normalizedAiApiDailyRateLimit;
    message.value = "General settings auto-saved.";
    success.value = true;
  } catch {
    message.value = "Failed to save general settings.";
    success.value = false;
  } finally {
    saving.value = false;
    if (pendingAutoSave.value && isDirty.value) {
      scheduleAutoSave();
    }
  }
};

const scheduleAutoSave = () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    autoSaveTimer = null;
    if (!pendingAutoSave.value) return;
    pendingAutoSave.value = false;
    void saveSetting();
  }, 600);
};

const flushAutoSave = () => {
  if (!pendingAutoSave.value && !isDirty.value) return;
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  pendingAutoSave.value = false;
  void saveSetting();
};

watch(minMessageLength, () => {
  if (loading.value) return;
  if (!isDirty.value) return;
  pendingAutoSave.value = true;
  scheduleAutoSave();
});

watch(aiApiDailyRateLimit, () => {
  if (loading.value) return;
  if (!isDirty.value) return;
  pendingAutoSave.value = true;
  scheduleAutoSave();
});

onUnmounted(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
});

onMounted(fetchSetting);
</script>

<style scoped>
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

.general-setting-input {
  margin-left: 16px;
  min-width: 220px;
  max-width: 360px;
  width: 100%;
}
</style>
