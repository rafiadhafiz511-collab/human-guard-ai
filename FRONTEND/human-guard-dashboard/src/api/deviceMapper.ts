
// ============================================================
// HUMAN TECH DASHBOARD
// Device API → UI Mapper
// ============================================================

import type {
  ApiDevice,
  Device,
  DeviceState,
  DeviceStatus,
  DeviceType,
} from "../types";

// ============================================================
// STATUS NORMALIZER
// ============================================================

export function normalizeDeviceStatus(
  status?: string | null
): DeviceStatus {
  switch (status?.trim().toUpperCase()) {
    case "ONLINE":
      return "ONLINE";

    case "OFFLINE":
      return "OFFLINE";

    default:
      return "UNKNOWN";
  }
}

// ============================================================
// STATE NORMALIZER
// ============================================================

export function normalizeDeviceState(
  state?: string | null
): DeviceState {
  switch (state?.trim().toUpperCase()) {
    case "ON":
      return "ON";

    case "OFF":
      return "OFF";

    default:
      return "UNKNOWN";
  }
}

// ============================================================
// DEVICE TYPE NORMALIZER
// ============================================================

export function normalizeDeviceType(
  type?: string | null
): DeviceType {
  const normalized = type?.trim().toUpperCase();

  if (!normalized) {
    return "SMART_DEVICE";
  }

  return normalized as DeviceType;
}

// ============================================================
// API DEVICE → UI DEVICE
// ============================================================

export function mapApiDevice(
  device: ApiDevice
): Device {
  return {
    id: device.id,

    device_id: device.device_id,

    device_name: device.device_name,

    device_type: normalizeDeviceType(
      device.device_type
    ),

    status: normalizeDeviceStatus(
      device.status
    ),

    state: normalizeDeviceState(
      device.state
    ),

    // ----------------------------------------------------------
    // HOME / ROOM
    // ----------------------------------------------------------

    home_id: device.home_id ?? null,

    room_id: device.room_id ?? null,

    // ----------------------------------------------------------
    // NETWORK
    // ----------------------------------------------------------

    ip_address: device.ip_address ?? null,

    mac_address: device.mac_address ?? null,

    // ----------------------------------------------------------
    // FIRMWARE
    // ----------------------------------------------------------

    firmware_version:
      device.firmware_version ?? null,

    // ----------------------------------------------------------
    // TIMESTAMPS
    // ----------------------------------------------------------

    last_seen:
      device.last_seen ?? null,

    created_at:
      device.created_at ?? null,

    // ----------------------------------------------------------
    // COMMAND / AUTOMATION STATE
    // ----------------------------------------------------------

    pending_command:
      device.pending_command ?? null,

    command_updated_at:
      device.command_updated_at ?? null,

    is_auto:
      device.is_auto ?? null,
  };
}

// ============================================================
// ARRAY MAPPER
// ============================================================

export function mapApiDevices(
  devices: ApiDevice[]
): Device[] {
  return devices.map(mapApiDevice);
}

