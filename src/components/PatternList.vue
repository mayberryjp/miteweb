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
      <div class="d-flex align-center mt-2">
        <v-checkbox
          v-model="showInactive"
          density="compact"
          hide-details
          color="primary"
          label="Show inactive"
        ></v-checkbox>
        <v-btn
          variant="text"
          size="small"
          prepend-icon="mdi-unfold-more-horizontal"
          class="group-toggle-btn ml-2"
          @click="expandAllGroups"
        >
          Expand
        </v-btn>
        <v-btn
          variant="text"
          size="small"
          prepend-icon="mdi-unfold-less-horizontal"
          class="group-toggle-btn"
          @click="collapseAllGroups"
        >
          Collapse
        </v-btn>
      </div>
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
              :class="{ 'chevron-collapsed': collapsedGroups[group.classification] !== false }"
              class="chevron-icon mr-2"
            >mdi-chevron-down</v-icon>
            <span class="group-label">{{ group.label }}</span>
            <v-chip size="x-small" variant="tonal" class="ml-2">{{ group.patterns.length }}</v-chip>
          </div>
        </v-list-item>

        <!-- Pattern items -->
        <template v-if="collapsedGroups[group.classification] === false">
          <v-list-item
            v-for="p in group.patterns"
            :key="p.id"
            class="pattern-list-item"
            :class="{ 'selected-pattern': selectedId === p.id }"
            @click="$emit('select', p)"
          >
            <div class="d-flex align-center w-100">
              <div class="icon-container">
                <span v-if="isNewPattern(p)" class="new-pattern-badge">NEW</span>
                <v-icon :color="classColor(p)" size="24">{{ classIconName(p) }}</v-icon>
              </div>
              <div class="host-info">{{ patternLabel(p) }}</div>
              <AlertBarChart :alertIntervals="getAlertIntervals(p.id)" class="ml-auto mr-2" />
              <div class="threat-score-text" :style="{ color: classColor(p) }" :title="getTotalHitCount(p).toLocaleString()">{{ formatCount(getTotalHitCount(p)) }}</div>
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
import { ref, computed, onMounted } from "vue";
import type { PatternItem } from "@/types";
import AlertBarChart from "@/components/AlertBarChart.vue";
import {
  CLASSIFICATION_LABELS,
  CLASSIFICATION_ORDER,
  getClassificationColor,
  getClassificationIcon,
  getPatternClassification,
} from "@/utils/classification";

const PATTERN_LAST_VISIT_STORAGE_KEY = "miteweb:patterns-last-visit-at";

const props = defineProps<{
  patterns: PatternItem[];
  patternStats: Record<string, { hour: string; count: number }[]>;
  selectedId: number | null;
}>();

defineEmits<{
  select: [pattern: PatternItem];
}>();

const searchTerm = ref("");
const previousVisitAt = ref<number | null>(null);

const severityOrder: Record<string, number> = {
  critical: 0, crit: 0, emerg: 0, alert: 1,
  high: 2, medium: 3, low: 4, noise: 5, pending: 6,
};

const sortedPatterns = computed(() =>
  [...props.patterns].sort((a, b) => {
    const ca = severityOrder[a.effective_classification || a.classification] ?? 6;
    const cb = severityOrder[b.effective_classification || b.classification] ?? 6;
    if (ca !== cb) return ca - cb;
    return get12hCount(b.id) - get12hCount(a.id);
  })
);

const showInactive = ref(false);

const filteredPatterns = computed(() => {
  let base = sortedPatterns.value;
  if (!showInactive.value && !searchTerm.value) {
    base = base.filter((p) => get12hCount(p.id) > 0);
  }
  if (!searchTerm.value) return base;
  const q = searchTerm.value.toLowerCase();
  return base.filter(
    (p) =>
      String(p.id).includes(q) ||
      (p.title || "").toLowerCase().includes(q) ||
      p.pattern_text.toLowerCase().includes(q) ||
      (p.host || "").toLowerCase().includes(q) ||
      (p.program || "").toLowerCase().includes(q)
  );
});

const collapsedGroups = ref<Record<string, boolean>>({
  critical: false, high: false, medium: false,
  low: true, noise: true, pending: true,
});

const toggleGroup = (cls: string) => {
  collapsedGroups.value[cls] = collapsedGroups.value[cls] === false;
};

const expandAllGroups = () => {
  for (const group of groupedPatterns.value) {
    collapsedGroups.value[group.classification] = false;
  }
};

const collapseAllGroups = () => {
  for (const group of groupedPatterns.value) {
    collapsedGroups.value[group.classification] = true;
  }
};

const groupedPatterns = computed(() => {
  const groups: { classification: string; label: string; patterns: PatternItem[] }[] = [];
  const map = new Map<string, PatternItem[]>();
  for (const p of filteredPatterns.value) {
    const cls = getPatternClassification(p);
    if (!map.has(cls)) map.set(cls, []);
    map.get(cls)!.push(p);
  }
  for (const cls of CLASSIFICATION_ORDER) {
    const items = map.get(cls);
    if (items && items.length) {
      groups.push({ classification: cls, label: CLASSIFICATION_LABELS[cls] || cls, patterns: items });
    }
  }
  for (const [cls, items] of map) {
    if (!CLASSIFICATION_ORDER.includes(cls as any) && items.length) {
      groups.push({ classification: cls, label: cls, patterns: items });
    }
  }
  return groups;
});

const classColor = (p: PatternItem): string => {
  return getClassificationColor(p);
};

const classIconName = (p: PatternItem): string => {
  return getClassificationIcon(p);
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

const get12hCount = (patternId: number) => {
  const intervals = props.patternStats[String(patternId)] || [];
  return intervals.reduce((sum, i) => sum + i.count, 0);
};

const getTotalHitCount = (pattern: PatternItem) => {
  return pattern.hit_count ?? 0;
};

const formatCount = (n: number): string => {
  return n.toLocaleString();
};

const isNewPattern = (p: PatternItem): boolean => {
  if (!p.first_seen_at) return false;
  if (previousVisitAt.value == null) return false;
  const firstSeenTs = Date.parse(p.first_seen_at);
  if (Number.isNaN(firstSeenTs)) return false;
  return firstSeenTs > previousVisitAt.value;
};

onMounted(() => {
  try {
    const storedValue = window.localStorage.getItem(PATTERN_LAST_VISIT_STORAGE_KEY);
    if (storedValue) {
      const parsedValue = Number.parseInt(storedValue, 10);
      previousVisitAt.value = Number.isNaN(parsedValue) ? null : parsedValue;
    }
    window.localStorage.setItem(PATTERN_LAST_VISIT_STORAGE_KEY, String(Date.now()));
  } catch {
    previousVisitAt.value = null;
  }
});
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
  overflow: visible;
}

.pattern-list-item :deep(.v-list-item__content) {
  overflow: visible;
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
  position: relative;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  min-width: 40px;
}

.new-pattern-badge {
  position: absolute;
  top: -6px;
  left: -8px;
  z-index: 2;
  font-size: 9px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.4px;
  padding: 2px 5px;
  border-radius: 999px;
  color: #0d1117;
  background: #f6c945;
  border: 1px solid rgba(13, 17, 23, 0.55);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
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

.group-toggle-btn {
  text-transform: none;
  letter-spacing: 0.15px;
  font-size: 1rem;
  font-weight: 400;
  color: #fff;
  opacity: 1;
  min-width: 0;
  padding: 0 6px;
}

.group-toggle-btn:hover {
  opacity: 0.8;
}

.threat-score-text {
  font-size: 13px;
  font-weight: bold;
  min-width: 40px;
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
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
