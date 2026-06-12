import api from "./api";
import type { HostItem } from "@/types";

export const getHosts = async () => {
  const response = await api.get<HostItem[]>("/hosts");
  return response.data;
};
