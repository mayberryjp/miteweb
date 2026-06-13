import api from "./api";
import type { LogItem, PaginatedResponse } from "@/types";

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
