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
            Messages shorter than this value can be filtered out by the backend.
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
            :loading="loading"
            :disabled="loading"
            hide-details
          />
        </div>
      </div>

      <div class="d-flex flex-wrap ga-3 mt-4">
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-content-save"
          :loading="saving"
          :disabled="loading || saving || !isDirty"
          @click="saveSetting"
        >
          Save Setting
        </v-btn>
        <v-btn
          color="secondary"
          variant="outlined"
          prepend-icon="mdi-restore"
          :loading="resetting"
          :disabled="loading || resetting"
          @click="resetSettingValue"
        >
          Reset to Default
        </v-btn>
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
import { computed, onMounted, ref } from "vue";
import { getSetting, updateSetting, resetSetting } from "@/services/system";

const settingKey = "min_message_length";
const minMessageLength = ref("0");
const initialValue = ref("0");
const loading = ref(false);
const saving = ref(false);
const resetting = ref(false);
const message = ref("");
const success = ref(false);

const isDirty = computed(() => minMessageLength.value !== initialValue.value);

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
  saving.value = true;
  message.value = "";
  try {
    const normalized = String(Math.max(0, Number.parseInt(minMessageLength.value || "0", 10) || 0));
    await updateSetting(settingKey, normalized);
    minMessageLength.value = normalized;
    initialValue.value = normalized;
    message.value = "min_message_length saved successfully.";
    success.value = true;
  } catch {
    message.value = "Failed to save min_message_length.";
    success.value = false;
  } finally {
    saving.value = false;
  }
};

const resetSettingValue = async () => {
  resetting.value = true;
  message.value = "";
  try {
    const value = await resetSetting(settingKey);
    minMessageLength.value = value ?? "0";
    initialValue.value = minMessageLength.value;
    message.value = "min_message_length reset to default.";
    success.value = true;
  } catch {
    message.value = "Failed to reset min_message_length.";
    success.value = false;
  } finally {
    resetting.value = false;
  }
};

onMounted(fetchSetting);
</script>

<style scoped>
.general-setting-input {
  min-width: 220px;
  max-width: 280px;
  width: 100%;
}
</style>
