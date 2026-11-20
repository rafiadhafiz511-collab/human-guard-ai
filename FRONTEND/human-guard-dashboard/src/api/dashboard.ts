import api from "./client";
import type { DashboardStats } from "../types";

// ============================================================
// DASHBOARD API
// ============================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>("/dashboard/");

  return response.data;
}