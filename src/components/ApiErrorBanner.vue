<template>
  <v-alert v-if="visible" type="error" variant="tonal" closable class="mb-4" @click:close="visible = false">
    {{ message }}
  </v-alert>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{ message: string }>();
const visible = ref(true);
</script>
