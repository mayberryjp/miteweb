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
import { moveAllLowToNoise } from "@/services/rules";

const movingLowToNoise = ref(false);
const message = ref("");
const success = ref(false);

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
</script>
