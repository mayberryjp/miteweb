import api from "./api";
import type { PendingPattern } from "@/types";

export const getPendingPatterns = async (params?: {
  limit?: number;
}) => {
  const response = await api.get<PendingPattern[]>("/ai/pending", { params });
  return response.data;
};

export const triggerClassification = async () => {
  const response = await api.post("/ai/classify");
  return response.data;
};
