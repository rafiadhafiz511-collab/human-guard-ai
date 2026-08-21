import api from "./client";

import type { Device } from "../types";

// ============================================================
// TYPES
// ============================================================

export type DeviceCommand = {
  id: string;
  device_id: string;
  command: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  completed_at: string | null;
};

// ============================================================
// DEVICES
// ============================================================

export async function getDevices(): Promise<Device[]> {
  const response = await api.get("/devices/");

  const data = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.data)
      ? response.data.data
      : [];

  return data;
}

// ============================================================
// DEVICE COMMAND HISTORY
// ============================================================

export async function getDeviceCommands(
  deviceId: string
): Promise<DeviceCommand[]> {
  const response = await api.get<DeviceCommand[]>(
    `/devices/${encodeURIComponent(deviceId)}/commands`
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

// ============================================================
// ALL DEVICE COMMAND HISTORY
// ============================================================

export async function getAllDeviceCommands(
  devices: Device[]
): Promise<DeviceCommand[]> {
  if (devices.length === 0) {
    return [];
  }

  const responses = await Promise.all(
    devices.map((device) =>
      getDeviceCommands(device.device_id)
    )
  );

  return responses
    .flat()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );
}