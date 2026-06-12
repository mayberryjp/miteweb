import api from "./api";
import type { AlertItem } from "@/types";

export const getAlerts = async (params?: {
  severity?: string;
  host?: string;
  source_ip?: string;
  rule_name?: string;
  search?: string;
}) => {
  const response = await api.get<AlertItem[]>("/alerts", { params });
  return response.data;
};
