<template>
  <div class="d-inline-flex align-center ga-1">
    <span class="status-dot" :class="status"></span>
    <span class="text-caption font-weight-bold text-uppercase" :class="'text-' + dotColor">{{ status }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ status: "live" | "paused" | "disconnected" }>();

const dotColor = computed(() => {
  if (props.status === "live") return "success";
  if (props.status === "paused") return "warning";
  return "error";
});
</script>

<style scoped>
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot.live {
  background: rgb(var(--v-theme-success));
  box-shadow: 0 0 6px rgb(var(--v-theme-success));
  animation: pulse 2s infinite;
}
.status-dot.paused {
  background: rgb(var(--v-theme-warning));
}
.status-dot.disconnected {
  background: rgb(var(--v-theme-error));
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
