<template>
  <div class="ai-detail-page">
    <div class="page-header">
      <router-link to="/ai" class="back-link">← Back to Analyses</router-link>
      <h1 class="page-title">AI Analysis Detail</h1>
    </div>

    <ApiErrorBanner v-if="error" :message="error" />

    <template v-if="analysis">
      <!-- Metadata -->
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Created</span>
          <span class="meta-value mono">{{ formatTime(analysis.created_at) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Host</span>
          <span class="meta-value mono">{{ analysis.host || '—' }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Source IP</span>
          <span class="meta-value mono">{{ analysis.source_ip || '—' }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Samples</span>
          <span class="meta-value mono">{{ analysis.sample_count }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Status</span>
          <StatusBadge :status="analysis.status" :label="analysis.status" />
        </div>
      </div>

      <!-- Rule load warnings -->
      <div v-if="analysis.rule_load_warnings?.length" class="warning-box">
        <strong>⚠ Rule Load Warnings:</strong>
        <ul>
          <li v-for="(w, i) in analysis.rule_load_warnings" :key="i">{{ w }}</li>
        </ul>
      </div>

      <!-- Markdown content -->
      <div class="markdown-wrapper">
        <div class="markdown-body" v-html="renderedMarkdown"></div>
      </div>

      <!-- Copy YAML button if detected -->
      <div v-if="yamlBlocks.length" class="yaml-section">
        <h3 class="section-title">Extracted YAML Rules</h3>
        <div v-for="(block, i) in yamlBlocks" :key="i" class="yaml-block">
          <div class="yaml-header">
            <span>Rule Block {{ i + 1 }}</span>
            <button class="btn btn-sm" @click="copyYaml(block)">
              {{ copiedIndex === i ? 'Copied!' : 'Copy YAML' }}
            </button>
          </div>
          <pre class="yaml-content"><code>{{ block }}</code></pre>
        </div>
      </div>
    </template>

    <EmptyState v-else-if="!error" message="Loading analysis..." icon="⏳" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { marked } from "marked";
import { getAnalysis } from "@/services/ai";
import type { AIAnalysisItem } from "@/types";
import StatusBadge from "@/components/StatusBadge.vue";
import ApiErrorBanner from "@/components/ApiErrorBanner.vue";
import EmptyState from "@/components/EmptyState.vue";

const route = useRoute();
const analysis = ref<AIAnalysisItem | null>(null);
const error = ref("");
const copiedIndex = ref<number | null>(null);

const formatTime = (ts: string) => {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
};

const renderedMarkdown = computed(() => {
  if (!analysis.value?.markdown_content) return "";
  return marked(analysis.value.markdown_content);
});

const yamlBlocks = computed(() => {
  if (!analysis.value?.markdown_content) return [];
  const regex = /```ya?ml\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(analysis.value.markdown_content)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
});

const copyYaml = async (block: string) => {
  try {
    await navigator.clipboard.writeText(block);
    const idx = yamlBlocks.value.indexOf(block);
    copiedIndex.value = idx;
    setTimeout(() => {
      copiedIndex.value = null;
    }, 2000);
  } catch {
    // Clipboard API not available
  }
};

onMounted(async () => {
  const id = Number(route.params.id);
  if (isNaN(id)) {
    error.value = "Invalid analysis ID.";
    return;
  }
  try {
    analysis.value = await getAnalysis(id);
    error.value = "";
  } catch {
    error.value = "Failed to load analysis. The analysis may not exist.";
  }
});
</script>

<style scoped>
.page-header {
  margin-bottom: 16px;
}

.back-link {
  color: var(--accent);
  text-decoration: none;
  font-size: 13px;
  display: inline-block;
  margin-bottom: 8px;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  font-size: 14px;
  color: var(--text-primary);
}

.warning-box {
  background: rgba(210, 153, 34, 0.1);
  border: 1px solid var(--warning);
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
  color: var(--warning);
  font-size: 13px;
}

.warning-box ul {
  margin: 8px 0 0;
  padding-left: 20px;
}

.markdown-wrapper {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
}

.markdown-body {
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.7;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
  margin-top: 24px;
}

.markdown-body :deep(code) {
  font-family: var(--font-mono);
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.markdown-body :deep(pre) {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
}

.yaml-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text-primary);
}

.yaml-block {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.yaml-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-secondary);
}

.yaml-content {
  margin: 0;
  padding: 16px;
  background: var(--bg-primary);
  font-family: var(--font-mono);
  font-size: 12px;
  overflow-x: auto;
  color: var(--text-primary);
}

.btn {
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid var(--border);
  font-size: 12px;
  cursor: pointer;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transition: background 0.15s;
}

.btn:hover {
  background: var(--bg-hover);
}

.btn-sm {
  padding: 2px 8px;
  font-size: 11px;
}
</style>
