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
import { ref, computed, onMounted, provide } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getPatterns, getPatternStats } from "@/services/rules";
import type { PatternItem } from "@/types";
import PatternList from "@/components/PatternList.vue";

const route = useRoute();
const router = useRouter();

const patterns = ref<PatternItem[]>([]);
const patternStats = ref<Record<string, { hour: string; count: number }[]>>({});

const selectedPatternId = computed(() => {
  if (route.name === "pattern-detail") return Number(route.params.id);
  return null;
});

const onSelectPattern = (p: PatternItem) => {
  router.push({ name: "pattern-detail", params: { id: p.id } });
};

const fetchPatterns = async () => {
  try {
    const [p, ps] = await Promise.allSettled([getPatterns(), getPatternStats(12)]);
    if (p.status === "fulfilled") { patterns.value = p.value?.items ?? []; }
    if (ps.status === "fulfilled") { patternStats.value = ps.value ?? {}; }
  } catch { /* silent */ }
};

provide("patterns", patterns);
provide("patternStats", patternStats);
provide("refreshPatterns", fetchPatterns);

onMounted(fetchPatterns);
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
