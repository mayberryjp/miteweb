<template>
  <div>
    <p class="text-body-2 text-medium-emphasis mb-4">
      General application settings. Edit the minimum message length used by the backend.
    </p>

    <v-card color="#0d1117" variant="outlined" class="pa-4">
      <div class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-4">
        <div class="flex-grow-1">
          <div class="text-caption text-medium-emphasis text-uppercase">min_message_length</div>
          <div class="text-body-2 text-medium-emphasis">
            Messages shorter than this value will be filtered out by the backend.
          </div>
        </div>

        <div class="general-setting-input">
          <v-text-field
            v-model="minMessageLength"
            type="number"
            min="0"
            variant="outlined"
            density="compact"
            label="Minimum Message Length"
            :loading="loading || saving"
            :disabled="loading || resetting"
            hide-details
            @blur="flushAutoSave"
          />
        </div>
      </div>

      <div class="d-flex flex-wrap ga-3 mt-4">
        
      </div>

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
    </v-card>
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
.general-setting-input {
  min-width: 220px;
  max-width: 280px;
  width: 100%;
}
</style>
