import api from "./api";
import type { AIAnalysisItem } from "@/types";

export const getAnalyses = async () => {
  const response = await api.get<AIAnalysisItem[]>("/ai/analyses");
  return response.data;
};

export const getAnalysis = async (id: number) => {
  const response = await api.get<AIAnalysisItem>(`/ai/analyses/${id}`);
  return response.data;
};

export const runAnalysis = async (params: {
  host?: string;
  source_ip?: string;
  sample_count?: number;
}) => {
  const response = await api.post("/ai/analyze", params);
  return response.data;
};
