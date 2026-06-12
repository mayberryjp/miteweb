<template>
  <div v-if="visible" class="api-error-banner">
    <span class="error-icon">⚠</span>
    <span>{{ message }}</span>
    <button class="dismiss-btn" @click="visible = false">✕</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{ message: string }>();
const visible = ref(true);
</script>

<style scoped>
.api-error-banner {
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid var(--danger);
  border-radius: 6px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--danger);
  font-size: 13px;
  margin-bottom: 16px;
}
.error-icon {
  font-size: 16px;
}
.dismiss-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--danger);
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
}
</style>
