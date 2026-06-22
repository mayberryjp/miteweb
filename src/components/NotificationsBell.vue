<template>
  <v-menu location="bottom" :close-on-content-click="false">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="mx-2" @click="refreshActions">
        <v-badge :content="unacknowledgedCount" :value="unacknowledgedCount" color="rose">
          <v-icon icon="mdi-bell" />
        </v-badge>
      </v-btn>
    </template>

    <v-card :width="$vuetify.display.xs ? '300px' : '400px'">
      <v-card-title class="d-flex align-center">
        Notifications
        <v-spacer />
        <v-btn
          variant="text"
          size="small"
          class="mr-2"
          @click="acknowledgeAllAlerts"
          :loading="acknowledgingAll"
          :disabled="!unacknowledgedCount || loading"
        >
          ACKNOWLEDGE ALL
        </v-btn>
        <v-btn icon="mdi-refresh" variant="text" size="small" @click="refreshActions" :loading="loading" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0">
        <v-list v-if="sortedActions.length > 0">
          <v-list-item v-for="action in sortedActions" :key="action.action_id" class="notification-item">
            <template v-slot:prepend>
              <v-icon
                :color="!action.acknowledged ? 'error' : 'success'"
                icon="mdi-check-circle"
                @click.stop="acknowledgeAlert(action)"
                class="cursor-pointer"
              />
            </template>

            <v-list-item-title class="full-text">{{ action.action_text }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{ action.insert_date }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <div v-else class="pa-4 text-center">
          <p>No notifications</p>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { getActions, acknowledgeAction, acknowledgeAllActions } from "@/services/actions";
import type { ActionItem } from "@/types";

const actions = ref<ActionItem[]>([]);
const loading = ref(false);
const acknowledging = ref<number | null>(null);
const acknowledgingAll = ref(false);

const unacknowledgedCount = computed(() => {
  return actions.value.filter((a) => !a.acknowledged).length;
});

const sortedActions = computed(() => {
  return actions.value.filter((a) => !a.acknowledged).sort((a, b) => {
    return new Date(b.insert_date).getTime() - new Date(a.insert_date).getTime();
  });
});

const refreshActions = async () => {
  loading.value = true;
  try {
    const data = await getActions();
    actions.value = data;
  } catch (error) {
    console.error("Failed to fetch actions:", error);
  } finally {
    loading.value = false;
  }
};

const acknowledgeAlert = async (action: ActionItem) => {
  if (action.acknowledged) return;

  acknowledging.value = action.action_id;
  try {
    await acknowledgeAction(action.action_id);
    action.acknowledged = true;
  } catch (error) {
    console.error("Failed to acknowledge action:", error);
  } finally {
    acknowledging.value = null;
  }
};

const acknowledgeAllAlerts = async () => {
  if (!unacknowledgedCount.value) return;

  acknowledgingAll.value = true;
  try {
    await acknowledgeAllActions();

    actions.value.forEach((action) => {
      if (!action.acknowledged) {
        action.acknowledged = true;
      }
    });
  } catch (error) {
    console.error("Failed to acknowledge all actions:", error);
  } finally {
    acknowledgingAll.value = false;
  }
};

onMounted(() => {
  refreshActions();
});
</script>

<style scoped>
.notification-item {
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.full-text {
  white-space: normal;
  overflow: visible;
  line-height: 1.4;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
