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

function getStoredSupabaseToken(): string | null {
  try {
    const sbKey = Object.keys(localStorage).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (!sbKey) return null;

    const raw = localStorage.getItem(sbKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed?.access_token || parsed?.currentSession?.access_token || null;
  } catch {
    return null;
  }
}

async function resolveAccessToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      return session.access_token;
    }
  } catch (err) {
    console.warn("[API] supabase.auth.getSession() failed:", err);
  }

  return getStoredSupabaseToken() || localStorage.getItem("access_token");
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
    const token = await resolveAccessToken();

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
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
      console.warn("[API] Unauthorized request (401):", error.response?.data);
    }

    if (status === 403) {
      console.warn("[API] Forbidden request (403):", error.response?.data);
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
