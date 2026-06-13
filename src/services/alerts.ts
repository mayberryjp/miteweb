import api from "./api";
import type { AlertItem, PaginatedResponse } from "@/types";

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
