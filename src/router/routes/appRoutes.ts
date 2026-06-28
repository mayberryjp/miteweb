import type { RouteRecordRaw } from "vue-router";
import AppLayout from "@/components/layout/AppLayout.vue";

const MainLayout = () => import("@/views/MainLayout.vue");
const DashboardView = () => import("@/views/DashboardView.vue");
const LogsView = () => import("@/views/LogsView.vue");
const PatternDetailView = () => import("@/views/PatternDetailView.vue");
const SettingsView = () => import("@/views/SettingsView.vue");

const appRoutes: RouteRecordRaw[] = [
  {
    path: "/",
    component: AppLayout,
    children: [
      {
        path: "",
        component: MainLayout,
        children: [
          { path: "", name: "dashboard", component: DashboardView },
          { path: "patterns/:id", name: "pattern-detail", component: PatternDetailView },
        ],
      },
      { path: "logs", name: "logs", component: LogsView },
      { path: "settings", name: "settings", component: SettingsView },
    ],
  },
];

export default appRoutes;
