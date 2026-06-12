import api from "./api";
import type { HealthStatus, StatsData } from "@/types";

export const getHealth = async () => {
  const response = await api.get<HealthStatus>("/health");
  return response.data;
};

export const getStats = async () => {
  const response = await api.get<StatsData>("/stats");
  return response.data;
};

export const testDiscord = async () => {
  const response = await api.post("/discord/test");
  return response.data;
};
