<template>
  <div class="d-flex flex-column align-center justify-center pa-12 text-medium-emphasis">
    <v-icon v-if="icon" size="48" class="mb-4" color="grey">{{ icon }}</v-icon>
    <div class="text-body-1 text-center" style="max-width: 400px;">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string;
  icon?: string;
}>();
</script>
