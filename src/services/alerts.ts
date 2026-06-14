import api from "./api";
import type { AlertItem, PaginatedResponse, HourlyStat } from "@/types";

export const getAlerts = async (params?: {
  limit?: number;
  offset?: number;
  severity?: string;
  host?: string;
  source_ip?: string;
  pattern_id?: number;
  search?: string;
}) => {
  const response = await api.get<PaginatedResponse<AlertItem>>("/alerts", { params });
  return response.data;
};

export const getAlertsHourly = async (hours = 24) => {
  const response = await api.get<{ hours: number; stats: HourlyStat[] }>("/alerts/hourly", { params: { hours } });
  return response.data.stats;
};

export const deleteAllAlerts = async () => {
  const response = await api.delete("/alerts");
  return response.data;
};
