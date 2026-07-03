<template>
  <div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { updateSetting, resetSetting } from "@/services/system";
import type { EditableSetting } from "@/services/system";

const props = defineProps<{
  settings: EditableSetting[];
  settingsReady: boolean;
}>();

const PROMPT_SETTING_KEY = "ai_prompt_template";
const promptTemplate = ref("");
const promptLoading = ref(false);
const promptSaving = ref(false);
const promptResetting = ref(false);
const promptMessage = ref("");
const promptSuccess = ref(false);

const loadPrompt = () => {
  const setting = props.settings.find((s) => s.key === PROMPT_SETTING_KEY);
  const rawValue = setting?.value ?? setting?.default ?? "";
  promptTemplate.value = typeof rawValue === "string" ? rawValue : String(rawValue);
};

const savePrompt = async () => {
  promptSaving.value = true;
  promptMessage.value = "";
  try {
    await updateSetting(PROMPT_SETTING_KEY, promptTemplate.value);
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
    promptTemplate.value = await resetSetting(PROMPT_SETTING_KEY);
    promptMessage.value = "Prompt template reset to default.";
    promptSuccess.value = true;
  } catch {
    promptMessage.value = "Failed to reset prompt template.";
    promptSuccess.value = false;
  } finally {
    promptResetting.value = false;
  }
};

watch(
  () => props.settingsReady,
  (ready) => {
    if (ready) loadPrompt();
  },
  { immediate: true }
);
</script>
