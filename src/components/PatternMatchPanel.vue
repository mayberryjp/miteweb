<template>
  <div>
    <h3>Pattern Match</h3>
    <v-divider class="my-4"></v-divider>

    <p class="text-body-2 text-medium-emphasis mb-4">
      Paste one or more log lines below and Mite will report which pattern ID and name each line matches.
    </p>

    <v-textarea
      v-model="patternMatchInput"
      variant="outlined"
      label="Log content"
      placeholder="Paste log lines here, one per line..."
      rows="10"
      auto-grow
      hide-details
      class="mb-4"
      :disabled="patternMatching"
    ></v-textarea>

    <div class="d-flex align-center" style="gap: 16px;">
      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-magnify"
        :loading="patternMatching"
        :disabled="!patternMatchInput.trim()"
        @click="handlePatternMatch"
      >
        MATCH
      </v-btn>
      <v-btn
        variant="text"
        :disabled="patternMatching || (!patternMatchInput && !patternMatchResults.length)"
        @click="clearPatternMatch"
      >
        Clear
      </v-btn>
    </div>

    <v-alert
      v-if="patternMatchError"
      type="error"
      variant="tonal"
      class="mt-4"
      closable
      @click:close="patternMatchError = ''"
    >
      {{ patternMatchError }}
    </v-alert>

    <v-alert
      v-if="patternMatchNote"
      type="info"
      variant="tonal"
      class="mt-4"
      closable
      @click:close="patternMatchNote = ''"
    >
      {{ patternMatchNote }}
    </v-alert>

    <v-table
      v-if="patternMatchResults.length"
      class="mt-4"
      density="compact"
    >
      <thead>
        <tr>
          <th class="text-left">Log Line</th>
          <th class="text-left" style="width: 120px;">Pattern #</th>
          <th class="text-left" style="width: 200px;">Pattern Name</th>
          <th class="text-left" style="width: 140px;">Classification</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(result, index) in patternMatchResults" :key="index">
          <td class="text-body-2" style="word-break: break-all;">{{ result.line }}</td>
          <td class="text-body-2">
            <span v-if="result.matched">{{ result.pattern_id ?? '—' }}</span>
            <span v-else class="text-medium-emphasis">No match</span>
          </td>
          <td class="text-body-2">{{ result.matched ? (result.name || '—') : '—' }}</td>
          <td class="text-body-2 text-uppercase">{{ result.matched ? (result.effective_classification || '—') : '—' }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { matchLogAgainstPatterns } from "@/services/rules";
import type { PatternMatchResult } from "@/types";

const PATTERN_MATCH_MAX_LINES = 200;
const patternMatchInput = ref("");
const patternMatching = ref(false);
const patternMatchResults = ref<PatternMatchResult[]>([]);
const patternMatchError = ref("");
const patternMatchNote = ref("");

const handlePatternMatch = async () => {
  let lines = patternMatchInput.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return;
  patternMatching.value = true;
  patternMatchError.value = "";
  patternMatchNote.value = "";
  patternMatchResults.value = [];
  if (lines.length > PATTERN_MATCH_MAX_LINES) {
    patternMatchNote.value = `Only the first ${PATTERN_MATCH_MAX_LINES} lines were matched.`;
    lines = lines.slice(0, PATTERN_MATCH_MAX_LINES);
  }
  try {
    const responses = await Promise.all(lines.map((line) => matchLogAgainstPatterns(line)));
    patternMatchResults.value = responses.map((res, i) => ({ ...res, line: lines[i] }));
  } catch {
    patternMatchError.value = "Failed to match log content. Please try again.";
  } finally {
    patternMatching.value = false;
  }
};

const clearPatternMatch = () => {
  patternMatchInput.value = "";
  patternMatchResults.value = [];
  patternMatchError.value = "";
  patternMatchNote.value = "";
};
</script>
