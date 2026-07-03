<template>
  <v-row>
    <v-col cols="12" lg="3" class="pattern-list-panel">
      <PatternList
        :patterns="patterns"
        :patternStats="patternStats"
        :selectedId="selectedPatternId"
        @select="onSelectPattern"
      />
    </v-col>
    <v-col cols="12" lg="9">
      <router-view />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { usePatternsStore } from "@/stores/patterns";
import type { PatternItem } from "@/types";
import PatternList from "@/components/PatternList.vue";

const route = useRoute();
const router = useRouter();

const patternsStore = usePatternsStore();
const { patterns, patternStats } = storeToRefs(patternsStore);

const selectedPatternId = computed(() => {
  if (route.name === "pattern-detail") return Number(route.params.id);
  return null;
});

const onSelectPattern = (p: PatternItem) => {
  router.push({ name: "pattern-detail", params: { id: p.id } });
};

onMounted(() => {
  void patternsStore.refresh();
});
</script>

<style scoped>
@media (min-width: 1280px) {
  .pattern-list-panel {
    position: sticky;
    top: 68px;
    align-self: flex-start;
    max-height: calc(100vh - 80px);
    overflow-y: auto;
    height: calc(100vh - 80px);
  }
}
</style>
