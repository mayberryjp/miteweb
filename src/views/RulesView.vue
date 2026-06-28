<template>
  <div class="patterns-page">

    <!-- Search -->
    <div class="search-row">
      <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
      </svg>
      <input
        v-model="search"
        type="text"
        class="search-input"
        placeholder="Search patterns..."
      />
    </div>

    <!-- Filter tabs -->
    <div class="filter-tabs">
      <button
        v-for="f in filters"
        :key="f.value"
        class="filter-tab"
        :class="{ active: classificationFilter === f.value }"
        @click="classificationFilter = f.value; fetchPatterns()"
      >
        {{ f.label }}
      </button>
    </div>

    <ApiErrorBanner v-if="error" :message="error" />

    <!-- Pattern list -->
    <div class="pattern-list">
      <div v-for="group in groupedPatterns" :key="group.classification" class="classification-group">
        <div class="group-header" :class="'group-' + group.classification" @click="toggleGroup(group.classification)">
          <svg class="chevron" :class="{ collapsed: collapsedGroups[group.classification] }" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
          <span class="group-label">{{ group.label }}</span>
          <span class="group-count">{{ group.patterns.length }}</span>
        </div>
        <div v-show="!collapsedGroups[group.classification]" class="group-body">
      <div
            v-for="p in group.patterns"
        :key="p.id"
        class="pattern-row"
        :class="{ expanded: expandedId === p.id }"
        @click="toggleExpand(p)"
      >
        <div class="pattern-main">
          <div class="pattern-icon" :class="'icon-' + (p.effective_classification || p.classification || 'pending')">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path v-if="classIcon(p) === 'critical'" d="M10 2L2 18h16L10 2zm0 4l5.5 10h-11L10 6z"/>
              <path v-else-if="classIcon(p) === 'high'" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
              <path v-else-if="classIcon(p) === 'medium'" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
              <path v-else-if="classIcon(p) === 'noise'" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11H9v2h2V7zm0 4H9v2h2v-2z"/>
              <path v-else d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 13H9v-2h2v2zm0-4H9V5h2v6z"/>
            </svg>
          </div>
          <span class="pattern-name">{{ patternLabel(p) }}</span>
          <div class="activity-bars">
            <span
              v-for="n in 12"
              :key="n"
              class="bar"
              :class="barClass(p, n)"
            ></span>
          </div>
          <span class="hit-count" :class="p.hit_count > 0 ? 'count-active' : 'count-zero'">
            {{ p.hit_count }}
          </span>
        </div>

        <!-- Expanded detail -->
        <div v-if="expandedId === p.id" class="pattern-detail" @click.stop>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Classification</span>
              <SeverityBadge :severity="p.effective_classification || p.classification" />
              <span v-if="p.user_override" class="override-tag">override</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Host</span>
              <span class="detail-value mono">{{ p.host || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Program</span>
              <span class="detail-value mono">{{ p.program || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Hit Count</span>
              <span class="detail-value mono">{{ p.hit_count }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">First Seen</span>
              <span class="detail-value mono">{{ formatTime(p.first_seen_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Last Seen</span>
              <span class="detail-value mono">{{ formatTime(p.last_seen_at) }}</span>
            </div>
          </div>

          <div v-if="p.ai_explanation" class="detail-explanation">
            <span class="detail-label">AI Explanation</span>
            <p class="explanation-text">{{ p.ai_explanation }}</p>
          </div>

          <div class="detail-sample">
            <span class="detail-label">Sample Message</span>
            <code class="sample-code">{{ p.sample_message }}</code>
          </div>

          <div class="detail-override">
            <span class="detail-label">Override Classification</span>
            <div class="override-controls">
              <select v-model="overrideValue" class="override-select">
                <option value="">None (use AI)</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="noise">Noise</option>
              </select>
              <button class="btn btn-primary btn-sm" @click="saveOverride(p.id)" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
      </div>

      <EmptyState v-if="!filteredPatterns.length && !error" message="No patterns match your search." />
    </div>

    <div class="list-footer mono">
      {{ filteredPatterns.length }} of {{ total }} patterns
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { getPatterns, updatePattern } from "@/services/rules";
import type { PatternItem } from "@/types";
import SeverityBadge from "@/components/SeverityBadge.vue";
import ApiErrorBanner from "@/components/ApiErrorBanner.vue";
import EmptyState from "@/components/EmptyState.vue";
import {
  CLASSIFICATION_LABELS,
  CLASSIFICATION_ORDER,
  getPatternClassification,
} from "@/utils/classification";
import { formatLocaleDateTime } from "@/utils/datetime";

const patterns = ref<PatternItem[]>([]);
const total = ref(0);
const error = ref("");
const search = ref("");
const classificationFilter = ref("");
const expandedId = ref<number | null>(null);
const overrideValue = ref("");
const saving = ref(false);

const collapsedGroups = ref<Record<string, boolean>>({
  critical: false,
  high: false,
  medium: true,
  low: true,
  noise: true,
  pending: true,
});

const toggleGroup = (cls: string) => {
  collapsedGroups.value[cls] = !collapsedGroups.value[cls];
};

const filters = [
  { label: "All", value: "" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
  { label: "Noise", value: "noise" },
  { label: "Pending", value: "pending" },
];

const filteredPatterns = computed(() => {
  if (!search.value) return patterns.value;
  const q = search.value.toLowerCase();
  return patterns.value.filter(
    (p) =>
      p.pattern_text.toLowerCase().includes(q) ||
      p.sample_message.toLowerCase().includes(q) ||
      (p.host || "").toLowerCase().includes(q) ||
      (p.program || "").toLowerCase().includes(q)
  );
});

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
  // Include any classifications not in the predefined order
  for (const [cls, items] of map) {
    if (!CLASSIFICATION_ORDER.includes(cls as any) && items.length) {
      groups.push({ classification: cls, label: cls, patterns: items });
    }
  }
  return groups;
});

const classIcon = (p: PatternItem) => p.effective_classification || p.classification || "pending";

const patternLabel = (p: PatternItem) => {
  if (p.title) return p.title.toUpperCase();
  if (p.host && p.program) return `${p.host} / ${p.program}`.toUpperCase();
  if (p.host) return p.host.toUpperCase();
  if (p.program) return p.program.toUpperCase();
  return p.pattern_text.substring(0, 40).toUpperCase();
};

const maxHits = computed(() => Math.max(1, ...patterns.value.map((p) => p.hit_count)));

const barClass = (p: PatternItem, n: number) => {
  const ratio = p.hit_count / maxHits.value;
  const threshold = n / 12;
  if (ratio >= threshold) {
    const cls = p.effective_classification || p.classification;
    if (cls === "critical") return "bar-lit bar-critical";
    if (cls === "high") return "bar-lit bar-high";
    if (cls === "medium") return "bar-lit bar-medium";
    return "bar-lit bar-normal";
  }
  return "bar-dim";
};

const formatTime = (ts: string) => {
  return formatLocaleDateTime(ts);
};

const toggleExpand = (p: PatternItem) => {
  if (expandedId.value === p.id) {
    expandedId.value = null;
  } else {
    expandedId.value = p.id;
    overrideValue.value = p.user_override || "";
  }
};

const fetchPatterns = async () => {
  try {
    const data = await getPatterns({
      limit: 200,
      classification: classificationFilter.value || undefined,
    });
    patterns.value = data.items;
    total.value = data.total;
    error.value = "";
  } catch {
    error.value = "Failed to load patterns.";
  }
};

const saveOverride = async (id: number) => {
  saving.value = true;
  try {
    await updatePattern(id, { classification: overrideValue.value || undefined });
    await fetchPatterns();
    expandedId.value = null;
  } catch {
    error.value = "Failed to update pattern.";
  } finally {
    saving.value = false;
  }
};

onMounted(fetchPatterns);
</script>

<style scoped>
.patterns-page {
  max-width: 720px;
}

/* Risk Header */
.risk-header {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px 28px;
  margin-bottom: 20px;
  text-align: center;
}

.risk-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--text-secondary);
  margin: 0;
}

.risk-value {
  font-weight: 700;
}

.risk-safe {
  color: var(--success);
}

.risk-warning {
  color: var(--warning);
}

.risk-danger {
  color: var(--danger);
}

/* Search */
.search-row {
  position: relative;
  margin-bottom: 12px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 12px 10px 38px;
  font-size: 14px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  border-color: var(--accent);
}

/* Filter tabs */
.filter-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--font-sans);
}

.filter-tab:hover {
  border-color: var(--border-light);
  color: var(--text-primary);
}

.filter-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

/* Pattern list */
.pattern-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Classification groups */
.classification-group {
  margin-bottom: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  user-select: none;
  transition: background 0.12s;
}

.group-header:hover {
  background: var(--bg-hover);
}

.chevron {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.2s ease;
}

.chevron.collapsed {
  transform: rotate(-90deg);
}

.group-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.group-critical .group-label { color: var(--danger); }
.group-high .group-label { color: #f97316; }
.group-medium .group-label { color: var(--warning); }
.group-low .group-label { color: var(--success); }
.group-noise .group-label { color: var(--text-muted); }
.group-pending .group-label { color: var(--accent); }

.group-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 1px 8px;
}

.group-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
}

.pattern-row {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  overflow: hidden;
}

.pattern-row:hover {
  background: var(--bg-hover);
  border-color: var(--border-light);
}

.pattern-row.expanded {
  border-color: var(--border-light);
}

.pattern-main {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
}

/* Icon */
.pattern-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-critical {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}

.icon-high {
  background: rgba(249, 115, 22, 0.15);
  color: #f97316;
}

.icon-medium {
  background: rgba(234, 179, 8, 0.15);
  color: var(--warning);
}

.icon-low {
  background: rgba(34, 197, 94, 0.12);
  color: var(--success);
}

.icon-noise {
  background: rgba(122, 138, 158, 0.12);
  color: var(--text-muted);
}

.icon-pending {
  background: rgba(59, 130, 246, 0.12);
  color: var(--accent);
}

/* Pattern name */
.pattern-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* Activity bars */
.activity-bars {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  flex-shrink: 0;
}

.bar {
  width: 6px;
  height: 20px;
  border-radius: 1px;
}

.bar-dim {
  background: var(--bg-tertiary);
}

.bar-lit.bar-normal {
  background: var(--success);
  box-shadow: 0 0 4px var(--success-glow);
}

.bar-lit.bar-medium {
  background: var(--warning);
  box-shadow: 0 0 4px rgba(234, 179, 8, 0.3);
}

.bar-lit.bar-high {
  background: #f97316;
  box-shadow: 0 0 4px rgba(249, 115, 22, 0.3);
}

.bar-lit.bar-critical {
  background: var(--danger);
  box-shadow: 0 0 4px var(--danger-glow);
}

/* Hit count */
.hit-count {
  font-size: 15px;
  font-weight: 700;
  min-width: 32px;
  text-align: right;
  flex-shrink: 0;
}

.count-active {
  color: var(--text-primary);
}

.count-zero {
  color: var(--text-muted);
}

/* Expanded detail */
.pattern-detail {
  padding: 0 16px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 14px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  font-weight: 600;
  color: var(--text-muted);
}

.detail-value {
  font-size: 13px;
  color: var(--text-primary);
}

.override-tag {
  display: inline-block;
  font-size: 10px;
  color: var(--warning);
  text-transform: uppercase;
  font-weight: 600;
}

.detail-explanation {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.explanation-text {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.detail-sample {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sample-code {
  display: block;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 12px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.detail-override {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.override-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.override-select {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 6px 10px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--font-sans);
  outline: none;
  flex: 1;
  max-width: 200px;
}

.btn-sm {
  padding: 5px 14px;
  font-size: 12px;
}

/* Footer */
.list-footer {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}
</style>
