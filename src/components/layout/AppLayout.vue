<template>
  <div class="app-layout">
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <span class="logo">🔍</span>
        <span class="logo-sub">mite</span>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>
    <main class="main-content">
      <header class="top-bar">
        <button class="menu-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
          ☰
        </button>
        <div class="top-bar-right">
          <span class="text-muted mono" style="font-size: 12px;">
            {{ currentTime }}
          </span>
        </div>
      </header>
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const sidebarCollapsed = ref(false);
const currentTime = ref("");

const navItems = [
  { to: "/", icon: "📊", label: "Dashboard" },
  { to: "/logs", icon: "📜", label: "Live Logs" },
  { to: "/alerts", icon: "🔔", label: "Alerts" },
  { to: "/hosts", icon: "🖥", label: "Hosts" },
  { to: "/rules", icon: "📋", label: "Rules" },
  { to: "/ai", icon: "🤖", label: "AI Analysis" },
  { to: "/settings", icon: "⚙", label: "Settings" },
];

const isActive = (to: string) => {
  if (to === "/") return route.path === "/";
  return route.path.startsWith(to);
};

let timer: ReturnType<typeof setInterval>;

const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString();
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});

// Collapse sidebar on mobile by default
const checkMobile = () => {
  sidebarCollapsed.value = window.innerWidth < 768;
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.2s, transform 0.2s;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar.collapsed {
  transform: translateX(-100%);
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.logo-sub {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 2px;
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--bg-hover);
  color: var(--accent);
}

.nav-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: var(--sidebar-width);
  transition: margin-left 0.2s;
  min-width: 0;
}

.sidebar.collapsed + .main-content {
  margin-left: 0;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);
  position: sticky;
  top: 0;
  z-index: 50;
}

.menu-toggle {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.menu-toggle:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.page-content {
  padding: 24px;
  flex: 1;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .sidebar:not(.collapsed) {
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
  }

  .main-content {
    margin-left: 0 !important;
  }

  .page-content {
    padding: 16px;
  }
}
</style>
