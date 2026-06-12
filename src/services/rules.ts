import api from "./api";
import type { RuleItem } from "@/types";

export const getRules = async () => {
  const response = await api.get<RuleItem[]>("/rules");
  return response.data;
};

export const reloadRules = async () => {
  const response = await api.post("/rules/reload");
  return response.data;
};
