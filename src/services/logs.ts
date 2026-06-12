import api from "./api";
import type { LogItem } from "@/types";

export const getLogs = async (params?: {
  limit?: number;
  host?: string;
  source_ip?: string;
  program?: string;
  severity?: string;
  search?: string;
}) => {
  const response = await api.get<LogItem[]>("/logs", { params });
  return response.data;
};

export const getRecentLogs = async (params?: {
  after_id?: number;
  limit?: number;
}) => {
  const response = await api.get<LogItem[]>("/logs/recent", { params });
  return response.data;
};
