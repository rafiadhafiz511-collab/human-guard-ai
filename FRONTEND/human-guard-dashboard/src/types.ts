export type Detection = {
  id: string;
  image_path: string;
  person: boolean;
  confidence: number;
  alarm: boolean;
  created_at: string;
  device_id: string;
};

export type Device = {
  id: string;
  device_id: string;
  device_name: string;
  status: string;
  firmware_version: string;
  pending_command: string | null;
  command_updated_at: string | null;
  secret_key: string;
  last_seen: string | null;
};