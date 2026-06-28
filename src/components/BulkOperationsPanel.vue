<template>
  <div>
    <p class="text-body-2 text-medium-emphasis mb-4">
      Bulk operations allow you to apply a single change across many patterns.
    </p>

    <v-btn
      color="info"
      variant="elevated"
      prepend-icon="mdi-download"
      :loading="exportingPatterns"
      @click="handleExportPatterns"
    >
      EXPORT PATTERNS
    </v-btn>

    <p class="text-body-2 mt-3">
      Exports all patterns to a JSON file on the server.
    </p>

    <v-btn
      color="warning"
      variant="elevated"
      prepend-icon="mdi-swap-horizontal-bold"
      class="mt-6"
      :loading="movingLowToNoise"
      @click="handleMoveAllLowToNoise"
    >
      MOVE ALL LOW TO NOISE
    </v-btn>

    <p class="text-body-2 mt-3">
      Reclassifies all patterns currently marked as low into noise.
    </p>

    <div class="d-flex flex-wrap align-center ga-3 mt-6">
      <v-select
        v-model="deleteOldDays"
        :items="deleteOldDayOptions"
        label="Delete patterns not seen in"
        density="comfortable"
        variant="outlined"
        hide-details
        class="days-select"
      />

      <v-btn
        color="error"
        variant="elevated"
        prepend-icon="mdi-delete-sweep"
        :loading="deletingOldPatterns"
        @click="handleDeleteOldPatterns"
      >
        DELETE OLD PATTERNS
      </v-btn>
    </div>

    <p class="text-body-2 mt-3">
      Deletes patterns with no matching logs seen in the selected number of days.
    </p>

    <div class="mt-6">
      <v-btn
        color="warning"
        variant="elevated"
        prepend-icon="mdi-counter"
        :loading="resettingPatternHitCounts"
        @click="handleResetPatternHitCounts"
      >
        RESET PATTERN HIT COUNTS
      </v-btn>
    </div>

    <p class="text-body-2 mt-3">
      Resets hit counts to zero for all patterns.
    </p>

    <div class="mt-6">
      <v-btn
        color="error"
        variant="elevated"
        prepend-icon="mdi-delete-alert"
        :loading="deletingNoiseLogs"
        @click="handleDeleteNoiseLogs"
      >
        DELETE NOISE LOGS
      </v-btn>
    </div>

    <p class="text-body-2 mt-3">
      Deletes all logs classified as noise.
    </p>

    <v-alert
      type="warning"
      variant="tonal"
      density="comfortable"
      class="mt-3"
    >
      Warning: If <strong>Save Noise Logs</strong> is enabled, deleting noise logs can cause Pattern Hit Count Sum and log counts to mismatch.
    </v-alert>

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
import { ref } from "vue";
import { deletePatternsNotSeenInDays, exportPatterns, moveAllLowToNoise, resetPatternHitCounts } from "@/services/rules";
import { deleteNoiseLogs } from "@/services/logs";

const exportingPatterns = ref(false);
const movingLowToNoise = ref(false);
const deletingOldPatterns = ref(false);
const resettingPatternHitCounts = ref(false);
const deletingNoiseLogs = ref(false);
const message = ref("");
const success = ref(false);
const deleteOldDayOptions = [7, 15, 30, 60, 90, 180];
const deleteOldDays = ref(30);

const handleExportPatterns = async () => {
  exportingPatterns.value = true;
  message.value = "";
  try {
    const result = await exportPatterns();
    message.value = `Exported ${result.count.toLocaleString()} patterns to ${result.filename}.`;
    success.value = true;
  } catch {
    message.value = "Failed to export patterns. Please try again.";
    success.value = false;
  } finally {
    exportingPatterns.value = false;
  }
};

const handleMoveAllLowToNoise = async () => {
  movingLowToNoise.value = true;
  message.value = "";
  try {
    const result = await moveAllLowToNoise();
    message.value = `Updated ${result.updated.toLocaleString()} patterns (${result.from} -> ${result.to}).`;
    success.value = true;
  } catch {
    message.value = "Failed to move low patterns to noise. Please try again.";
    success.value = false;
  } finally {
    movingLowToNoise.value = false;
  }
};

const handleDeleteOldPatterns = async () => {
  deletingOldPatterns.value = true;
  message.value = "";
  try {
    const result = await deletePatternsNotSeenInDays(deleteOldDays.value);
    message.value = `Deleted ${result.deleted.toLocaleString()} patterns not seen in ${deleteOldDays.value} days.`;
    success.value = true;
  } catch {
    message.value = `Failed to delete patterns not seen in ${deleteOldDays.value} days. Please try again.`;
    success.value = false;
  } finally {
    deletingOldPatterns.value = false;
  }
};

const handleDeleteNoiseLogs = async () => {
  deletingNoiseLogs.value = true;
  message.value = "";
  try {
    const result = await deleteNoiseLogs();
    message.value = `Deleted ${result.deleted.toLocaleString()} logs classified as noise.`;
    success.value = true;
  } catch {
    message.value = "Failed to delete noise logs. Please try again.";
    success.value = false;
  } finally {
    deletingNoiseLogs.value = false;
  }
};

const handleResetPatternHitCounts = async () => {
  resettingPatternHitCounts.value = true;
  message.value = "";
  try {
    const result = await resetPatternHitCounts();
    message.value = `Reset hit counts for ${result.updated.toLocaleString()} patterns.`;
    success.value = true;
  } catch {
    message.value = "Failed to reset pattern hit counts. Please try again.";
    success.value = false;
  } finally {
    resettingPatternHitCounts.value = false;
  }
};
</script>

<style scoped>
.days-select {
  min-width: 280px;
  max-width: 320px;
}
</style>
