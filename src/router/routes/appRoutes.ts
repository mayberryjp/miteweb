import type { RouteRecordRaw } from "vue-router";
import AppLayout from "@/components/layout/AppLayout.vue";
import DashboardView from "@/views/DashboardView.vue";
import LogsView from "@/views/LogsView.vue";
import AlertsView from "@/views/AlertsView.vue";
import HostsView from "@/views/HostsView.vue";
import RulesView from "@/views/RulesView.vue";
import AIListView from "@/views/AIListView.vue";
import AIDetailView from "@/views/AIDetailView.vue";
import SettingsView from "@/views/SettingsView.vue";

const appRoutes: RouteRecordRaw[] = [
  {
    path: "/",
    component: AppLayout,
    children: [
      { path: "", name: "dashboard", component: DashboardView },
      { path: "logs", name: "logs", component: LogsView },
      { path: "alerts", name: "alerts", component: AlertsView },
      { path: "hosts", name: "hosts", component: HostsView },
      { path: "rules", name: "rules", component: RulesView },
      { path: "ai", name: "ai-list", component: AIListView },
      { path: "ai/:id", name: "ai-detail", component: AIDetailView },
      { path: "settings", name: "settings", component: SettingsView },
    ],
  },
];

export default appRoutes;
