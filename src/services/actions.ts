import api from "./api";
import type { ActionItem, PaginatedResponse } from "@/types";

const acknowledgeSinglePaths = (actionId: number) => [
  `/actions/${actionId}/acknowledge`,
  `/actions/acknowledge/${actionId}`,
  `/actions/${actionId}`,
];

const acknowledgeAllPaths = [
  "/actions/acknowledge-all",
];

export const getActions = async () => {
  const response = await api.get<PaginatedResponse<ActionItem>>("/actions");
  return response.data.items;
};

export const acknowledgeAction = async (actionId: number) => {
  let lastError: unknown;

  for (const path of acknowledgeSinglePaths(actionId)) {
    try {
      const response = await api.post(path);
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

export const acknowledgeAllActions = async () => {
  let lastError: unknown;

  for (const path of acknowledgeAllPaths) {
    try {
      const response = await api.post(path);
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};
