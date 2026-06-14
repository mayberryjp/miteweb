<template>
  <v-sheet rounded="lg" height="100%" color="#0d1117" class="pattern-list custom-scrollbar">
    <!-- Search Filter -->
    <div class="search-container pa-3">
      <v-text-field
        v-model="searchTerm"
        density="compact"
        variant="outlined"
        placeholder="Search patterns..."
        prepend-inner-icon="mdi-magnify"
        hide-details
        class="search-field"
        clearable
        @click:clear="searchTerm = ''"
      ></v-text-field>
    </div>

    <!-- Classification groups -->
    <v-list>
      <template v-for="group in groupedPatterns" :key="group.classification">
        <!-- Group header -->
        <v-list-item
          class="group-header"
          :class="'group-' + group.classification"
          @click="toggleGroup(group.classification)"
        >
          <div class="d-flex align-center w-100">
            <v-icon
              size="16"
              :class="{ 'chevron-collapsed': collapsedGroups[group.classification] }"
              class="chevron-icon mr-2"
            >mdi-chevron-down</v-icon>
            <span class="group-label">{{ group.label }}</span>
            <v-chip size="x-small" variant="tonal" class="ml-2">{{ group.patterns.length }}</v-chip>
          </div>
        </v-list-item>

        <!-- Pattern items -->
        <template v-if="!collapsedGroups[group.classification]">
          <v-list-item
            v-for="p in group.patterns"
            :key="p.id"
            class="pattern-list-item"
            :class="{ 'selected-pattern': selectedId === p.id }"
            @click="$emit('select', p)"
          >
            <div class="d-flex align-center w-100">
              <div class="icon-container">
                <v-icon :color="classColor(p)" size="24">{{ classIconName(p) }}</v-icon>
              </div>
              <div class="host-info">{{ patternLabel(p) }}</div>
              <AlertBarChart :alertIntervals="getAlertIntervals(p.id)" class="ml-auto mr-2" />
              <div class="threat-score-text" :style="{ color: classColor(p) }">{{ p.hit_count }}</div>
            </div>
          </v-list-item>
        </template>
      </template>
    </v-list>

    <div v-if="!filteredPatterns.length" class="text-body-2 text-medium-emphasis text-center pa-8">
      No patterns discovered yet.
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { PatternItem } from "@/types";
import AlertBarChart from "@/components/AlertBarChart.vue";

const props = defineProps<{
  patterns: PatternItem[];
  patternStats: Record<string, { hour: string; count: number }[]>;
  selectedId: number | null;
}>();

defineEmits<{
  (e: "select", pattern: PatternItem): void;
}>();

const searchTerm = ref("");

const severityOrder: Record<string, number> = {
  critical: 0, crit: 0, emerg: 0, alert: 1,
  high: 2, medium: 3, low: 4, noise: 5, pending: 6,
};

const sortedPatterns = computed(() =>
  [...props.patterns].sort((a, b) => {
    const ca = severityOrder[a.effective_classification || a.classification] ?? 6;
    const cb = severityOrder[b.effective_classification || b.classification] ?? 6;
    if (ca !== cb) return ca - cb;
    return b.hit_count - a.hit_count;
  })
);

const filteredPatterns = computed(() => {
  if (!searchTerm.value) return sortedPatterns.value;
  const q = searchTerm.value.toLowerCase();
  return sortedPatterns.value.filter(
    (p) =>
      p.pattern_text.toLowerCase().includes(q) ||
      (p.host || "").toLowerCase().includes(q) ||
      (p.program || "").toLowerCase().includes(q)
  );
});

const classificationOrder = ["critical", "high", "medium", "low", "noise", "pending"] as const;
const classificationLabels: Record<string, string> = {
  critical: "Critical", high: "High", medium: "Medium",
  low: "Low", noise: "Noise", pending: "Pending",
};

const collapsedGroups = ref<Record<string, boolean>>({
  critical: false, high: false, medium: false,
  low: true, noise: true, pending: true,
});

const toggleGroup = (cls: string) => {
  collapsedGroups.value[cls] = !collapsedGroups.value[cls];
};

const groupedPatterns = computed(() => {
  const groups: { classification: string; label: string; patterns: PatternItem[] }[] = [];
  const map = new Map<string, PatternItem[]>();
  for (const p of filteredPatterns.value) {
    const cls = p.effective_classification || p.classification || "pending";
    if (!map.has(cls)) map.set(cls, []);
    map.get(cls)!.push(p);
  }
  for (const cls of classificationOrder) {
    const items = map.get(cls);
    if (items && items.length) {
      groups.push({ classification: cls, label: classificationLabels[cls] || cls, patterns: items });
    }
  }
  for (const [cls, items] of map) {
    if (!classificationOrder.includes(cls as any) && items.length) {
      groups.push({ classification: cls, label: cls, patterns: items });
    }
  }
  return groups;
});

const classColor = (p: PatternItem): string => {
  const cls = p.effective_classification || p.classification || "pending";
  if (cls === "critical") return "#F5A623";
  if (cls === "high") return "#1565C0";
  if (cls === "medium") return "#2EC4A0";
  if (cls === "low") return "#64B5F6";
  if (cls === "noise") return "#5a7d7a";
  return "#2196F3";
};

const classIconName = (p: PatternItem): string => {
  const cls = p.effective_classification || p.classification || "pending";
  if (cls === "critical") return "mdi-alert-octagon";
  if (cls === "high") return "mdi-alert-circle";
  if (cls === "medium") return "mdi-alert";
  if (cls === "low") return "mdi-information";
  if (cls === "noise") return "mdi-volume-off";
  return "mdi-clock-outline";
};

const patternLabel = (p: PatternItem) => {
  if (p.title) return p.title;
  if (p.host && p.program) return `${p.host} / ${p.program}`;
  if (p.host) return p.host;
  if (p.program) return p.program;
  return p.pattern_text.substring(0, 40);
};

const getAlertIntervals = (patternId: number) => {
  const intervals = props.patternStats[String(patternId)] || [];
  return intervals.map((i) => i.count);
};
</script>

<style scoped>
.v-list {
  background-color: transparent;
}

.pattern-list {
  overflow-y: auto;
}

.pattern-list-item {
  margin-bottom: 8px;
  padding: 8px 16px;
  color: #b1b8c0;
  text-transform: uppercase;
  transition: background-color 0.2s ease;
}

.pattern-list-item.selected-pattern {
  background-color: rgba(66, 165, 245, 0.2);
  border-left: 3px solid #42a5f5;
}

.host-info {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 0;
  margin-left: 0;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  min-width: 40px;
}

.search-container {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: #0d1117;
}

.search-field {
  background-color: #161b22;
}

.search-field :deep(.v-field__input) {
  color: #b1b8c0;
}

.search-field :deep(.v-field__outline) {
  opacity: 0.3;
}

.threat-score-text {
  font-size: 14px;
  font-weight: bold;
  width: 30px;
  min-width: 30px;
  text-align: right;
}

/* Group headers */
.group-header {
  min-height: 36px !important;
}

.group-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.group-critical .group-label { color: #F5A623; }
.group-high .group-label { color: #1565C0; }
.group-medium .group-label { color: #2EC4A0; }
.group-low .group-label { color: #64B5F6; }
.group-noise .group-label { color: #5a7d7a; }
.group-pending .group-label { color: #2196F3; }

.chevron-icon {
  transition: transform 0.2s ease;
}

.chevron-collapsed {
  transform: rotate(-90deg);
}

/* Scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  border: none;
}
</style>
