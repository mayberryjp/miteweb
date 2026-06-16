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

export const getSettings = async (): Promise<Array<{ key: string; value: string; default: string }>> => {
  const response = await api.get<Array<{ key: string; value: string; default: string }>>("/settings");
  return response.data;
};

export const getSetting = async (key: string): Promise<string> => {
  const response = await api.get<{ key: string; value: string | number; default: string | number }>(`/settings/${key}`);
  return String(response.data.value ?? response.data.default);
};

export const updateSetting = async (key: string, value: string | number): Promise<void> => {
  await api.put(`/settings/${key}`, { value });
};

export const resetSetting = async (key: string): Promise<string> => {
  const response = await api.post<{ key: string; value: string }>(`/settings/${key}/reset`);
  return response.data.value;
};
