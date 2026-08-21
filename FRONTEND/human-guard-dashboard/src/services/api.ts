const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// ==========================================
// GENERIC FETCH WRAPPER
// ==========================================
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "API Request Failed");
  }

  return response.json();
}

// ==========================================
// API ENDPOINTS
// ==========================================

// Devices API
export const getDevices = () => apiRequest<any[]>("/devices");

export const toggleDeviceChannel = (channelId: string, state: boolean) =>
  apiRequest<{ message: string }>(`/device-channels/${channelId}/toggle`, {
    method: "POST",
    body: JSON.stringify({ state }),
  });

// Dashboard & Activity Logs API
export const getDashboardSummary = () => apiRequest<any>("/dashboard/summary");

export const getActivityLogs = () => apiRequest<any[]>("/telemetry/logs");

// Schedules & Automation API
export const getSchedules = () => apiRequest<any[]>("/schedules");

export const getAutomations = () => apiRequest<any[]>("/automation");