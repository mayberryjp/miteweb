import api from "./api";
import type { PatternItem, PaginatedResponse } from "@/types";

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
