import api from "./api";
import type { PatternItem, PaginatedResponse, LogItem } from "@/types";

export const getPatterns = async (params?: {
  limit?: number;
  offset?: number;
  classification?: string;
}) => {
  const response = await api.get<PaginatedResponse<PatternItem>>("/patterns", { params });
  return response.data;
};

export const getPattern = async (id: number) => {
  const response = await api.get<PatternItem>(`/patterns/${id}`);
  return response.data;
};

export const updatePattern = async (id: number, data: { classification?: string; match_regex?: string }) => {
  const response = await api.put(`/patterns/${id}`, data);
  return response.data;
};

export const getPatternStats = async (hours: number = 12) => {
  const response = await api.get<Record<string, { hour: string; count: number }[]>>("/patterns/stats", { params: { hours } });
  return response.data;
};

export const getPatternTimeSeries = async (patternId: number, hours: number = 24) => {
  const response = await api.get<{ pattern_id: number; hours: number; stats: { hour: string; count: number }[] }>(
    `/patterns/${patternId}/stats`, { params: { hours } }
  );
  return response.data;
};

export const getPatternLogs = async (patternId: number, params?: { limit?: number; offset?: number }) => {
  const response = await api.get<PaginatedResponse<LogItem>>(`/patterns/${patternId}/logs`, { params });
  return response.data;
};
