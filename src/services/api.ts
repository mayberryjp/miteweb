import axios from "axios";

const envBase = import.meta.env.VITE_API_BASE_URL || "";
const baseURL = `${envBase.replace(/\/+$/, "")}/api`;

const api = axios.create({
  baseURL,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default api;
