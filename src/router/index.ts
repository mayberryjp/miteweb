import { createRouter, createWebHistory } from "vue-router";
import appRoutes from "./routes/appRoutes";

const routes = [...appRoutes];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.onError((error) => {
  console.error("Router error:", error);
});

export default router;
