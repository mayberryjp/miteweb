<template>
  <div class="stats-card">
    <div class="stats-label">{{ label }}</div>
    <div class="stats-value">{{ value }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
}>();
</script>

<style scoped>
.stats-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  min-width: 140px;
}
.stats-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.stats-value {
  font-size: 24px;
  font-weight: 600;
  font-family: var(--font-mono);
  color: var(--text-primary);
}
</style>
