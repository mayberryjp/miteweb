<template>
  <div>
    <p class="text-body-2 text-medium-emphasis mb-4">
      Bulk operations allow you to apply a single change across many patterns.
    </p>

    <v-btn
      color="warning"
      variant="elevated"
      prepend-icon="mdi-swap-horizontal-bold"
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
import { deletePatternsNotSeenInDays, moveAllLowToNoise } from "@/services/rules";
import { deleteNoiseLogs } from "@/services/logs";

const movingLowToNoise = ref(false);
const deletingOldPatterns = ref(false);
const deletingNoiseLogs = ref(false);
const message = ref("");
const success = ref(false);
const deleteOldDayOptions = [7, 15, 30, 60, 90, 180];
const deleteOldDays = ref(30);

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
</script>

<style scoped>
.days-select {
  min-width: 280px;
  max-width: 320px;
}
</style>
