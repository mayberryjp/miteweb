<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <div class="empty-message">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string;
  icon?: string;
}>();
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: var(--text-secondary);
}
.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}
.empty-message {
  font-size: 14px;
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
}
</style>
