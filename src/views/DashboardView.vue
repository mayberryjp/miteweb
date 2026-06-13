<template>
  <div class="dashboard">
    <ApiErrorBanner v-if="error" :message="error" />

    <div class="dash-grid">
      <!-- ── LEFT: Patterns ── -->
      <div class="dash-left">
        <div class="risk-header">
          <h2 class="risk-title">
            PATTERNS:
            <span class="risk-value" :class="riskClass">{{ riskLabel }} ({{ alertPatternCount }})</span>
          </h2>
        </div>

        <div class="search-row">
          <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
          </svg>
          <input v-model="patternSearch" type="text" class="search-input" placeholder="Search patterns..." />
        </div>

        <div class="pattern-list">
          <div
            v-for="p in filteredPatterns"
            :key="p.id"
            class="pattern-row"
            :class="{ selected: selectedId === p.id }"
            @click="selectPattern(p)"
          >
            <div class="pattern-main">
              <div class="pattern-icon" :class="'icon-' + (p.effective_classification || p.classification || 'pending')">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path v-if="classIcon(p) === 'critical'" d="M10 2L2 18h16L10 2zm0 4l5.5 10h-11L10 6z"/>
                  <path v-else-if="classIcon(p) === 'high'" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
                  <path v-else-if="classIcon(p) === 'noise'" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11H9v2h2V7zm0 4H9v2h2v-2z"/>
                  <path v-else d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 13H9v-2h2v2zm0-4H9V5h2v6z"/>
                </svg>
              </div>
              <span class="pattern-name">{{ patternLabel(p) }}</span>
              <div class="activity-bars">
                <span v-for="n in 12" :key="n" class="bar" :class="barClass(p, n)"></span>
              </div>
              <span class="hit-count" :class="p.hit_count > 0 ? 'count-active' : 'count-zero'">{{ p.hit_count }}</span>
            </div>
          </div>

          <div v-if="!filteredPatterns.length && !loading" class="empty-msg">No patterns discovered yet.</div>
        </div>
      </div>

      <!-- ── RIGHT: KPIs + Detail + Alerts ── -->
      <div class="dash-right">
        <!-- Pattern Detail (when selected) -->
        <div v-if="selectedPattern" class="pattern-detail-panel">
          <button class="back-btn" @click="selectedId = null">← Back to overview</button>
          <h2 class="detail-title">{{ patternLabel(selectedPattern) }}</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Classification</span>
              <SeverityBadge :severity="selectedPattern.effective_classification || selectedPattern.classification" />
              <span v-if="selectedPattern.user_override" class="override-tag">override</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Host</span>
              <span class="detail-value mono">{{ selectedPattern.host || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Program</span>
              <span class="detail-value mono">{{ selectedPattern.program || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Hit Count</span>
              <span class="detail-value mono">{{ selectedPattern.hit_count }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">First Seen</span>
              <span class="detail-value mono">{{ formatTime(selectedPattern.first_seen_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Last Seen</span>
              <span class="detail-value mono">{{ formatTime(selectedPattern.last_seen_at) }}</span>
            </div>
          </div>
          <div v-if="selectedPattern.ai_explanation" class="detail-section">
            <span class="detail-label">AI Explanation</span>
            <p class="detail-text">{{ selectedPattern.ai_explanation }}</p>
          </div>
          <div class="detail-section">
            <span class="detail-label">Pattern</span>
            <code class="detail-code">{{ selectedPattern.pattern_text }}</code>
          </div>
          <div v-if="selectedPattern.match_regex" class="detail-section">
            <span class="detail-label">Match Regex</span>
            <div class="regex-wrapper">
              <textarea
                v-model="regexValue"
                class="regex-input"
                rows="6"
                spellcheck="false"
              ></textarea>
              <div class="regex-actions">
                <button class="btn btn-sm" @click="copyRegex">{{ copyLabel }}</button>
                <button class="btn btn-primary btn-sm" @click="saveRegex(selectedPattern.id)" :disabled="savingRegex || regexValue === selectedPattern.match_regex">{{ savingRegex ? 'Saving...' : 'Save Regex' }}</button>
              </div>
            </div>
          </div>
          <div class="detail-section">
            <span class="detail-label">Sample Message</span>
            <code class="detail-code">{{ selectedPattern.sample_message }}</code>
          </div>
          <div class="detail-section">
            <span class="detail-label">Source IPs</span>
            <div v-if="patternSourceIps.length" class="source-ip-list">
              <span v-for="ip in patternSourceIps" :key="ip" class="source-ip-tag mono">{{ ip }}</span>
            </div>
            <span v-else class="detail-value">{{ loadingIps ? 'Loading...' : 'No source IPs found' }}</span>
          </div>
          <div class="detail-section">
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
              <button class="btn btn-primary btn-sm" @click="saveOverride(selectedPattern.id)" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
            </div>
          </div>
        </div>

        <!-- KPI Banner (default view) -->
        <div v-if="!selectedPattern" class="kpi-banner">
          <div class="kpi-cell">
            <div class="kpi-title">Logs</div>
            <div class="kpi-subtitle">Last Hour</div>
            <div class="kpi-value accent-blue">{{ stats?.logs_last_hour ?? '—' }}</div>
          </div>
          <div class="kpi-cell">
            <div class="kpi-title">Patterns</div>
            <div class="kpi-subtitle">Total</div>
            <div class="kpi-value accent-green">{{ stats?.total_patterns ?? '—' }}</div>
          </div>
          <div class="kpi-cell">
            <div class="kpi-title">Patterns</div>
            <div class="kpi-subtitle">Pending</div>
            <div class="kpi-value" :class="(stats?.pending_patterns ?? 0) > 0 ? 'accent-yellow' : ''">{{ stats?.pending_patterns ?? '—' }}</div>
          </div>
          <div class="kpi-cell">
            <div class="kpi-title">Alerts</div>
            <div class="kpi-subtitle">Unacknowledged</div>
            <div class="kpi-value" :class="(stats?.alerts_last_24h ?? 0) > 0 ? 'accent-red' : 'accent-green'">{{ stats?.alerts_last_24h ?? '—' }}</div>
          </div>
        </div>

        <!-- Sub stats -->
        <div v-if="!selectedPattern" class="sub-stats">
          <div class="sub-stat">
            <span class="sub-dot" :class="health?.status === 'ok' ? 'dot-green' : 'dot-red'"></span>
            Backend {{ health?.status === 'ok' ? 'Online' : 'Offline' }}
          </div>
          <div class="sub-stat">
            <span class="sub-label">Logs (24h):</span>
            <span class="mono">{{ stats?.logs_last_24h ?? '—' }}</span>
          </div>
          <div v-if="stats?.database_size_bytes" class="sub-stat">
            <span class="sub-label">DB:</span>
            <span class="mono">{{ formatBytes(stats.database_size_bytes) }}</span>
          </div>
        </div>

        <!-- Recent Alerts (high/critical) -->
        <div v-if="!selectedPattern" class="alerts-section">
          <h2 class="section-title">Recent Alerts</h2>
          <div class="table-wrapper">
            <table v-if="alerts.length" class="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Severity</th>
                  <th>Source</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in alerts" :key="a.id">
                  <td class="mono nowrap">{{ formatTime(a.created_at) }}</td>
                  <td><SeverityBadge :severity="a.severity" /></td>
                  <td class="mono">{{ a.source_ip || a.host || '—' }}</td>
                  <td class="truncate">{{ a.message }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-msg">No recent high/critical alerts.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { getHealth, getStats } from "@/services/system";
import { getAlerts } from "@/services/alerts";
import { getPatterns, updatePattern } from "@/services/rules";
import type { HealthStatus, StatsData, AlertItem, PatternItem } from "@/types";
import SeverityBadge from "@/components/SeverityBadge.vue";
import ApiErrorBanner from "@/components/ApiErrorBanner.vue";

const health = ref<HealthStatus | null>(null);
const stats = ref<StatsData | null>(null);
const alerts = ref<AlertItem[]>([]);
const patterns = ref<PatternItem[]>([]);
const totalPatterns = ref(0);
const error = ref("");
const loading = ref(true);
const patternSearch = ref("");
const selectedId = ref<number | null>(null);
const overrideValue = ref("");
const regexValue = ref("");
const saving = ref(false);
const savingRegex = ref(false);
const copyLabel = ref("Copy");
const patternSourceIps = ref<string[]>([]);
const loadingIps = ref(false);

const selectedPattern = computed(() =>
  selectedId.value ? patterns.value.find((p) => p.id === selectedId.value) ?? null : null
);

const severityOrder: Record<string, number> = {
  critical: 0, crit: 0, emerg: 0, alert: 1,
  high: 2, medium: 3, low: 4, noise: 5, pending: 6,
};

const sortedPatterns = computed(() =>
  [...patterns.value].sort((a, b) => {
    const ca = severityOrder[a.effective_classification || a.classification] ?? 6;
    const cb = severityOrder[b.effective_classification || b.classification] ?? 6;
    if (ca !== cb) return ca - cb;
    return b.hit_count - a.hit_count;
  })
);

const filteredPatterns = computed(() => {
  if (!patternSearch.value) return sortedPatterns.value;
  const q = patternSearch.value.toLowerCase();
  return sortedPatterns.value.filter(
    (p) =>
      p.pattern_text.toLowerCase().includes(q) ||
      (p.host || "").toLowerCase().includes(q) ||
      (p.program || "").toLowerCase().includes(q)
  );
});

const alertPatternCount = computed(() =>
  patterns.value.filter((p) => {
    const c = p.effective_classification || p.classification;
    return c === "critical" || c === "high";
  }).length
);

const riskClass = computed(() => {
  if (alertPatternCount.value === 0) return "risk-safe";
  if (alertPatternCount.value <= 3) return "risk-warning";
  return "risk-danger";
});

const riskLabel = computed(() => {
  if (alertPatternCount.value === 0) return "SAFE";
  if (alertPatternCount.value <= 3) return "CAUTION";
  return "AT RISK";
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

const selectPattern = (p: PatternItem) => {
  if (selectedId.value === p.id) {
    selectedId.value = null;
    return;
  }
  selectedId.value = p.id;
  overrideValue.value = p.user_override || "";
  regexValue.value = p.match_regex || "";
  copyLabel.value = "Copy";
  fetchPatternIps(p.id);
};

const fetchPatternIps = async (patternId: number) => {
  loadingIps.value = true;
  patternSourceIps.value = [];
  try {
    const data = await getAlerts({ limit: 100, pattern_id: patternId });
    const items: AlertItem[] = data?.items ?? [];
    const ips = new Set<string>();
    for (const a of items) {
      if (a.source_ip) ips.add(a.source_ip);
    }
    patternSourceIps.value = [...ips].sort();
  } catch {
    patternSourceIps.value = [];
  } finally {
    loadingIps.value = false;
  }
};

const copyRegex = async () => {
  try {
    await navigator.clipboard.writeText(regexValue.value);
    copyLabel.value = "Copied!";
    setTimeout(() => { copyLabel.value = "Copy"; }, 1500);
  } catch {
    copyLabel.value = "Failed";
  }
};

const saveRegex = async (id: number) => {
  savingRegex.value = true;
  try {
    await updatePattern(id, { match_regex: regexValue.value });
    await fetchData();
  } catch {
    error.value = "Failed to update regex.";
  } finally {
    savingRegex.value = false;
  }
};

const saveOverride = async (id: number) => {
  saving.value = true;
  try {
    await updatePattern(id, { classification: overrideValue.value || undefined });
    await fetchData();
  } catch {
    error.value = "Failed to update pattern.";
  } finally {
    saving.value = false;
  }
};

const formatTime = (ts: string) => {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fetchData = async () => {
  try {
    const [h, s, a, p] = await Promise.allSettled([
      getHealth(),
      getStats(),
      getAlerts({ limit: 15 }),
      getPatterns({ limit: 200 }),
    ]);
    if (h.status === "fulfilled") health.value = h.value;
    if (s.status === "fulfilled") stats.value = s.value;
    if (a.status === "fulfilled") {
      const all: AlertItem[] = a.value?.items ?? (Array.isArray(a.value) ? a.value : []);
      alerts.value = all.filter((x) => x.severity === "critical" || x.severity === "high" || x.severity === "crit" || x.severity === "alert" || x.severity === "emerg").slice(0, 10);
      if (!alerts.value.length) alerts.value = all.slice(0, 10);
    }
    if (p.status === "fulfilled") {
      patterns.value = p.value?.items ?? [];
      totalPatterns.value = p.value?.total ?? 0;
    }

    error.value = [h, s].some((r) => r.status === "rejected")
      ? "Backend unavailable. Check the Mite backend container."
      : "";
  } catch {
    error.value = "Backend unavailable. Check the Mite backend container.";
  } finally {
    loading.value = false;
  }
};

const refreshKpis = async () => {
  try {
    const [h, s, a] = await Promise.allSettled([
      getHealth(),
      getStats(),
      getAlerts({ limit: 15 }),
    ]);
    if (h.status === "fulfilled") health.value = h.value;
    if (s.status === "fulfilled") stats.value = s.value;
    if (a.status === "fulfilled") {
      const all: AlertItem[] = a.value?.items ?? (Array.isArray(a.value) ? a.value : []);
      alerts.value = all.filter((x) => x.severity === "critical" || x.severity === "high" || x.severity === "crit" || x.severity === "alert" || x.severity === "emerg").slice(0, 10);
      if (!alerts.value.length) alerts.value = all.slice(0, 10);
    }
  } catch {
    // silent — don't flash errors on periodic refresh
  }
};

let timer: ReturnType<typeof setInterval>;

onMounted(() => {
  fetchData();
  timer = setInterval(refreshKpis, 15000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped>
/* ── Layout ── */
.dash-grid {
  display: grid;
  grid-template-columns: 30% 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 960px) {
  .dash-grid {
    grid-template-columns: 1fr;
  }
}

/* ── LEFT: Patterns ── */
.dash-left {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: calc(100vh - 80px);
  background: var(--bg-primary);
  border-right: 1px solid var(--border);
  padding: 0 4px 0 0;
}

.risk-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 22px 16px;
  text-align: center;
  flex-shrink: 0;
}

.risk-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--text-secondary);
  margin: 0;
}

.risk-value { font-weight: 700; }
.risk-safe { color: var(--success); }
.risk-warning { color: var(--warning); }
.risk-danger { color: var(--danger); }

.search-row {
  position: relative;
  padding: 12px 12px 8px;
  flex-shrink: 0;
}

.search-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 9px 10px 9px 34px;
  font-size: 13px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.search-input::placeholder { color: var(--text-muted); }
.search-input:focus { border-color: var(--accent); }

.pattern-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.pattern-row {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  border-radius: 0;
  cursor: pointer;
  transition: background 0.12s;
}

.pattern-row:last-child {
  border-bottom: none;
}

.pattern-row:hover {
  background: var(--bg-hover);
}

.pattern-row.selected {
  background: var(--bg-hover);
}

.pattern-main {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 8px;
}

.pattern-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-critical { background: rgba(239, 68, 68, 0.15); color: var(--danger); }
.icon-high { background: rgba(249, 115, 22, 0.15); color: #f97316; }
.icon-medium { background: rgba(234, 179, 8, 0.15); color: var(--warning); }
.icon-low { background: rgba(34, 197, 94, 0.12); color: var(--success); }
.icon-noise { background: rgba(122, 138, 158, 0.12); color: var(--text-muted); }
.icon-pending { background: rgba(59, 130, 246, 0.12); color: var(--accent); }

.pattern-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 60px;
}

.activity-bars {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  flex-shrink: 0;
}

.bar {
  width: 5px;
  height: 22px;
  border-radius: 1px;
}

.bar-dim { background: rgba(34, 197, 94, 0.12); }
.bar-lit.bar-normal { background: var(--success); box-shadow: 0 0 6px var(--success-glow); }
.bar-lit.bar-medium { background: var(--warning); box-shadow: 0 0 6px rgba(234, 179, 8, 0.3); }
.bar-lit.bar-high { background: #f97316; box-shadow: 0 0 6px rgba(249, 115, 22, 0.3); }
.bar-lit.bar-critical { background: var(--danger); box-shadow: 0 0 6px var(--danger-glow); }

.hit-count {
  font-size: 15px;
  font-weight: 700;
  min-width: 28px;
  text-align: right;
  flex-shrink: 0;
}

.count-active { color: var(--accent); }
.count-zero { color: var(--success); }

/* ── Pattern Detail Panel ── */
.pattern-detail-panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 12px;
  font-family: var(--font-sans);
  cursor: pointer;
  padding: 0;
  align-self: flex-start;
}

.back-btn:hover {
  text-decoration: underline;
}

.detail-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  margin: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
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

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-text {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.detail-code {
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
  max-width: 200px;
}

.regex-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.regex-input {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 12px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.5;
  word-break: break-all;
}

.regex-input:focus {
  border-color: var(--accent);
}

.regex-actions {
  display: flex;
  gap: 8px;
}

.source-ip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.source-ip-tag {
  display: inline-block;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 3px 10px;
  font-size: 12px;
  color: var(--text-primary);
}

.btn-sm {
  padding: 5px 14px;
  font-size: 12px;
}

.list-footer {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.footer-link {
  color: var(--accent);
  text-decoration: none;
}

.footer-link:hover {
  text-decoration: underline;
}

/* ── RIGHT: KPIs + Alerts ── */
.dash-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.kpi-banner {
  display: flex;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.kpi-cell {
  flex: 1;
  text-align: center;
  padding: 18px 12px;
  border-right: 1px solid var(--border);
}

.kpi-cell:last-child {
  border-right: none;
}

.kpi-title {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.kpi-subtitle {
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-primary);
  letter-spacing: -1px;
  line-height: 1;
}

.accent-blue { color: var(--accent); }
.accent-green { color: var(--success); }
.accent-yellow { color: var(--warning); }
.accent-red { color: var(--danger); }

/* Sub stats */
.sub-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 0 2px;
}

.sub-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.sub-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-green { background: var(--success); box-shadow: 0 0 6px rgba(34, 197, 94, 0.4); }
.dot-red { background: var(--danger); box-shadow: 0 0 6px rgba(239, 68, 68, 0.4); }
.dot-purple { background: #a78bfa; box-shadow: 0 0 6px rgba(167, 139, 250, 0.4); }
.dot-muted { background: var(--text-muted); }

.sub-label {
  color: var(--text-muted);
  font-weight: 500;
}

/* Alerts section */
.alerts-section {
  flex: 1;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 10px;
  color: var(--text-primary);
}

.nowrap { white-space: nowrap; }

.alerts-section .data-table {
  table-layout: fixed;
  width: 100%;
}

.alerts-section .data-table th:nth-child(1) { width: 160px; }
.alerts-section .data-table th:nth-child(2) { width: 100px; }
.alerts-section .data-table th:nth-child(3) { width: 120px; }

.truncate {
  max-width: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-ip {
  font-size: 10px;
  color: var(--text-muted);
}

.empty-msg {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
