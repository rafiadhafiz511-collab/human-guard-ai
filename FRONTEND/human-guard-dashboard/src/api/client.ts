import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

// ============================================================
// API BASE URL
// Dynamic resolution for Production (Vercel) & Local
// ============================================================

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

// ============================================================
// API CLIENT
// ============================================================

const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("[API] Request configuration failed:", error);
    return Promise.reject(error);
  }
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("access_token");
      console.warn("[API] Unauthorized request.");
    }

    if (status === 403) {
      console.warn("[API] Forbidden request.");
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