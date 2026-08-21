import api from "./client";

import type { DashboardStats } from "../types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>("/dashboard/");

  return response.data;
}