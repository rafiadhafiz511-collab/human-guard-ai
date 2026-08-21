import { useState } from "react";
import api from "../api/client";
import type { Device } from "../types";

type Props = {
  devices: Device[];
  onRefresh: () => void;
  onDetails?: (device: Device) => void;
};

function getDeviceIcon(deviceType: string) {
  switch (deviceType?.toUpperCase()) {
    case "LIGHT":
      return "💡";
    case "FAN":
      return "🌀";
    case "PUMP":
    case "SMART_PUMP":
      return "💧";
    case "TV":
      return "📺";
    case "AC":
      return "❄️";
    case "SMART_PLUG":
      return "🔌";
    case "CAMERA":
      return "📹";
    default:
      return "📱";
  }
}

function canControlDevice(deviceType: string) {
  return [
    "PUMP",
    "SMART_PUMP",
    "LIGHT",
    "FAN",
    "TV",
    "AC",
    "SMART_PLUG",
  ].includes(deviceType?.toUpperCase());
}

function getPowerCommand(deviceType: string, turnOn: boolean) {
  const type = deviceType.toUpperCase();
  if (type === "PUMP" || type === "SMART_PUMP") {
    return turnOn ? "PUMP_ON" : "PUMP_OFF";
  }
  return `${type}_${turnOn ? "ON" : "OFF"}`;
}

export default function DeviceTable({ devices, onRefresh, onDetails }: Props) {
  const [sendingCommand, setSendingCommand] = useState<string | null>(null);

  if (!Array.isArray(devices) || devices.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/40 p-12 text-center backdrop-blur-xl">
        <div className="mb-4 text-5xl opacity-80">📱</div>
        <h3 className="text-lg font-semibold text-white/80">
          No devices found
        </h3>
        <p className="mt-1 text-sm text-white/40">
          Add your first Human Tech smart home device.
        </p>
      </div>
    );
  }

  async function sendCommand(device: Device, turnOn: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    const deviceId = device.device_id;
    const command = getPowerCommand(device.device_type, turnOn);

    try {
      setSendingCommand(deviceId);
      await api.post(`/devices/${deviceId}/command`, { command });
      await onRefresh();
    } catch (error) {
      console.error(`Command failed for ${deviceId}:`, error);
    } finally {
      setSendingCommand(null);
    }
  }

  return (
    <div>
      {/* SECTION HEADER */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white/90">Smart Home Devices</h2>
          <p className="mt-0.5 text-sm text-white/40">
            Control and monitor your connected devices.
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          {devices.length} {devices.length === 1 ? "device" : "devices"}
        </span>
      </div>

      {/* DEVICE GRID */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => {
          const deviceType = device.device_type?.toUpperCase() || "DEVICE";
          const icon = getDeviceIcon(deviceType);
          const isOnline = device.status?.toLowerCase() === "online";
          const canControl = canControlDevice(deviceType);
          const isSending = sendingCommand === device.device_id;
          const isOn = device.state?.toUpperCase() === "ON";

          return (
            <article
              key={device.id || device.device_id}
              onClick={() => onDetails?.(device)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-black/50 shadow-2xl cursor-pointer"
            >
              {/* TOP CONTAINER: ICON, NAME, STATUS */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    {/* AMBIENT GLOW ICON */}
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-all ${
                        isOn && isOnline
                          ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                          : "bg-white/5 text-white/40"
                      }`}
                    >
                      {icon}
                    </div>

                    <div>
                      <h3 className="font-bold text-white/90 text-base group-hover:text-cyan-400 transition-colors">
                        {device.device_name}
                      </h3>
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">
                        {device.device_type}
                      </p>
                    </div>
                  </div>

                  {/* ONLINE STATUS BADGE */}
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isOnline
                        ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                        : "bg-rose-500/50"
                    }`}
                  />
                </div>

                {/* AMBIENT INDICATOR BAR */}
                <div className="mt-5">
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isOn && isOnline
                          ? "w-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_#06b6d4]"
                          : "w-0"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* BOTTOM CONTROLS / SWITCH */}
              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  {isSending
                    ? "Updating..."
                    : !isOnline
                    ? "Offline"
                    : isOn
                    ? "Active"
                    : "Off"}
                </span>

                {canControl && isOnline ? (
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={(e) => sendCommand(device, !isOn, e)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                      isOn ? "bg-cyan-500" : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                        isOn ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                ) : (
                  <span className="text-xs text-white/20">Read Only</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}