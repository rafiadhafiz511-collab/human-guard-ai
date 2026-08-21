// ============================================================
// ১. ডিভাইস সংক্রান্ত টাইপ (Device & Hardware)
// ============================================================

export type DeviceType = "SMART_PUMP" | "PUMP" | "CAMERA" | "SENSOR" | "RELAY";

export type DeviceState = "ON" | "OFF";

// কেস-সেন্সিটিভিটি এরর এড়াতে স্মল ও ক্যাপিটাল উভয় কেস রাখা হয়েছে
export type DeviceStatus = "online" | "offline" | "ONLINE" | "OFFLINE";

export interface Device {
  id?: string;
  device_id: string;
  device_name: string;
  device_type: DeviceType;
  status: DeviceStatus;
  state?: DeviceState;
  ip_address?: string;
  mac_address?: string;
  last_seen?: string;
  created_at?: string;
}

// ============================================================
// ২. অটোমেশন রুল সংক্রান্ত টাইপ (Automation Rules)
// ============================================================

export type SensorType = 
  | "SOIL_MOISTURE" 
  | "TEMPERATURE" 
  | "HUMIDITY" 
  | "WATER_LEVEL" 
  | (string & {}); // Flexible String Intellisense

export type RuleOperator = "<" | ">" | "==" | "<=" | ">=" | "!=";

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
  created_at?: string;
}

// ============================================================
// ৩. ডিটেকশন সংক্রান্ত টাইপ (Camera / AI Detections)
// ============================================================

export interface Detection {
  id: string;
  device_id?: string;
  label: string;
  confidence: number;
  image_url?: string;
  snapshot?: string; // বিকল্প ফিল্ড (Base64 বা Image path-এর জন্য)
  detected_at: string;
  created_at?: string;
}

// ============================================================
// ৪. ইউজার ও অথেনটিকেশন টাইপ (User & Auth Profile)
// ============================================================

export type UserRole = "ADMIN" | "USER" | "OPERATOR" | string;

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: UserRole;
  fcm_token?: string; // নোটিফিকেশনের জন্য
  created_at?: string;
}

// ============================================================
// ৫. সকেট ও টেলিমোট্রি পেলোড (Live MQTT / WS Payloads)
// ============================================================

export interface TelemetryPayload {
  device_id: string;
  state?: DeviceState;
  data: Record<string, number | string | boolean>;
  timestamp: string;
}