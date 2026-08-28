// ============================================================
// HUMAN TECH DASHBOARD
// Shared Application Types
// ============================================================

// ============================================================
// DEVICE
// ============================================================

export type DeviceType =
  | "SMART_PUMP"
  | "PUMP"
  | "LIGHT"
  | "CAMERA"
  | "SENSOR"
  | "RELAY"
  | "FAN"
  | "TV"
  | "AC"
  | "SMART_PLUG"
  | "SMART_DEVICE"
  | (string & {});

export type DeviceState =
  | "ON"
  | "OFF"
  | "UNKNOWN";

export type DeviceStatus =
  | "ONLINE"
  | "OFFLINE"
  | "UNKNOWN";

export interface Device {
  id: string;

  device_id: string;

  device_name: string;

  device_type: DeviceType;

  status: DeviceStatus;

  state: DeviceState;

  home_id?: string | null;

  room_id?: string | null;

  ip_address?: string | null;

  mac_address?: string | null;

  firmware_version?: string | null;

  last_seen?: string | null;

  created_at?: string | null;

  // ----------------------------------------------------------
  // COMMAND / AUTOMATION STATE
  // ----------------------------------------------------------

  pending_command?: string | null;

  command_updated_at?: string | null;

  is_auto?: boolean | null;
}

// ============================================================
// DEVICE API RESPONSE
// ============================================================

export interface ApiDevice {
  id: string;

  device_id: string;

  device_name: string;

  device_type?: string | null;

  status?: string | null;

  state?: string | null;

  home_id?: string | null;

  room_id?: string | null;

  ip_address?: string | null;

  mac_address?: string | null;

  firmware_version?: string | null;

  last_seen?: string | null;

  created_at?: string | null;

  // ----------------------------------------------------------
  // COMMAND / AUTOMATION STATE
  // ----------------------------------------------------------

  pending_command?: string | null;

  command_updated_at?: string | null;

  is_auto?: boolean | null;
}

// ============================================================
// DEVICE REGISTRATION
// ============================================================

export interface RegisterDevicePayload {
  device_id: string;

  device_name: string;

  device_type: string;

  room_id?: string | null;
}

export interface RegisterDeviceResponse {
  id?: string;

  device_id: string;

  device_name?: string;

  device_type?: string;

  status?: string;

  state?: string;

  home_id?: string | null;

  room_id?: string | null;

  message?: string;
}

// ============================================================
// DEVICE COMMANDS
// ============================================================

export type DeviceCommand =
  | "POWER_ON"
  | "POWER_OFF"
  | "PUMP_ON"
  | "PUMP_OFF"
  | "LIGHT_ON"
  | "LIGHT_OFF"
  | "FAN_ON"
  | "FAN_OFF"
  | "TV_ON"
  | "TV_OFF"
  | "AC_ON"
  | "AC_OFF"
  | "SMART_PLUG_ON"
  | "SMART_PLUG_OFF"
  | (string & {});

export interface DeviceCommandPayload {
  command: DeviceCommand;
}

export interface DeviceCommandResponse {
  success?: boolean;

  message?: string;

  command?: string;

  status?: string;

  device_id?: string;
}

// ============================================================
// COMMAND ACTIVITY
// ============================================================

export interface CommandActivityStats {
  pending: number;

  completed: number;

  failed: number;

  total: number;

  // Allows future backend command states
  // without breaking the frontend type system.
  [key: string]: number;
}

// ============================================================
// AUTOMATION RULES
// ============================================================

export type SensorType =
  | "SOIL_MOISTURE"
  | "TEMPERATURE"
  | "HUMIDITY"
  | "WATER_LEVEL"
  | (string & {});

export type RuleOperator =
  | "<"
  | ">"
  | "=="
  | "<="
  | ">="
  | "!=";

export type RuleAction =
  | "PUMP_ON"
  | "PUMP_OFF"
  | "LIGHT_ON"
  | "LIGHT_OFF"
  | (string & {});

export interface AutomationRule {
  id: string;

  rule_name: string;

  sensor_type: SensorType;

  threshold: number;

  operator: RuleOperator;

  target_device_id: string;

  action: RuleAction;

  is_active: boolean;

  created_at?: string | null;
}

// ============================================================
// AI / CAMERA DETECTIONS
// ============================================================

export interface Detection {
  id: string;

  device_id?: string | null;

  label: string;

  confidence: number;

  // ----------------------------------------------------------
  // IMAGE / SNAPSHOT
  // ----------------------------------------------------------

  image_url?: string | null;

  image_path?: string | null;

  snapshot?: string | null;

  // ----------------------------------------------------------
  // AI DETECTION FLAGS
  // ----------------------------------------------------------

  person?: boolean | null;

  alarm?: boolean | null;

  // ----------------------------------------------------------
  // TIMESTAMPS
  // ----------------------------------------------------------

  detected_at: string;

  created_at?: string | null;
}

// ============================================================
// USER / AUTH
// ============================================================

export type UserRole =
  | "ADMIN"
  | "USER"
  | "OPERATOR"
  | (string & {});

export interface UserProfile {
  id: string;

  email: string;

  full_name?: string | null;

  role?: UserRole;

  fcm_token?: string | null;

  created_at?: string | null;
}

// ============================================================
// TELEMETRY
// ============================================================

export interface TelemetryPayload {
  device_id: string;

  state?: DeviceState;

  data: Record<
    string,
    number | string | boolean | null
  >;

  timestamp: string;
}

// ============================================================
// DASHBOARD
// ============================================================

export interface DashboardDeviceStats {
  total: number;
  online: number;
  offline: number;
}

export interface DashboardCommandStats {
  total: number;
  pending: number;
  sent: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface DashboardLatestCommand {
  id: string;
  device_id: string;
  command: string;
  status: string;
  created_at?: string | null;
  sent_at?: string | null;
  completed_at?: string | null;
}

export interface DashboardStats {
  devices: DashboardDeviceStats;

  commands: DashboardCommandStats;

  latest_command: DashboardLatestCommand | null;

  server_time: string;

  offline_after_seconds: number;
}

// ============================================================
// UI HELPERS
// ============================================================

export type AsyncStatus =
  | "idle"
  | "loading"
  | "success"
  | "error";

export interface ApiErrorResponse {
  detail?: string;

  message?: string;
}

// ============================================================
// ROOMS
// ============================================================

export interface Room {
  id: string;

  home_id: string;

  name: string;

  created_at?: string | null;

  updated_at?: string | null;
}

export interface CreateRoomPayload {
  name: string;
}

export interface RoomCreatePayload {
  name: string;
}

export interface UpdateRoomPayload {
  name: string;
}

export interface RoomUpdatePayload {
  name: string;
}

// ============================================================
// ROOM DEVICES
// ============================================================

export interface RoomDevice extends Device {
  room_id?: string | null;
}

export interface RoomDevicesResponse {
  success: boolean;

  home_id: string;

  room_id: string;

  room_name: string;

  device_count: number;

  devices: RoomDevice[];
}

// ============================================================
// ROOM ACTIONS & RESPONSES
// ============================================================

export interface RoomActionResponse {
  success: boolean;

  message: string;

  home_id: string;

  room_id: string;

  device_id?: string;

  previous_room_id?: string | null;
}

export interface AssignDeviceToRoomResponse {
  success: boolean;

  message: string;

  home_id: string;

  room_id: string;

  device_id: string;

  previous_room_id?: string | null;
}

export interface RemoveDeviceFromRoomResponse {
  success: boolean;

  message: string;

  home_id: string;

  room_id: string;

  device_id: string;
}