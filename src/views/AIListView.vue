<template>
  <div class="ai-list-page">
    <div class="page-header">
      <h1 class="page-title">AI Analysis</h1>
      <button class="btn btn-primary" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : 'Run New Analysis' }}
      </button>
    </div>

    <ApiErrorBanner v-if="error" :message="error" />

    <!-- New Analysis Form -->
    <div v-if="showForm" class="analysis-form">
      <h3 class="form-title">Run New Analysis</h3>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Host</label>
          <input v-model="form.host" type="text" class="form-input" placeholder="e.g. router-01" />
        </div>
        <div class="form-group">
          <label class="form-label">Source IP</label>
          <input v-model="form.source_ip" type="text" class="form-input" placeholder="e.g. 192.168.1.1" />
        </div>
        <div class="form-group">
          <label class="form-label">Sample Count</label>
          <input v-model.number="form.sample_count" type="number" class="form-input" placeholder="100" />
        </div>
      </div>
      <button class="btn btn-primary" :disabled="submitting" @click="submitAnalysis">
        {{ submitting ? 'Submitting...' : 'Submit' }}
      </button>
      <div v-if="submitMessage" class="submit-feedback" :class="submitSuccess ? 'feedback-success' : 'feedback-error'">
        {{ submitMessage }}
      </div>
    </div>

    <!-- Analyses Table -->
    <div class="table-wrapper">
      <table v-if="analyses.length" class="data-table">
        <thead>
          <tr>
            <th>Created</th>
            <th>Host</th>
            <th>Source IP</th>
            <th>Samples</th>
            <th>Status</th>
            <th>Summary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in analyses" :key="a.id">
            <td class="mono nowrap">{{ formatTime(a.created_at) }}</td>
            <td class="mono">{{ a.host || '—' }}</td>
            <td class="mono">{{ a.source_ip || '—' }}</td>
            <td class="mono">{{ a.sample_count }}</td>
            <td><StatusBadge :status="a.status" :label="a.status" /></td>
            <td class="truncate">{{ a.summary || '—' }}</td>
            <td>
              <router-link :to="{ name: 'ai-detail', params: { id: a.id } }" class="action-link">
                View
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-else message="No AI analyses yet. Run analysis on a discovered host to generate recommendations." icon="🤖" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { getAnalyses, runAnalysis } from "@/services/ai";
import type { AIAnalysisItem } from "@/types";
import StatusBadge from "@/components/StatusBadge.vue";
import ApiErrorBanner from "@/components/ApiErrorBanner.vue";
import EmptyState from "@/components/EmptyState.vue";

const analyses = ref<AIAnalysisItem[]>([]);
const error = ref("");
const showForm = ref(false);
const submitting = ref(false);
const submitMessage = ref("");
const submitSuccess = ref(false);

const form = reactive({
  host: "",
  source_ip: "",
  sample_count: 100,
});

const formatTime = (ts: string) => {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
};

const submitAnalysis = async () => {
  submitting.value = true;
  submitMessage.value = "";
  try {
    await runAnalysis({
      host: form.host || undefined,
      source_ip: form.source_ip || undefined,
      sample_count: form.sample_count,
    });
    submitMessage.value = "Analysis submitted successfully.";
    submitSuccess.value = true;
    showForm.value = false;
    // Refresh list
    analyses.value = await getAnalyses();
  } catch {
    submitMessage.value = "Failed to submit analysis.";
    submitSuccess.value = false;
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  try {
    analyses.value = await getAnalyses();
    error.value = "";
  } catch {
    error.value = "Backend unavailable. Check the Mite backend container.";
  }
});
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.analysis-form {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.form-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--text-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.form-input:focus {
  border-color: var(--accent);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--border);
  font-size: 13px;
  cursor: pointer;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transition: background 0.15s;
}

.btn:hover {
  background: var(--bg-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: rgba(88, 166, 255, 0.15);
  border-color: var(--accent);
  color: var(--accent);
}

.table-wrapper {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  text-align: left;
  padding: 10px 12px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.data-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: var(--bg-hover);
}

.nowrap {
  white-space: nowrap;
}

.truncate {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-link {
  color: var(--accent);
  text-decoration: none;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.action-link:hover {
  background: var(--bg-hover);
}

.submit-feedback {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.feedback-success {
  background: rgba(63, 185, 80, 0.1);
  border: 1px solid var(--success);
  color: var(--success);
}

.feedback-error {
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid var(--danger);
  color: var(--danger);
}
</style>
