import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

// ============================================================
// API BASE URL
// ============================================================

const getApiBaseUrl = (): string => {
  return (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? "/api/v1"
      : "http://127.0.0.1:8000/api/v1")
  );
};

// ============================================================
// API CLIENT
// ============================================================

const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
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
    console.error("[API] Request error:", error);
    return Promise.reject(error);
  }
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(
  (response) => response,

  (error: AxiosError) => {
    // --------------------------------------------------------
    // 401 UNAUTHORIZED
    // --------------------------------------------------------

    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");

      console.warn(
        "[API] Unauthorized - token may have expired"
      );
    }

    // --------------------------------------------------------
    // 403 FORBIDDEN
    // --------------------------------------------------------

    if (error.response?.status === 403) {
      console.error("[API] Access forbidden");
    }

    // --------------------------------------------------------
    // 500 SERVER ERROR
    // --------------------------------------------------------

    if (error.response?.status === 500) {
      console.error(
        "[API] Server error:",
        error.response.data
      );
    }

    // --------------------------------------------------------
    // NETWORK ERROR
    // --------------------------------------------------------

    if (!error.response) {
      console.error(
        "[API] Network error - check backend connectivity"
      );
    }

    return Promise.reject(error);
  }
);

export default api;