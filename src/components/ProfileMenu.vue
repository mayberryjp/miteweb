<template>
  <v-menu rounded :close-on-content-click="false">
    <template #activator="{ props }">
      <v-btn icon v-bind="props" class="ml-2">
        <v-avatar color="rose" size="36">
          <v-icon icon="mdi-account" />
        </v-avatar>
      </v-btn>
    </template>
    <v-card :min-width="xs ? '90vw' : '200px'">
      <v-list>
        <v-list-item
          v-for="(item, index) in profileMenuItems"
          :key="index"
          :to="item.routeName ? { name: item.routeName } : undefined"
          link
          @click="item.action ? item.action() : null"
        >
          <v-list-item-title>
            <v-icon start>{{ item.icon }}</v-icon>
            {{ item.title }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useDisplay } from "vuetify";

const { xs } = useDisplay();

type ProfileMenuItem = {
  title: string;
  icon: string;
  routeName?: string;
  action?: () => void;
};

const profileMenuItems = ref<ProfileMenuItem[]>([]);
</script>
