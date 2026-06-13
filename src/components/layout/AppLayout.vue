<template>
  <div class="app-layout">
    <header class="top-nav">
      <div class="nav-left">
        <div class="brand">
          <img src="@/assets/mite.png" alt="Mite" class="brand-icon" />
          <span class="brand-name">Mite</span>
        </div>
      </div>
      <div class="nav-right">
        <nav class="nav-links" :class="{ open: mobileMenuOpen }">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: isActive(item.to) }"
            @click="mobileMenuOpen = false"
          >
            <svg class="nav-link-icon" viewBox="0 0 20 20" fill="currentColor">
              <path :d="item.iconPath" />
            </svg>
            {{ item.label }}
          </router-link>
        </nav>
        <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Toggle menu">
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </header>
    <main class="page-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const mobileMenuOpen = ref(false);

const navItems = [
  { to: "/", label: "Dashboard", iconPath: "M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm12-1a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" },
  { to: "/logs", label: "Live Logs", iconPath: "M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" },
];

const isActive = (to: string) => {
  if (to === "/") return route.path === "/";
  return route.path.startsWith(to);
};
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

/* ── Top Navigation Bar ── */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--topbar-height);
  padding: 0 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: contain;
}

.brand-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.nav-link:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-link.active {
  background: var(--accent);
  color: #fff;
}

.nav-link-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.clock {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  align-items: center;
  justify-content: center;
}

.mobile-menu-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* ── Main Content ── */
.page-content {
  padding: 28px;
  flex: 1;
  overflow-x: auto;
}

/* ── Mobile ── */
@media (max-width: 900px) {
  .mobile-menu-btn {
    display: flex;
  }

  .nav-links {
    display: none;
    position: absolute;
    top: var(--topbar-height);
    left: 0;
    right: 0;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    flex-direction: column;
    padding: 8px 16px;
    gap: 2px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .nav-links.open {
    display: flex;
  }

  .nav-link {
    padding: 10px 14px;
    width: 100%;
  }

  .page-content {
    padding: 20px;
  }
}
</style>
