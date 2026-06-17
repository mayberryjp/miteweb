import api from "./api";
import type { HealthStatus, StatsData } from "@/types";

export interface EditableSetting {
  key: string;
  value: unknown;
  default: unknown;
  is_custom?: boolean;
  description?: string;
  type?: string;
}

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

export const getSettings = async (): Promise<EditableSetting[]> => {
  const response = await api.get<EditableSetting[]>("/settings");
  return response.data;
};

export const getSettingValue = async <T = unknown>(key: string): Promise<T> => {
  const response = await api.get<{ key: string; value: T; default: T }>(`/settings/${key}`);
  return (response.data.value ?? response.data.default) as T;
};

export const getSetting = async (key: string): Promise<string> => {
  const value = await getSettingValue<string | number>(key);
  return String(value);
};

export const updateSetting = async (key: string, value: unknown): Promise<void> => {
  await api.put(`/settings/${key}`, { value });
};

export const resetSetting = async (key: string): Promise<string> => {
  const response = await api.post<{ key: string; value: string }>(`/settings/${key}/reset`);
  return response.data.value;
};
