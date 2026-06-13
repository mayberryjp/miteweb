import type { RouteRecordRaw } from "vue-router";
import AppLayout from "@/components/layout/AppLayout.vue";
import DashboardView from "@/views/DashboardView.vue";
import LogsView from "@/views/LogsView.vue";

const appRoutes: RouteRecordRaw[] = [
  {
    path: "/",
    component: AppLayout,
    children: [
      { path: "", name: "dashboard", component: DashboardView },
      { path: "logs", name: "logs", component: LogsView },
    ],
  },
];

export default appRoutes;
