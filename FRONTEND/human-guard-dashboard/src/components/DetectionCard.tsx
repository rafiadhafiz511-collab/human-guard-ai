import { useState } from "react";
import api from "../api/client";
import type { Device } from "../types";

type Props = {
  device: Device;
  onRefresh: () => void;
  onDetails?: (device: Device) => void;
};

export default function DashboardDeviceCard({
  device,
  onRefresh,
  onDetails,
}: Props) {
  const [loading, setLoading] = useState(false);

  const isOnline = device.status?.toLowerCase() === "online";
  const isPump =
    device.device_type === "PUMP" || device.device_type === "SMART_PUMP";
  const isStateOn = device.state?.toUpperCase() === "ON";

  async function sendToggleCommand(e: React.MouseEvent) {
    e.stopPropagation();

    if (loading || !isOnline) return;

    const command = isPump
      ? isStateOn
        ? "PUMP_OFF"
        : "PUMP_ON"
      : isStateOn
      ? "OFF"
      : "ON";

    setLoading(true);

    try {
      await api.post(`/devices/${device.device_id}/command`, { command });
      onRefresh();
    } catch (error) {
      console.error("Device command error:", error);
    } finally {
      setLoading(false);
    }
  }

  const getDeviceIcon = () => {
    if (isPump) return "💧";
    if (device.device_type === "CAMERA") return "📷";
    if (device.device_type === "SENSOR") return "📊";
    return "💡";
  };

  return (
    <div
      onClick={() => onDetails?.(device)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-black/50 shadow-2xl cursor-pointer"
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-all ${
                isStateOn
                  ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  : "bg-white/5 text-white/50"
              }`}
            >
              {getDeviceIcon()}
            </div>

            <div>
              <h3 className="font-bold text-white/90 text-base group-hover:text-cyan-400 transition-colors">
                {device.device_name}
              </h3>
              <p className="text-xs font-semibold text-white/40 capitalize">
                {isStateOn ? "Active" : "Off"}
              </p>
            </div>
          </div>

          <span
            className={`flex h-2.5 w-2.5 rounded-full ${
              isOnline
                ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                : "bg-rose-500/50"
            }`}
            title={isOnline ? "Online" : "Offline"}
          />
        </div>

        <div className="mt-5">
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isStateOn
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_#06b6d4]"
                  : "w-0"
              }`}
              style={{ width: isStateOn ? "100%" : "0%" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
        <span className="text-xs font-medium text-white/40">Power Control</span>

        <button
          type="button"
          disabled={loading || !isOnline}
          onClick={sendToggleCommand}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
            isStateOn ? "bg-cyan-500" : "bg-white/10"
          } ${(!isOnline || loading) && "opacity-50 cursor-not-allowed"}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
              isStateOn ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}