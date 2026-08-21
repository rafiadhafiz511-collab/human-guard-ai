export type DeviceType = "SMART_PUMP" | "PUMP" | "CAMERA" | "SENSOR" | "LIGHT" | "FAN" | string;
export type DeviceState = "ON" | "OFF" | string;
export type DeviceStatus = "online" | "offline" | "ONLINE" | "OFFLINE" | string;

export interface Device {
  id?: string;
  device_id: string;
  device_name: string;
  device_type: DeviceType;
  status: DeviceStatus;
  state?: DeviceState;
  ip_address?: string;
  mac_address?: string;
  firmware_version?: string;
  home_id?: string;
  last_seen?: string | null;
  created_at?: string;
  pending_command?: string | null;
  command_updated_at?: string | null;
  is_auto?: boolean;
}

export type SensorType = "SOIL_MOISTURE" | "TEMPERATURE" | "WATER_LEVEL" | string;
export type RuleOperator = "<" | ">" | "==" | "<=" | ">=";
export type RuleAction = "PUMP_ON" | "PUMP_OFF" | "LIGHT_ON" | "LIGHT_OFF" | string;

export interface AutomationRule {
  id: string;
  rule_name: string;
  sensor_type: SensorType;
  threshold: number;
  operator: RuleOperator;
  target_device_id: string;
  action: RuleAction;
  is_active: boolean;
  created_at?: string;
}

export interface Detection {
  id: string;
  device_id?: string;
  label?: string;
  confidence?: number;
  image_url?: string;
  image_path?: string;
  detected_at?: string;
  created_at?: string;
  person?: boolean | string;
  alarm?: boolean | string;
}

export interface DashboardStats {
  total_devices?: number;
  online_devices?: number;
  offline_devices?: number;
  total_detections?: number;
  active_rules?: number;
  recent_activity?: Array<{
    id: string;
    action: string;
    timestamp: string;
  }>;
  [key: string]: any;
}