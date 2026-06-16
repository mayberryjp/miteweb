<template>
  <div>
    <p class="text-body-2 text-medium-emphasis mb-4">
      General application settings. Edit the minimum message length used by the backend.
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
                Messages shorter than this value will be filtered out by the backend.
              </div>
              <div class="setting-default">Default: <span>0</span></div>
              <div class="setting-suggested">Suggested: <span>Use 0 unless you need to suppress very short messages.</span></div>
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
import { getSetting, updateSetting } from "@/services/system";

const settingKey = "min_message_length";
const minMessageLength = ref("0");
const initialValue = ref("0");
const loading = ref(false);
const saving = ref(false);
const message = ref("");
const success = ref(false);
const pendingAutoSave = ref(false);
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

const isDirty = computed(() => minMessageLength.value !== initialValue.value);

const normalizeValue = (value: string) =>
  String(Math.max(0, Number.parseInt(value || "0", 10) || 0));

const fetchSetting = async () => {
  loading.value = true;
  message.value = "";
  try {
    const value = await getSetting(settingKey);
    minMessageLength.value = value ?? "0";
    initialValue.value = minMessageLength.value;
  } catch {
    message.value = "Failed to load min_message_length.";
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
    const normalized = normalizeValue(minMessageLength.value);
    await updateSetting(settingKey, normalized);
    minMessageLength.value = normalized;
    initialValue.value = normalized;
    message.value = "min_message_length auto-saved.";
    success.value = true;
  } catch {
    message.value = "Failed to save min_message_length.";
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
