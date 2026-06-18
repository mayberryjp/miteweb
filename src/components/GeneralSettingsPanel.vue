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

        <tr>
          <td class="setting-name-cell">
            <div class="font-weight-medium">User Defined Tokenization</div>
          </td>
          <td class="align-top">
            <div class="setting-row-flex setting-row-flex-wrap">
              <v-text-field
                v-model="aiSampleReplacementSourceDraft"
                variant="outlined"
                density="compact"
                :loading="loading || saving"
                :disabled="loading || saving"
                hide-details
                class="general-setting-input replacement-input"
                placeholder="String to replace"
                @keydown.enter.prevent="addAiSampleReplacementRule"
                @blur="flushAutoSave"
              />
              <v-text-field
                v-model="aiSampleReplacementValueDraft"
                variant="outlined"
                density="compact"
                :loading="loading || saving"
                :disabled="loading || saving"
                hide-details
                class="general-setting-input replacement-input"
                placeholder="Tokenization value"
                @keydown.enter.prevent="addAiSampleReplacementRule"
                @blur="flushAutoSave"
              />
              <v-btn
                color="primary"
                variant="outlined"
                :disabled="loading || saving || !aiSampleReplacementSourceDraft.trim() || !aiSampleReplacementValueDraft.trim()"
                @click="addAiSampleReplacementRule"
              >
                Add
              </v-btn>
            </div>

            <div class="chips-wrap mt-2" v-if="aiSampleReplacementRules.length">
              <v-chip
                v-for="(entry, index) in aiSampleReplacementRules"
                :key="`${entry.source}=>${entry.replacement}-${index}`"
                class="mr-2 mb-2"
                closable
                :disabled="loading || saving"
                @click:close="removeAiSampleReplacementRule(index)"
              >
                {{ entry.source }} -> {{ entry.replacement }}
              </v-chip>
            </div>

            <div class="setting-meta">
              <div class="setting-details">
                List of tokenization rules used during preprocessing before AI analysis. Add one tokenization rule at a time with both fields.
              </div>
              <div class="setting-details">
                Tokenization of common patterns helps improve AI regex matching. It's not recommended to remove the default tokens.
              </div>
              <div class="setting-default">Default: <span>empty list</span></div>
              <div class="setting-suggested">Suggested: <span>Use consistent placeholders like NUMBER, IP, HEX, or [].</span></div>
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
import { computed, onUnmounted, ref, watch } from "vue";
import { updateSetting } from "@/services/system";
import type { EditableSetting } from "@/services/system";

const props = defineProps<{
  settings: EditableSetting[];
  settingsReady: boolean;
}>();

const minMessageLengthSettingKey = "min_message_length";
const aiApiDailyRateLimitSettingKey = "ai_api_daily_rate_limit";
const aiSamplePreprocessingStringsSettingKey = "ai_custom_tokens";
type ReplacementRule = {
  source: string;
  replacement: string;
};
const minMessageLength = ref("0");
const aiApiDailyRateLimit = ref("1");
const aiSampleReplacementRules = ref<ReplacementRule[]>([]);
const aiSampleReplacementSourceDraft = ref("");
const aiSampleReplacementValueDraft = ref("");
const initialMinMessageLength = ref("0");
const initialAiApiDailyRateLimit = ref("1");
const initialAiSamplePreprocessingStringsSerialized = ref("");
const loading = ref(true);
const saving = ref(false);
const message = ref("");
const success = ref(false);
const pendingAutoSave = ref(false);
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

const serializeReplacementRules = (values: ReplacementRule[]) =>
  values.map((item) => [item.source, item.replacement] as [string, string]);

const deserializeReplacementRules = (value: unknown) => {
  if (typeof value === "string") {
    try {
      return deserializeReplacementRules(JSON.parse(value) as unknown);
    } catch {
      return [] as ReplacementRule[];
    }
  }

  if (!Array.isArray(value)) return [] as ReplacementRule[];

  return value
    .filter((item): item is [unknown, unknown] => Array.isArray(item) && item.length >= 2)
    .map(([source, replacement]) => ({
      source: String(source ?? "").trim(),
      replacement: String(replacement ?? "").trim(),
    }))
    .filter((item) => item.source.length > 0 && item.replacement.length > 0);
};

const getSettingValue = (key: string, fallback = "") => {
  const setting = props.settings.find((entry) => entry.key === key);
  const value = setting?.value ?? setting?.default ?? fallback;
  return typeof value === "string" ? value : String(value ?? fallback);
};

const getStructuredSettingValue = (key: string) => {
  const setting = props.settings.find((entry) => entry.key === key);
  return setting?.value ?? setting?.default ?? [];
};

