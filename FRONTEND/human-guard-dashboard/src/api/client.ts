import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { supabase } from "../lib/supabase";

function getApiBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (import.meta.env.PROD) {
    return "/api/v1";
  }

  return "http://127.0.0.1:8000/api/v1";
}

const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token =
        session?.access_token || localStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("[API] Failed to read Supabase session:", err);
      const fallbackToken = localStorage.getItem("access_token");
      if (fallbackToken) {
        config.headers.Authorization = `Bearer ${fallbackToken}`;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("[API] Request configuration failed:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn("[API] Unauthorized request (401).");
    }

    if (status === 403) {
      console.warn("[API] Forbidden request (403).");
    }

    if (status && status >= 500) {
      console.error("[API] Server error:", error.response?.data);
    }

    if (!error.response) {
      console.error("[API] Network error. Backend may be unavailable.");
    }

    return Promise.reject(error);
  }
);

export default api;
