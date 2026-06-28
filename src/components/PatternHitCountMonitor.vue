<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between mb-3 gap-2">
      <div>
        <div class="text-subtitle-1 font-weight-bold">Pattern Hit Count Monitor</div>
        <div class="text-caption text-medium-emphasis">
          Polling every {{ pollSeconds }}s. Refreshing in {{ secondsUntilRefresh }} seconds.
          Showing only patterns whose hit count changed.
        </div>
      </div>
      <div class="d-flex align-center gap-2">
        <v-chip size="small" variant="tonal" color="primary">
          Last poll: {{ lastPollLabel }}
        </v-chip>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-3" closable>
      {{ error }}
    </v-alert>

    <v-table v-if="changedRows.length" density="compact" class="rounded-lg" style="background-color: #0d1117;">
      <thead>
        <tr>
          <th style="width: 90px;">Pattern</th>
          <th style="width: 140px;">Classification</th>
          <th style="width: 120px;">Previous</th>
          <th style="width: 120px;">Current</th>
          <th style="width: 120px;">Delta</th>
          <th style="width: 180px;">Updated</th>
          <th>Pattern Name</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in changedRows" :key="row.id">
          <td>#{{ row.id }}</td>
          <td class="text-uppercase">{{ row.classification }}</td>
          <td>{{ row.previous.toLocaleString() }}</td>
          <td>{{ row.current.toLocaleString() }}</td>
          <td>
            <span :class="row.delta > 0 ? 'text-green-accent-3' : 'text-red-accent-2'">
              {{ row.delta > 0 ? '+' : '' }}{{ row.delta.toLocaleString() }}
            </span>
          </td>
          <td>{{ formatDateTime(row.updatedAt) }}</td>
          <td class="text-truncate sample-cell">{{ row.patternName }}</td>
        </tr>
      </tbody>
    </v-table>

    <div v-else class="text-body-2 text-medium-emphasis pa-4 text-center empty-state rounded-lg">
      Waiting for hit count changes...
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { getPatterns } from "@/services/rules";
import type { PatternItem } from "@/types";

type ChangedRow = {
  id: number;
  classification: string;
  previous: number;
  current: number;
  delta: number;
  updatedAt: string;
  patternName: string;
};

const pollSeconds = 30;
const loading = ref(false);
const error = ref("");
const changedRows = ref<ChangedRow[]>([]);
const lastPollAt = ref<Date | null>(null);
const previousHitCounts = ref<Record<number, number>>({});
const secondsUntilRefresh = ref(pollSeconds);

let pollTimer: ReturnType<typeof setInterval> | null = null;

const lastPollLabel = computed(() => {
  if (!lastPollAt.value) return "never";
  const h = String(lastPollAt.value.getHours()).padStart(2, "0");
  const m = String(lastPollAt.value.getMinutes()).padStart(2, "0");
  const s = String(lastPollAt.value.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
});

const formatDateTime = (ts: string) => {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
};

const buildChangedRows = (patterns: PatternItem[]) => {
  const prev = previousHitCounts.value;
  const next: Record<number, number> = {};
  const rows: ChangedRow[] = [];

  for (const pattern of patterns) {
    const id = pattern.id;
    const current = pattern.hit_count ?? 0;
    next[id] = current;
    const classification = (pattern.effective_classification || pattern.classification || "unclassified").toLowerCase();

    if (Object.prototype.hasOwnProperty.call(prev, id) && prev[id] !== current) {
      rows.push({
        id,
        classification,
        previous: prev[id],
        current,
        delta: current - prev[id],
        updatedAt: new Date().toISOString(),
        patternName: (pattern.title || "").trim() || `Pattern #${id}`,
      });
    }
  }

  rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  changedRows.value = rows;
  previousHitCounts.value = next;
};

const pollOnce = async () => {
  loading.value = true;
  error.value = "";
  try {
    const response = await getPatterns({ limit: 10000, offset: 0 });
    buildChangedRows(response.items || []);
    lastPollAt.value = new Date();
  } catch {
    error.value = "Failed to poll pattern hit counts.";
  } finally {
    loading.value = false;
  }
};

const handleAutoTick = () => {
  if (loading.value) return;

  if (secondsUntilRefresh.value <= 1) {
    secondsUntilRefresh.value = pollSeconds;
    void pollOnce();
    return;
  }

  secondsUntilRefresh.value -= 1;
};

onMounted(async () => {
  await pollOnce();
  secondsUntilRefresh.value = pollSeconds;
  pollTimer = setInterval(handleAutoTick, 1000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.sample-cell {
  max-width: 520px;
}

.empty-state {
  border: 1px dashed rgba(255, 255, 255, 0.2);
}
</style>
