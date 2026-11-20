
import api from "./client";

// ============================================================
// HOME TYPES
// ============================================================

export interface Home {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateHomePayload {
  name: string;
}

export interface UpdateHomePayload {
  name: string;
}

// ============================================================
// GET MY HOMES
// ============================================================

export async function getHomes(): Promise<Home[]> {
  const response = await api.get<Home[]>("/homes/");

  return Array.isArray(response.data)
    ? response.data
    : [];
}

// ============================================================
// GET SINGLE HOME
// ============================================================

export async function getHome(
  homeId: string
): Promise<Home> {
  const response = await api.get<Home>(
    `/homes/${encodeURIComponent(homeId)}`
  );

  return response.data;
}

// ============================================================
// CREATE HOME
// ============================================================

export async function createHome(
  payload: CreateHomePayload
): Promise<Home> {
  const response = await api.post<Home>(
    "/homes/",
    payload
  );

  return response.data;
}

// ============================================================
// UPDATE HOME
// ============================================================

export async function updateHome(
  homeId: string,
  payload: UpdateHomePayload
): Promise<Home> {
  const response = await api.patch<Home>(
    `/homes/${encodeURIComponent(homeId)}`,
    payload
  );

  return response.data;
}

// ============================================================
// DELETE HOME
// ============================================================

export interface DeleteHomeResponse {
  success: boolean;
  message: string;
  home_id: string;
}

export async function deleteHome(
  homeId: string
): Promise<DeleteHomeResponse> {
  const response =
    await api.delete<DeleteHomeResponse>(
      `/homes/${encodeURIComponent(homeId)}`
    );

  return response.data;
}

