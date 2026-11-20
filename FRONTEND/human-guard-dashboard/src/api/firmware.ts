import api from "./client";

export interface OTARequest {
  firmware_id: number;
}

export async function requestDeviceOTA(
  deviceId: string,
  firmwareId: number,
) {
  const response = await api.post(
    `/devices/${deviceId}/ota`,
    {
      firmware_id: firmwareId,
    },
  );

  return response.data;
}
