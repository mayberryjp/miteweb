<template>
  <span class="status-badge" :class="statusClass">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  status: "ok" | "error" | "live" | "paused" | "disconnected" | "pending" | "success" | "failed" | string;
  label?: string;
}>();

const statusClass = computed(() => `status-${props.status}`);
</script>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-ok,
.status-live,
.status-success {
  color: var(--success);
  background: rgba(63, 185, 80, 0.15);
}
.status-error,
.status-disconnected,
.status-failed {
  color: var(--danger);
  background: rgba(248, 81, 73, 0.15);
}
.status-paused,
.status-pending {
  color: var(--warning);
  background: rgba(210, 153, 34, 0.15);
}
</style>
