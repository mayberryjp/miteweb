<template>
  <div class="filter-bar">
    <input
      v-model="search"
      type="text"
      class="search-input"
      :placeholder="searchPlaceholder"
      @input="$emit('update:search', search)"
    />
    <slot></slot>
    <button v-if="showClear" class="btn btn-secondary" @click="$emit('clear')">
      Clear Filters
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  searchPlaceholder?: string;
  showClear?: boolean;
}>();

defineEmits<{
  "update:search": [value: string];
  clear: [];
}>();

const search = ref("");
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.search-input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--text-primary);
  font-size: 13px;
  min-width: 200px;
  outline: none;
}
.search-input:focus {
  border-color: var(--accent);
}
.search-input::placeholder {
  color: var(--text-muted);
}
</style>
