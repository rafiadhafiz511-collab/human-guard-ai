import { useEffect, useState } from "react";

import type { Device } from "../types";
import { requestDeviceOTA } from "../api/firmware";
import {
  assignDeviceToRoom,
  getHomeRooms,
  removeDeviceFromRoom,
  type Room,
} from "../api/rooms";

type Props = {
  device: Device | null;
  onClose: () => void;
  onUpdated?: () => void | Promise<void>;
};

function getDeviceLabel(deviceType: string) {
  switch (deviceType?.toUpperCase()) {
    case "SMART_PUMP":
      return "Smart Pump";

    case "SMART_PLUG":
      return "Smart Plug";

    case "CAMERA":
      return "Security Camera";

    default:
      return deviceType || "Device";
  }
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function DeviceDetailsDrawer({
  device,
  onClose,
  onUpdated,
}: Props) {
  const [firmwareId, setFirmwareId] = useState("");
  const [otaLoading, setOtaLoading] = useState(false);
  const [otaMessage, setOtaMessage] = useState("");
  const [otaError, setOtaError] = useState("");

  // Room Assignment states
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomMessage, setRoomMessage] = useState("");
  const [roomError, setRoomError] = useState("");

  useEffect(() => {
    if (!device) {
      return;
    }

    const initialRoomId = device.room_id ?? null;
    setActiveRoomId(initialRoomId);
    setSelectedRoomId(initialRoomId ?? "");
    setRoomMessage("");
    setRoomError("");

    const homeId = device.home_id || localStorage.getItem("current_home_id") || "";
    if (!homeId) {
      setRooms([]);
      return;
    }

    let cancelled = false;

    async function loadRooms() {
      try {
        setRoomsLoading(true);
        const data = await getHomeRooms(homeId);
        if (!cancelled) {
          setRooms(data);
        }
      } catch (error: any) {
        if (!cancelled) {
          setRoomError(
            error?.response?.data?.detail ||
              error?.message ||
              "Failed to load rooms."
          );
        }
      } finally {
        if (!cancelled) {
          setRoomsLoading(false);
        }
      }
    }

    loadRooms();

    return () => {
      cancelled = true;
    };
  }, [device]);

  if (!device) {
    return null;
  }

  const currentDevice = device;
  const effectiveHomeId =
    currentDevice.home_id || localStorage.getItem("current_home_id") || "home-1";

  const currentRoomName =
    rooms.find((r) => r.id === activeRoomId)?.name ||
    (activeRoomId ? activeRoomId : "Unassigned");

  async function handleSaveRoom() {
    setRoomMessage("");
    setRoomError("");

    try {
      setRoomSaving(true);

      if (!selectedRoomId) {
        if (!activeRoomId) {
          setRoomMessage("Device is already unassigned.");
          return;
        }

        const res = await removeDeviceFromRoom(
          effectiveHomeId,
          activeRoomId,
          currentDevice.device_id
        );
        setActiveRoomId(null);
        setSelectedRoomId("");
        setRoomMessage(res?.message || "Device removed from room.");
      } else {
        const res = await assignDeviceToRoom(
          effectiveHomeId,
          selectedRoomId,
          currentDevice.device_id
        );
        setActiveRoomId(selectedRoomId);
        setRoomMessage(res?.message || "Device assigned to room successfully.");
      }

      await onUpdated?.();
    } catch (error: any) {
      setRoomError(
        error?.response?.data?.detail ||
          error?.message ||
          "Failed to update room assignment."
      );
    } finally {
      setRoomSaving(false);
    }
  }

  async function handleOTAUpdate() {
    setOtaMessage("");
    setOtaError("");

    if (!firmwareId.trim()) {
      setOtaError("Firmware ID is required");
      return;
    }

    const parsedFirmwareId = Number(firmwareId);

    if (!Number.isInteger(parsedFirmwareId)) {
      setOtaError("Firmware ID must be a number");
      return;
    }

    try {
      setOtaLoading(true);

      const response = await requestDeviceOTA(
        currentDevice.device_id,
        parsedFirmwareId,
      );

      setOtaMessage(
        response?.message || "OTA update request sent successfully.",
      );
    } catch (error: any) {
      setOtaError(
        error?.response?.data?.detail ||
          error?.message ||
          "OTA update request failed.",
      );
    } finally {
      setOtaLoading(false);
    }
  }

  const isOnline =
    currentDevice.status?.toLowerCase() === "online";

  const isOn =
    currentDevice.state?.toUpperCase() === "ON";

  const deviceLabel = getDeviceLabel(
    currentDevice.device_type
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {/* =====================================================
          DRAWER
      ====================================================== */}
      <aside
        className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* ===================================================
            HEADER
        ==================================================== */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
              Device Details
            </p>

            <h2 className="mt-1 truncate text-xl font-bold text-slate-900">
              {currentDevice.device_name}
            </h2>

            <p className="mt-0.5 text-sm text-slate-500">
              {deviceLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close device details"
            className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            ×
          </button>
        </div>

        {/* ===================================================
            CONTENT
        ==================================================== */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* =================================================
              STATUS
          ================================================== */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Connection Status
                </p>

                <p
                  className={
                    isOnline
                      ? "mt-1 text-lg font-bold text-green-600"
                      : "mt-1 text-lg font-bold text-red-600"
                  }
                >
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>

              <span
                className={
                  isOnline
                    ? "relative flex h-4 w-4"
                    : "flex h-4 w-4 rounded-full bg-red-500"
                }
              >
                {isOnline && (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />

                    <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500" />
                  </>
                )}
              </span>
            </div>
          </section>

          {/* =================================================
              POWER
          ================================================== */}
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current Power
                </p>

                <p
                  className={
                    isOn
                      ? "mt-1 text-2xl font-bold text-green-600"
                      : "mt-1 text-2xl font-bold text-slate-400"
                  }
                >
                  {isOn ? "ON" : "OFF"}
                </p>
              </div>

              <span
                className={
                  isOn
                    ? "rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700"
                    : "rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500"
                }
              >
                {isOn ? "Running" : "Stopped"}
              </span>
            </div>
          </section>

          {/* =================================================
              DEVICE INFORMATION
          ================================================== */}
          <section className="mt-6">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Device Information
            </h3>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="space-y-4 text-sm">
                {/* Device ID */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">
                    Device ID
                  </span>

                  <span className="max-w-[210px] break-all text-right font-mono text-xs font-semibold text-slate-800">
                    {currentDevice.device_id}
                  </span>
                </div>

                {/* Type */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">
                    Type
                  </span>

                  <span className="font-semibold text-slate-800">
                    {deviceLabel}
                  </span>
                </div>

                {/* Firmware */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">
                    Firmware
                  </span>

                  <span className="font-mono text-xs font-semibold text-slate-800">
                    {currentDevice.firmware_version || "Unknown"}
                  </span>
                </div>

                {/* Home */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">
                    Home
                  </span>

                  <span className="font-mono text-xs text-slate-700">
                    {currentDevice.home_id || "Not assigned"}
                  </span>
                </div>

                {/* Room */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">
                    Room
                  </span>

                  <span className="text-xs font-semibold text-slate-800">
                    {currentRoomName}
                  </span>
                </div>

                {/* Last Seen */}
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">
                    Last Seen
                  </span>

                  <span className="max-w-[210px] text-right text-xs text-slate-700">
                    {formatDate(currentDevice.last_seen)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              ROOM ASSIGNMENT
          ================================================== */}
          <section className="mt-6">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Room Assignment
            </h3>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-800">
                  Assign to Room
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Choose a room for this device or leave unassigned.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Select Room
                  </label>

                  <select
                    value={selectedRoomId}
                    disabled={roomsLoading || roomSaving}
                    onChange={(event) => {
                      setSelectedRoomId(event.target.value);
                      setRoomMessage("");
                      setRoomError("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                  >
                    <option value="">— No Room (Unassigned) —</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSaveRoom}
                  disabled={
                    roomSaving ||
                    roomsLoading ||
                    selectedRoomId === (activeRoomId ?? "")
                  }
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {roomSaving ? "Saving Room..." : "Save Room"}
                </button>

                {roomMessage && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-xs font-medium text-green-700">
                    {roomMessage}
                  </div>
                )}

                {roomError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
                    {roomError}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =================================================
              OTA FIRMWARE UPDATE
          ================================================== */}
          <section className="mt-6">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Firmware Update
            </h3>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-800">
                  OTA Update
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Send a firmware update request to this device.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Firmware ID
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={firmwareId}
                    onChange={(event) => {
                      setFirmwareId(event.target.value);
                      setOtaMessage("");
                      setOtaError("");
                    }}
                    placeholder="Example: 1"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOTAUpdate}
                  disabled={otaLoading}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {otaLoading ? "Sending OTA Request..." : "Request Firmware Update"}
                </button>

                {otaMessage && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-xs font-medium text-green-700">
                    {otaMessage}
                  </div>
                )}

                {otaError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
                    {otaError}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =================================================
              COMMAND STATUS
          ================================================== */}
          <section className="mt-6">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Command Status
            </h3>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="space-y-4 text-sm">
                {/* Pending command */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">
                    Pending Command
                  </span>

                  <span
                    className={
                      currentDevice.pending_command
                        ? "rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700"
                        : "rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"
                    }
                  >
                    {currentDevice.pending_command || "None"}
                  </span>
                </div>

                {/* Command updated */}
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">
                    Updated
                  </span>

                  <span className="max-w-[210px] text-right text-xs text-slate-700">
                    {formatDate(currentDevice.command_updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              AUTOMATION STATUS
          ================================================== */}
          <section className="mt-6">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Automation
            </h3>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Automation
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Automatic device control
                </p>
              </div>

              <span
                className={
                  currentDevice.is_auto
                    ? "rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
                    : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
                }
              >
                {currentDevice.is_auto ? "Enabled" : "Disabled"}
              </span>
            </div>
          </section>
        </div>

        {/* ===================================================
            FOOTER
        ==================================================== */}
        <div className="border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}