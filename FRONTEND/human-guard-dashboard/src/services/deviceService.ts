import { getDevices, apiRequest } from './api';
import type { Device } from '../components/DeviceCard';

export interface CreateDevicePayload {
  name: string;
  device_id: string;
  type: string;
  home_id: string;
}

export { getDevices };

export const addDevice = async (deviceData: CreateDevicePayload): Promise<Device> => {
  return apiRequest<Device>('/devices', {
    method: 'POST',
    body: JSON.stringify(deviceData),
  });
};