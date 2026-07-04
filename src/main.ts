import { createApp } from "vue";
import "./style.css";
import router from "./router";
import App from "@/App.vue";
import { createPinia } from "pinia";
import VueApexCharts from "vue3-apexcharts";

// Vuetify
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { mdi } from "vuetify/iconsets/mdi";

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
    sets: { mdi },
  },
  theme: {
    defaultTheme: "miteTheme",
    themes: {
      miteTheme: {
        dark: true,
        colors: {
          background: "#0a0e14",
          surface: "#111820",
          "surface-card": "#0d1117",
          "background-100": "#161b22",
          "background-200": "#161b22",
          primary: "#3b82f6",
          secondary: "#9E394F",
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
          info: "#58a6ff",
          rose: "#9E394F",
        },
      },
    },
  },
});

const pinia = createPinia();
const app = createApp(App);

app.use(router);
app.use(pinia);
app.use(vuetify);
app.use(VueApexCharts);
app.mount("#app");
