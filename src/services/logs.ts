import api from "./api";
import type { LogItem, PaginatedResponse, HourlyStat } from "@/types";

export const getLogs = async (params?: {
  limit?: number;
  offset?: number;
  host?: string;
  source_ip?: string;
  program?: string;
  severity?: string;
  search?: string;
  start?: string;
  end?: string;
}) => {
  const response = await api.get<PaginatedResponse<LogItem>>("/logs", { params });
  return response.data;
};

export const getRecentLogs = async (params?: {
  after_id?: number;
  limit?: number;
}) => {
  const response = await api.get<LogItem[]>("/logs/recent", { params });
  return response.data;
};

export const getLogsHourly = async (hours = 24) => {
  const response = await api.get<{ hours: number; stats: HourlyStat[] }>("/logs/hourly", { params: { hours } });
  return response.data.stats;
};

export const getLogsNoiseHourly = async (hours = 24) => {
  const response = await api.get<{ hours: number; stats: HourlyStat[] }>("/logs/noise/hourly", { params: { hours } });
  return response.data.stats;
};

export const getLogsDroppedHourly = async (hours = 24) => {
  const response = await api.get<{ hours: number; stats: HourlyStat[] }>("/logs/dropped/hourly", { params: { hours } });
  return response.data.stats;
};

export const getLogsTooSmallHourly = async (hours = 24) => {
  const response = await api.get<{ hours: number; stats: HourlyStat[] }>("/logs/too-small/hourly", { params: { hours } });
  return response.data.stats;
};

export const deleteAllLogs = async () => {
  const response = await api.delete<{ status: string; deleted: number }>("/logs");
  return response.data;
};

export const deleteNoiseLogs = async () => {
  const response = await api.post<{ status: string; deleted: number }>("/logs/cleanup-noise");
  return response.data;
};

export const deletePendingLogs = async () => {
  const response = await api.delete<{ status: string; deleted: number }>("/logs/pending");
  return response.data;
};