const aiSamplePreprocessingStringsPayload = computed(() =>
  serializeReplacementRules(aiSampleReplacementRules.value),
);

const aiSamplePreprocessingStringsSerialized = computed(() =>
  JSON.stringify(aiSamplePreprocessingStringsPayload.value),
);

const isDirty = computed(
  () =>
    minMessageLength.value !== initialMinMessageLength.value
    || aiApiDailyRateLimit.value !== initialAiApiDailyRateLimit.value
    || aiSamplePreprocessingStringsSerialized.value !== initialAiSamplePreprocessingStringsSerialized.value,
);

const normalizeMinMessageLength = (value: string) =>
  String(Math.max(0, Number.parseInt(value || "0", 10) || 0));

const normalizeAiApiDailyRateLimit = (value: string) =>
  String(Math.max(1, Number.parseInt(value || "1", 10) || 1));

const applySettings = () => {
  loading.value = true;
  message.value = "";

  try {
    const loadedMinMessageLength = normalizeMinMessageLength(getSettingValue(minMessageLengthSettingKey, "0"));
    const loadedAiApiDailyRateLimit = normalizeAiApiDailyRateLimit(getSettingValue(aiApiDailyRateLimitSettingKey, "1"));
    const loadedAiSampleReplacementRules = deserializeReplacementRules(getStructuredSettingValue(aiSamplePreprocessingStringsSettingKey));
    const loadedAiSamplePreprocessingStringsSerialized = JSON.stringify(serializeReplacementRules(loadedAiSampleReplacementRules));

    minMessageLength.value = loadedMinMessageLength;
    aiApiDailyRateLimit.value = loadedAiApiDailyRateLimit;
    aiSampleReplacementRules.value = loadedAiSampleReplacementRules;
    initialMinMessageLength.value = loadedMinMessageLength;
    initialAiApiDailyRateLimit.value = loadedAiApiDailyRateLimit;
    initialAiSamplePreprocessingStringsSerialized.value = loadedAiSamplePreprocessingStringsSerialized;
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
    const normalizedAiSamplePreprocessingStringsPayload = aiSamplePreprocessingStringsPayload.value;
    const normalizedAiSamplePreprocessingStringsSerialized = aiSamplePreprocessingStringsSerialized.value;

    const updates: Promise<void>[] = [];
    if (normalizedMinMessageLength !== initialMinMessageLength.value) {
      updates.push(updateSetting(minMessageLengthSettingKey, normalizedMinMessageLength));
    }
    if (normalizedAiApiDailyRateLimit !== initialAiApiDailyRateLimit.value) {
      updates.push(updateSetting(aiApiDailyRateLimitSettingKey, aiApiDailyRateLimitInteger));
    }
    if (normalizedAiSamplePreprocessingStringsSerialized !== initialAiSamplePreprocessingStringsSerialized.value) {
      updates.push(updateSetting(aiSamplePreprocessingStringsSettingKey, normalizedAiSamplePreprocessingStringsPayload));
    }

    if (updates.length === 0) return;

    await Promise.all(updates);

    minMessageLength.value = normalizedMinMessageLength;
    aiApiDailyRateLimit.value = normalizedAiApiDailyRateLimit;
    initialMinMessageLength.value = normalizedMinMessageLength;
    initialAiApiDailyRateLimit.value = normalizedAiApiDailyRateLimit;
    initialAiSamplePreprocessingStringsSerialized.value = normalizedAiSamplePreprocessingStringsSerialized;
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

const addAiSampleReplacementRule = () => {
  const source = aiSampleReplacementSourceDraft.value.trim();
  const replacement = aiSampleReplacementValueDraft.value.trim();
  if (!source || !replacement) return;

  if (aiSampleReplacementRules.value.some((rule) => rule.source === source && rule.replacement === replacement)) {
    aiSampleReplacementSourceDraft.value = "";
    aiSampleReplacementValueDraft.value = "";
    return;
  }

  aiSampleReplacementRules.value.push({ source, replacement });
  aiSampleReplacementSourceDraft.value = "";
  aiSampleReplacementValueDraft.value = "";
};

const removeAiSampleReplacementRule = (index: number) => {
  aiSampleReplacementRules.value.splice(index, 1);
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

watch(aiSamplePreprocessingStringsSerialized, () => {
  if (loading.value) return;
  if (!isDirty.value) return;
  pendingAutoSave.value = true;
  scheduleAutoSave();
});

onUnmounted(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
});

watch(
  () => props.settingsReady,
  (ready) => {
    if (!ready) return;
    applySettings();
  },
  { immediate: true },
);
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

.setting-row-flex-wrap {
  flex-wrap: wrap;
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

.replacement-input {
  min-width: 260px;
}

.chips-wrap {
  margin-left: 16px;
}
</style>
