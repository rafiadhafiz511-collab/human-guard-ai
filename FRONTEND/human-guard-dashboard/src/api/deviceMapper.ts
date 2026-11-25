import type {
  ApiDevice,
  Device,
  DeviceState,
  DeviceStatus,
  DeviceType,
} from "../types";

const OFFLINE_AFTER_MS = 60_000;

function parseUtcTimestamp(value?: string | null): number {
  if (!value) return Number.NaN;
  const trimmed = value.trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  const isoCandidate = hasTimezone ? trimmed : `${trimmed}Z`;
  return Date.parse(isoCandidate);
}

export function normalizeDeviceStatus(
  status?: string | null,
  lastSeen?: string | null
): DeviceStatus {
  const normalized = status?.trim().toUpperCase();

  if (normalized === "ONLINE") {
    if (!lastSeen) {
      return "OFFLINE";
    }
    const seenTime = parseUtcTimestamp(lastSeen);
    if (Number.isNaN(seenTime) || Date.now() - seenTime > OFFLINE_AFTER_MS) {
      return "OFFLINE";
    }
    return "ONLINE";
  }

  if (normalized === "OFFLINE") {
    return "OFFLINE";
  }

  return "UNKNOWN";
}

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

export function normalizeDeviceType(
  type?: string | null
): DeviceType {
  const normalized = type?.trim().toUpperCase();
  return (normalized || "SMART_DEVICE") as DeviceType;
}

export function mapApiDevice(device: ApiDevice): Device {
  return {
    id: device.id,
    device_id: device.device_id,
    device_name: device.device_name,
    device_type: normalizeDeviceType(device.device_type),
    status: normalizeDeviceStatus(device.status, device.last_seen),
    state: normalizeDeviceState(device.state),
    home_id: device.home_id ?? null,
    room_id: device.room_id ?? null,
    ip_address: device.ip_address ?? null,
    mac_address: device.mac_address ?? null,
    firmware_version: device.firmware_version ?? null,
    last_seen: device.last_seen ?? null,
    created_at: device.created_at ?? null,
    pending_command: device.pending_command ?? null,
    command_updated_at: device.command_updated_at ?? null,
    is_auto: device.is_auto ?? null,
  };
}

export function mapApiDevices(devices: ApiDevice[]): Device[] {
  return devices.map(mapApiDevice);
}
