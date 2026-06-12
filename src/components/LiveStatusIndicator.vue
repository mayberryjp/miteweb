<template>
  <div class="live-status">
    <span class="dot" :class="status"></span>
    <span class="label">{{ status.charAt(0).toUpperCase() + status.slice(1) }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ status: "live" | "paused" | "disconnected" }>();
</script>

<style scoped>
.live-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot.live {
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
  animation: pulse 2s infinite;
}
.dot.paused {
  background: var(--warning);
}
.dot.disconnected {
  background: var(--danger);
}
.live { color: var(--success); }
.paused { color: var(--warning); }
.disconnected { color: var(--danger); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
