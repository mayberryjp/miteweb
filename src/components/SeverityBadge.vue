<template>
  <v-chip :color="chipColor" size="small" variant="tonal" label>{{ severity }}</v-chip>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ severity: string }>();

const chipColor = computed(() => {
  const s = props.severity?.toLowerCase() || "info";
  const map: Record<string, string> = {
    critical: "red", crit: "red", alert: "red", emerg: "red-darken-2",
    high: "orange", err: "orange",
    medium: "yellow-darken-2", warning: "yellow-darken-2",
    low: "green", notice: "blue", info: "blue",
    debug: "grey", noise: "grey",
  };
  return map[s] || "blue";
});
</script>
