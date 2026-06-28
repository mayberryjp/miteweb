import api from "./api";
import type { ActionItem, PaginatedResponse } from "@/types";

export const getActions = async () => {
  const response = await api.get<PaginatedResponse<ActionItem>>("/actions");
  return response.data.items;
};

export const acknowledgeAction = async (actionId: number) => {
  const response = await api.put<ActionItem>(`/actions/${actionId}`, { acknowledged: true });
  return response.data;
};

export const acknowledgeAllActions = async () => {
  const response = await api.post("/actions/acknowledge-all");
  return response.data;
};
