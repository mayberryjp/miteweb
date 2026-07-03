import axios, { AxiosError } from "axios";

const envBase = import.meta.env.VITE_API_BASE_URL || "";
const baseURL = `${envBase.replace(/\/+$/, "")}/api`;

const api = axios.create({
  baseURL,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/** Extracts a human-readable message from an unknown (usually Axios) error. */
export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    const data = axiosError.response?.data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (axiosError.code === "ECONNABORTED") return "The request timed out. Please try again.";
    if (axiosError.response) return `Request failed with status ${axiosError.response.status}.`;
    return "Unable to reach the server. Check your network connection.";
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
};

// Centralized logging for all failed requests. Callers still receive the
// rejected promise so their own error handling continues to work.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    console.error(`[api] ${getApiErrorMessage(error)}`, error);
    return Promise.reject(error);
  }
);

export default api;

