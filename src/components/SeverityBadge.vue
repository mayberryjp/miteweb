<template>
  <span class="severity-badge" :class="severityClass">{{ severity }}</span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ severity: string }>();

const severityClass = computed(() => {
  const s = props.severity?.toLowerCase() || "info";
  return `severity-${s}`;
});
</script>

<style scoped>
.severity-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.severity-info {
  color: var(--severity-info);
  background: rgba(88, 166, 255, 0.15);
}
.severity-low {
  color: var(--severity-low);
  background: rgba(63, 185, 80, 0.15);
}
.severity-medium {
  color: var(--severity-medium);
  background: rgba(210, 153, 34, 0.15);
}
.severity-high {
  color: var(--severity-high);
  background: rgba(219, 109, 40, 0.15);
}
.severity-critical {
  color: var(--severity-critical);
  background: rgba(248, 81, 73, 0.15);
}
/* Syslog severity levels */
.severity-debug {
  color: #8b949e;
  background: rgba(139, 148, 158, 0.15);
}
.severity-notice {
  color: #58a6ff;
  background: rgba(88, 166, 255, 0.15);
}
.severity-warning {
  color: #d29922;
  background: rgba(210, 153, 34, 0.15);
}
.severity-err {
  color: #db6d28;
  background: rgba(219, 109, 40, 0.15);
}
.severity-crit {
  color: #f85149;
  background: rgba(248, 81, 73, 0.15);
}
.severity-alert {
  color: #f85149;
  background: rgba(248, 81, 73, 0.2);
}
.severity-emerg {
  color: #ff7b72;
  background: rgba(255, 123, 114, 0.25);
}
</style>
