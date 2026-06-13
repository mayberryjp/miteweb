<template>
  <div class="ai-page">
    <div class="page-header">
      <h1 class="page-title">AI Discovery</h1>
      <button class="btn btn-primary" :disabled="classifying" @click="handleClassify">
        {{ classifying ? 'Classifying...' : 'Run Classification' }}
      </button>
    </div>

    <ApiErrorBanner v-if="error" :message="error" />

    <div v-if="classifyResult" class="classify-result" :class="classifyResult.status === 'ok' ? 'result-success' : 'result-error'">
      {{ classifyResult.message || 'Classification complete.' }}
    </div>

    <h2 class="section-title">Pending Patterns ({{ pending.length }})</h2>
    <p class="hint">These patterns have not yet been classified by AI. Click "Run Classification" to process them.</p>

    <div class="table-wrapper">
      <table v-if="pending.length" class="data-table">
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Sample Message</th>
            <th>Host</th>
            <th>Program</th>
            <th>Hits</th>
            <th>First Seen</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in pending" :key="p.id">
            <td class="mono truncate">{{ p.pattern_text }}</td>
            <td class="mono truncate">{{ p.sample_message }}</td>
            <td class="mono">{{ p.host || '—' }}</td>
            <td class="mono">{{ p.program || '—' }}</td>
            <td class="mono">{{ p.hit_count }}</td>
            <td class="mono nowrap">{{ formatTime(p.first_seen_at) }}</td>
            <td class="mono nowrap">{{ formatTime(p.last_seen_at) }}</td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-else message="No pending patterns. All patterns have been classified." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getPendingPatterns, triggerClassification } from "@/services/ai";
import type { PendingPattern } from "@/types";
import ApiErrorBanner from "@/components/ApiErrorBanner.vue";
import EmptyState from "@/components/EmptyState.vue";

const pending = ref<PendingPattern[]>([]);
const error = ref("");
const classifying = ref(false);
const classifyResult = ref<{ status: string; message?: string } | null>(null);

const formatTime = (ts: string) => {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
};

const fetchPending = async () => {
  try {
    pending.value = await getPendingPatterns({ limit: 50 });
    error.value = "";
  } catch {
    error.value = "Failed to load pending patterns.";
  }
};

const handleClassify = async () => {
  classifying.value = true;
  classifyResult.value = null;
  try {
    const result = await triggerClassification();
    classifyResult.value = result;
    await fetchPending();
  } catch (e: any) {
    classifyResult.value = {
      status: "error",
      message: e?.response?.data?.error || "Classification failed.",
    };
  } finally {
    classifying.value = false;
  }
};

onMounted(fetchPending);
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.hint {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0 0 16px;
}

.classify-result {
  padding: 10px 16px;
  border-radius: var(--radius);
  font-size: 13px;
  margin-bottom: 16px;
}

.result-success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid var(--success);
  color: var(--success);
}

.result-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--danger);
  color: var(--danger);
}

.truncate {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nowrap {
  white-space: nowrap;
}
</style>
