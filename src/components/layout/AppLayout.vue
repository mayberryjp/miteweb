<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar color="background-100" dark app elevation="0">
      <!-- Product logo + name (left) -->
      <router-link to="/" class="product-branding d-flex align-center text-decoration-none ms-2 ms-lg-8">
        <img src="@/assets/mite.png" alt="Mite" width="48" height="48" class="mr-3" />
        <span class="product-name text-h5">Mite
          <span class="product-bar tagline">|</span>
          <span class="know-your-network tagline">Know Your Network</span>
        </span>
      </router-link>

      <v-spacer></v-spacer>

      <!-- Desktop navigation -->
      <div v-if="lgAndUp" class="d-flex align-center">
        <v-btn
          v-for="item in navItems"
          :key="item.to"
          :to="item.external ? undefined : item.to"
          :href="item.external ? item.to : undefined"
          :target="item.external ? '_blank' : undefined"
          variant="text"
          class="mx-2 nav-btn"
          rounded
          :color="!item.external && isActive(item.to) ? 'rose' : ''"
        >
          <v-icon start>{{ item.icon }}</v-icon>
          {{ item.label }}
        </v-btn>
      </div>
      <v-app-bar-nav-icon
        v-if="!lgAndUp"
        aria-label="Open navigation menu"
        @click="mobileMenuOpen = !mobileMenuOpen"
      ></v-app-bar-nav-icon>

      <NotificationsBell />
      <ProfileMenu />
    </v-app-bar>

    <!-- Mobile navigation drawer -->
    <v-navigation-drawer
      v-model="mobileMenuOpen"
      temporary
      location="right"
      color="background-100"
    >
      <v-list density="comfortable" nav>
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.external ? undefined : item.to"
          :href="item.external ? item.to : undefined"
          :target="item.external ? '_blank' : undefined"
          :prepend-icon="item.icon"
          :title="item.label"
          :active="!item.external && isActive(item.to)"
          color="rose"
          @click="mobileMenuOpen = false"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-3 pa-sm-4 pa-lg-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import NotificationsBell from "@/components/NotificationsBell.vue";
import ProfileMenu from "@/components/ProfileMenu.vue";

const route = useRoute();
const mobileMenuOpen = ref(false);
const { lgAndUp } = useDisplay();

const navItems = [
  { to: "/", label: "Dashboard", icon: "mdi-view-dashboard" },
  { to: "/logs", label: "Live Logs", icon: "mdi-file-document-outline" },
  { to: "https://github.com/mayberryjp/mite", label: "Documentation", icon: "mdi-book-open-variant", external: true },
  { to: "/settings", label: "Settings", icon: "mdi-cog" },
  { to: "https://github.com/mayberryjp/mite/issues", label: "Requests & Roadmap", icon: "mdi-map-marker-path", external: true },
];

const isActive = (to: string) => {
  if (to === "/") return route.path === "/";
  return route.path.startsWith(to);
};
</script>

<style scoped>
.v-app-bar {
  border-bottom: 0px !important;
  box-shadow: none !important;
}

.product-branding {
  margin-top: 5px;
  height: 48px;
}

.nav-btn {
  text-transform: capitalize;
  color: #b1b8c0;
  font-size: 16px !important;
  font-weight: 400;
  letter-spacing: 0em !important;
}

.product-name {
  color: #2EC4A0;
  font-weight: 700;
  font-size: 1.5rem !important;
  text-align: start;
  line-height: 1.4;
  letter-spacing: 0.05em !important;
  white-space: nowrap;
}

.product-bar {
  color: #2196F3;
  font-weight: 700;
  line-height: 1.4;
  margin-right: 8px;
  letter-spacing: 0.05em !important;
}

.know-your-network {
  color: #64B5F6;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.05em !important;
}

/* Tagline hidden by default; shown only >= 1500px */
.tagline {
  display: none;
}

@media (min-width: 1500px) {
  .tagline {
    display: inline;
  }
}

.v-main {
  background-color: #0a0e14;
  color: rgba(255, 255, 255, 0.87);
}
</style>
