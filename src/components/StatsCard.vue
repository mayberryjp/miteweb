<template>
  <div class="stats-card" :class="accentClass">
    <div class="stats-label">{{ label }}</div>
    <div class="stats-value">{{ value }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  label: string;
  value: string | number;
  accent?: "blue" | "green" | "yellow" | "red" | "purple";
}>();

const accentClass = computed(() => props.accent ? `accent-${props.accent}` : "");
</script>

<style scoped>
.stats-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  min-width: 150px;
  transition: border-color 0.15s ease;
}
.stats-card:hover {
  border-color: var(--border-light);
}
.stats-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 600;
  margin-bottom: 8px;
}
.stats-value {
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-primary);
  letter-spacing: -0.5px;
  line-height: 1.1;
}

/* Accent color variants */
.accent-blue .stats-value { color: var(--accent); }
.accent-green .stats-value { color: var(--success); }
.accent-yellow .stats-value { color: var(--warning); }
.accent-red .stats-value { color: var(--danger); }
.accent-purple .stats-value { color: #a78bfa; }
</style>
