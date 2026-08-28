import api from "./client";

import type { DeviceStatus, DeviceState } from "../types";

// ============================================================
// ROOM TYPES
// ============================================================

export interface Room {
  id: string;
  home_id: string;
  name: string;
  created_at?: string | null;
  updated_at?: string | null;
}

// ============================================================
// ROOM DEVICE
// ============================================================

export interface RoomDevice {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  status: DeviceStatus;
  state: DeviceState;
  firmware_version?: string | null;
  last_seen?: string | null;
  home_id?: string | null;
  room_id?: string | null;
}

// ============================================================
// ROOM DEVICES RESPONSE
// ============================================================

export interface RoomDevicesResponse {
  success: boolean;
  home_id: string;
  room_id: string;
  room_name: string;
  device_count: number;
  devices: RoomDevice[];
}

// ============================================================
// CREATE ROOM
// ============================================================

export interface CreateRoomPayload {
  name: string;
}

export async function createRoom(
  homeId: string,
  payload: CreateRoomPayload
): Promise<Room> {
  const response = await api.post<Room>(
    `/homes/${encodeURIComponent(homeId)}/rooms`,
    payload
  );

  return response.data;
}

// ============================================================
// GET HOME ROOMS
// ============================================================

export async function getHomeRooms(
  homeId: string
): Promise<Room[]> {
  const response = await api.get<Room[]>(
    `/homes/${encodeURIComponent(homeId)}/rooms`
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

// ============================================================
// GET ROOMS
// Backward-compatible alias
// ============================================================

export const getRooms = getHomeRooms;

// ============================================================
// GET SINGLE ROOM
// ============================================================

export async function getRoom(
  homeId: string,
  roomId: string
): Promise<Room> {
  const response = await api.get<Room>(
    `/homes/${encodeURIComponent(homeId)}/rooms/${encodeURIComponent(roomId)}`
  );

  return response.data;
}

// ============================================================
// UPDATE ROOM
// ============================================================

export interface UpdateRoomPayload {
  name: string;
}

export async function updateRoom(
  homeId: string,
  roomId: string,
  payload: UpdateRoomPayload
): Promise<Room> {
  const response = await api.patch<Room>(
    `/homes/${encodeURIComponent(homeId)}/rooms/${encodeURIComponent(roomId)}`,
    payload
  );

  return response.data;
}

// ============================================================
// DELETE ROOM
// ============================================================

export interface DeleteRoomResponse {
  success: boolean;
  message: string;
  home_id: string;
  room_id: string;
}

export async function deleteRoom(
  homeId: string,
  roomId: string
): Promise<DeleteRoomResponse> {
  const response = await api.delete<DeleteRoomResponse>(
    `/homes/${encodeURIComponent(homeId)}/rooms/${encodeURIComponent(roomId)}`
  );

  return response.data;
}

// ============================================================
// ASSIGN DEVICE TO ROOM
// ============================================================

export interface AssignDeviceResponse {
  success: boolean;
  message: string;
  home_id: string;
  room_id: string;
  device_id: string;
  previous_room_id: string | null;
}

export async function assignDeviceToRoom(
  homeId: string,
  roomId: string,
  deviceId: string
): Promise<AssignDeviceResponse> {
  const response = await api.post<AssignDeviceResponse>(
    `/homes/${encodeURIComponent(homeId)}/rooms/${encodeURIComponent(roomId)}/devices/${encodeURIComponent(deviceId)}`
  );

  return response.data;
}

// ============================================================
// REMOVE DEVICE FROM ROOM
// ============================================================

export interface RemoveDeviceFromRoomResponse {
  success: boolean;
  message: string;
  home_id: string;
  room_id: string;
  device_id: string;
}

export async function removeDeviceFromRoom(
  homeId: string,
  roomId: string,
  deviceId: string
): Promise<RemoveDeviceFromRoomResponse> {
  const response =
    await api.delete<RemoveDeviceFromRoomResponse>(
      `/homes/${encodeURIComponent(homeId)}/rooms/${encodeURIComponent(roomId)}/devices/${encodeURIComponent(deviceId)}`
    );

  return response.data;
}

// ============================================================
// GET ROOM DEVICES
// ============================================================

export async function getRoomDevices(
  homeId: string,
  roomId: string
): Promise<RoomDevicesResponse> {
  const response =
    await api.get<RoomDevicesResponse>(
      `/homes/${encodeURIComponent(homeId)}/rooms/${encodeURIComponent(roomId)}/devices`
    );

  return response.data;
}