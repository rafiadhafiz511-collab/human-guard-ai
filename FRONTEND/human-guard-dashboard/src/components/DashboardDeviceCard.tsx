import { useEffect, useState } from "react";
import api from "../api/client";
import type { Device } from "../types";
import { RoomLightControl } from "./RoomLightControl";

interface Props {
  device: Device;
  onRefresh: () => void;
  onDetails: (device: Device) => void;
}

const ROOM_LIGHT_CHANNEL_ID = "f3497fc706a64884acf5ef7d50dc93ed";

export default function DashboardDeviceCard({
  device,
  onRefresh,
  onDetails,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [queuedCommand, setQueuedCommand] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  const isOnline = device.status?.toLowerCase() === "online";
  const isPump =
    device.device_type === "PUMP" || device.device_type === "SMART_PUMP";
  const isRoomLightS3 = device.device_id === "ESP32S3_01";
  const isPumpOn = device.state?.toUpperCase() === "ON";

  useEffect(() => {
    if (queuedCommand === "PUMP_ON" && isPumpOn) {
      setQueuedCommand(null);
      setFeedback("Pump is ON (ACK received)");
    } else if (queuedCommand === "PUMP_OFF" && !isPumpOn) {
      setQueuedCommand(null);
      setFeedback("Pump is OFF (ACK received)");
    }
  }, [isPumpOn, queuedCommand]);

  async function sendPumpCommand(
    command: "PUMP_ON" | "PUMP_OFF",
    e: React.MouseEvent
  ) {
    e.stopPropagation();

    if (loading) {
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      await api.post(`/devices/${device.device_id}/command`, { command });
      setQueuedCommand(command);
      setFeedback(
        isOnline
          ? `${command} queued — waiting for device ACK`
          : `${command} queued (device offline — will run on next heartbeat)`
      );
      onRefresh();
    } catch (error: any) {
      console.error("Pump command error:", error);
      setFeedback(
        error?.response?.data?.detail || "Failed to queue command"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={() => onDetails(device)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-black/50 shadow-2xl cursor-pointer"
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isOnline ? "bg-emerald-400" : "bg-rose-500"
              }`}
            />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/40">
                {device.device_type}
              </div>
              <h3 className="text-base font-semibold text-white">
                {device.device_name || device.device_id}
              </h3>
            </div>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              isOnline
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-rose-500/15 text-rose-300"
            }`}
          >
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        <div className="mt-4 space-y-1.5 text-xs text-white/70">
          <div className="flex justify-between">
            <span className="text-white/40">Device ID</span>
            <span>{device.device_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">State</span>
            <strong className={isPumpOn ? "text-cyan-300" : "text-white/70"}>
              {isPumpOn ? "ON" : "OFF"}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Firmware</span>
            <span>{device.firmware_version || "1.0.0"}</span>
          </div>
        </div>

        {(queuedCommand || feedback) && (
          <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-[11px] text-cyan-200">
            {feedback || `${queuedCommand} pending ACK...`}
          </div>
        )}

        {isRoomLightS3 && (
          <div className="mt-4" onClick={(e) => e.stopPropagation()}>
            <RoomLightControl
              deviceId={device.device_id}
              channelId={ROOM_LIGHT_CHANNEL_ID}
              label={device.device_name || "Room Light S3"}
            />
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
        <span className="text-xs font-medium text-white/40">Power</span>

        {isPump ? (
          <button
            type="button"
            disabled={loading}
            onClick={(e) =>
              sendPumpCommand(isPumpOn ? "PUMP_OFF" : "PUMP_ON", e)
            }
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
              isPumpOn
                ? "bg-amber-400 text-black hover:bg-amber-300"
                : "bg-cyan-500 text-black hover:bg-cyan-400"
            }`}
          >
            {loading
              ? "Sending..."
              : queuedCommand
              ? "Pending ACK"
              : isPumpOn
              ? "POWER OFF"
              : "POWER ON"}
          </button>
        ) : (
          <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/40">
            {isOnline ? "READY" : "DISABLED"}
          </span>
        )}
      </div>
    </div>
  );
}
