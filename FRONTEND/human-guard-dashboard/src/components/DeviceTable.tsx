import { useState } from "react";
import api from "../api/client";

import type { Device } from "../types";

type Props = {
  devices: Device[];
  onRefresh: () => void;
  onDetails?: (device: Device) => void;
};

function getDeviceIcon(
  deviceType: string
): string {
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

function canControlDevice(
  deviceType: string
): boolean {
  return [
    "PUMP",
    "SMART_PUMP",
    "LIGHT",
    "FAN",
    "TV",
    "AC",
    "SMART_PLUG",
  ].includes(
    deviceType?.toUpperCase()
  );
}

function getPowerCommand(
  deviceType: string,
  turnOn: boolean
): string {
  const type = deviceType.toUpperCase();

  if (
    type === "PUMP" ||
    type === "SMART_PUMP"
  ) {
    return turnOn
      ? "PUMP_ON"
      : "PUMP_OFF";
  }

  return `${type}_${turnOn ? "ON" : "OFF"}`;
}

function formatLastSeen(
  lastSeen?: string | null
): string {
  if (!lastSeen) {
    return "Never";
  }

  const date = new Date(lastSeen);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

export default function DeviceTable({
  devices,
  onRefresh,
  onDetails,
}: Props) {
  const [
    sendingCommand,
    setSendingCommand,
  ] = useState<string | null>(null);

  const [
    commandError,
    setCommandError,
  ] = useState<string | null>(null);

  if (
    !Array.isArray(devices) ||
    devices.length === 0
  ) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/40 p-12 text-center backdrop-blur-xl">
        <div className="mb-4 text-5xl opacity-80">
          📱
        </div>

        <h3 className="text-lg font-semibold text-white/80">
          No devices found
        </h3>

        <p className="mt-1 text-sm text-white/40">
          Add your first Human Tech smart home device.
        </p>
      </div>
    );
  }

  async function sendCommand(
    device: Device,
    turnOn: boolean,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation();

    if (device.status !== "ONLINE") {
      return;
    }

    const deviceId = device.device_id;

    const command = getPowerCommand(
      device.device_type,
      turnOn
    );

    try {
      setCommandError(null);
      setSendingCommand(deviceId);

      await api.post(
        `/devices/${deviceId}/command`,
        {
          command,
        }
      );

      await onRefresh();
    } catch (error) {
      console.error(
        `[DEVICES] Command failed for ${deviceId}:`,
        error
      );

      setCommandError(
        `Failed to control ${device.device_name}. Please try again.`
      );
    } finally {
      setSendingCommand(null);
    }
  }

  return (
    <section>

      {/* ====================================================== */}
      {/* SECTION HEADER */}
      {/* ====================================================== */}

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white/90">
            Smart Home Devices
          </h2>

          <p className="mt-0.5 text-sm text-white/40">
            Monitor and control your connected devices.
          </p>
        </div>

        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          {devices.length}{" "}
          {devices.length === 1
            ? "device"
            : "devices"}
        </span>
      </div>

      {/* ====================================================== */}
      {/* COMMAND ERROR */}
      {/* ====================================================== */}

      {commandError && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
          <p className="text-xs text-rose-300">
            {commandError}
          </p>

          <button
            type="button"
            onClick={() =>
              setCommandError(null)
            }
            className="text-xs font-bold text-rose-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ====================================================== */}
      {/* DEVICE GRID */}
      {/* ====================================================== */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

        {devices.map((device) => {
          const deviceType =
            device.device_type?.toUpperCase() ||
            "DEVICE";

          const icon =
            getDeviceIcon(deviceType);

          const isOnline =
            device.status === "ONLINE";

          const canControl =
            canControlDevice(deviceType);

          const isSending =
            sendingCommand === device.device_id;

          const isOn =
            device.state === "ON";

          return (
            <article
              key={
                device.id ||
                device.device_id
              }
              onClick={() =>
                onDetails?.(device)
              }
              className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-5 backdrop-blur-xl transition-all shadow-2xl ${
                isOn && isOnline
                  ? "border-cyan-500/20 bg-cyan-950/10 hover:border-cyan-400/30"
                  : "border-white/10 bg-black/40 hover:border-white/20 hover:bg-black/50"
              } ${
                onDetails
                  ? "cursor-pointer"
                  : ""
              }`}
            >

              {/* ================================================== */}
              {/* DEVICE HEADER */}
              {/* ================================================== */}

              <div>

                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-center gap-3.5">

                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition-all ${
                        isOn && isOnline
                          ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                          : "bg-white/5 text-white/40"
                      }`}
                    >
                      {icon}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-base text-white/90 transition-colors group-hover:text-cyan-400">
                        {device.device_name}
                      </h3>

                      <p className="mt-0.5 truncate font-mono text-xs text-cyan-400/70">
                        {device.device_id}
                      </p>

                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                        {deviceType}
                      </p>
                    </div>

                  </div>

                  {/* STATUS */}

                  <div className="flex shrink-0 items-center gap-1.5">

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isOnline
                          ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                          : "bg-rose-500/70"
                      }`}
                    />

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isOnline
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {device.status}
                    </span>

                  </div>

                </div>

                {/* ================================================== */}
                {/* ACTIVE BAR */}
                {/* ================================================== */}

                <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isOn && isOnline
                        ? "w-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_#06b6d4]"
                        : "w-0"
                    }`}
                  />
                </div>

                {/* ================================================== */}
                {/* DEVICE INFO */}
                {/* ================================================== */}

                <div className="mt-5 space-y-2 border-t border-white/5 pt-4">

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-white/35">
                      Location
                    </span>

                    <span className="truncate text-right text-xs font-medium text-white/70">
                      {device.home_id ||
                        "Unassigned"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-white/35">
                      Firmware
                    </span>

                    <span className="font-mono text-xs text-white/60">
                      {device.firmware_version ||
                        "Unknown"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-white/35">
                      Last Seen
                    </span>

                    <span className="truncate text-right text-xs text-white/60">
                      {formatLastSeen(
                        device.last_seen
                      )}
                    </span>
                  </div>

                </div>

              </div>

              {/* ================================================== */}
              {/* CONTROLS */}
              {/* ================================================== */}

              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                    Device State
                  </p>

                  <p
                    className={`mt-0.5 text-xs font-bold ${
                      isOn && isOnline
                        ? "text-cyan-300"
                        : "text-white/40"
                    }`}
                  >
                    {isSending
                      ? "Updating..."
                      : !isOnline
                      ? "Offline"
                      : isOn
                      ? "Active"
                      : "Off"}
                  </p>
                </div>

                {canControl && isOnline ? (
                  <button
                    type="button"
                    disabled={isSending}
                    aria-label={
                      isOn
                        ? `Turn off ${device.device_name}`
                        : `Turn on ${device.device_name}`
                    }
                    aria-pressed={isOn}
                    onClick={(event) =>
                      void sendCommand(
                        device,
                        !isOn,
                        event
                      )
                    }
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
                      isSending
                        ? "cursor-wait opacity-60"
                        : isOn
                        ? "bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                        isOn
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                ) : (
                  <span className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/20">
                    {!isOnline
                      ? "Offline"
                      : "Read Only"}
                  </span>
                )}

              </div>

            </article>
          );
        })}

      </div>
    </section>
  );
}