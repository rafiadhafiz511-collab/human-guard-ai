import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import api from "../api/client";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceAdded: () => void;
}

type DeviceTypeOption =
  | "SMART_DEVICE"
  | "PUMP"
  | "SMART_PUMP"
  | "LIGHT"
  | "CAMERA"
  | "FAN";

export default function AddDeviceModal({
  isOpen,
  onClose,
  onDeviceAdded,
}: AddDeviceModalProps) {
  const [deviceName, setDeviceName] =
    useState("");

  const [deviceId, setDeviceId] =
    useState("");

  const [deviceType, setDeviceType] =
    useState<DeviceTypeOption>(
      "SMART_DEVICE"
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ============================================================
  // RESET FORM
  // ============================================================

  useEffect(() => {
    if (!isOpen) {
      setError("");
      setLoading(false);
    }
  }, [isOpen]);

  // ============================================================
  // CLOSE
  // ============================================================

  function handleClose() {
    if (loading) {
      return;
    }

    setError("");
    onClose();
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName =
      deviceName.trim();

    const trimmedDeviceId =
      deviceId.trim();

    if (!trimmedName) {
      setError(
        "Device name is required."
      );
      return;
    }

    if (!trimmedDeviceId) {
      setError(
        "Device ID is required."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await api.post(
          "/devices/register",
          {
            device_id: trimmedDeviceId,
            device_name: trimmedName,
            device_type: deviceType,
          }
        );

      console.log(
        "[DEVICE] Registered successfully:",
        response.data
      );

      setDeviceName("");
      setDeviceId("");
      setDeviceType(
        "SMART_DEVICE"
      );

      onDeviceAdded();
      onClose();
    } catch (error: unknown) {
      console.error(
        "[DEVICE] Registration failed:",
        error
      );

      const axiosError =
        error as {
          response?: {
            data?: {
              detail?: string;
              message?: string;
            };
          };
        };

      const serverMessage =
        axiosError.response?.data
          ?.detail ||
        axiosError.response?.data
          ?.message;

      setError(
        serverMessage ||
          "Failed to register device. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-device-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">

        {/* ==================================================== */}
        {/* HEADER */}
        {/* ==================================================== */}

        <div className="border-b border-white/10 px-6 py-5">

          <div className="flex items-start justify-between gap-4">

            <div>
              <h2
                id="add-device-title"
                className="text-xl font-black text-white"
              >
                Add New Device
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Register a Human Tech IoT device.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              aria-label="Close dialog"
              className="rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              ✕
            </button>

          </div>

        </div>

        {/* ==================================================== */}
        {/* FORM */}
        {/* ==================================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >

          {/* DEVICE NAME */}

          <div>
            <label
              htmlFor="device-name"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300"
            >
              Device Name
            </label>

            <input
              id="device-name"
              type="text"
              autoComplete="off"
              required
              value={deviceName}
              onChange={(event) =>
                setDeviceName(
                  event.target.value
                )
              }
              disabled={loading}
              placeholder="Main Water Pump"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* DEVICE ID */}

          <div>
            <label
              htmlFor="device-id"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300"
            >
              Device Unique ID
            </label>

            <input
              id="device-id"
              type="text"
              autoComplete="off"
              required
              value={deviceId}
              onChange={(event) =>
                setDeviceId(
                  event.target.value
                )
              }
              disabled={loading}
              placeholder="HT-PUMP-005"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-mono text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <p className="mt-1.5 text-[10px] text-slate-500">
              Enter the unique ID programmed into the device.
            </p>
          </div>

          {/* DEVICE TYPE */}

          <div>
            <label
              htmlFor="device-type"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300"
            >
              Device Type
            </label>

            <select
              id="device-type"
              value={deviceType}
              onChange={(event) =>
                setDeviceType(
                  event.target
                    .value as DeviceTypeOption
                )
              }
              disabled={loading}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="SMART_DEVICE">
                Smart Device
              </option>

              <option value="PUMP">
                Pump
              </option>

              <option value="SMART_PUMP">
                Smart Pump
              </option>

              <option value="LIGHT">
                Light
              </option>

              <option value="CAMERA">
                Camera
              </option>

              <option value="FAN">
                Fan
              </option>
            </select>
          </div>

          {/* ERROR */}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300"
            >
              {error}
            </div>
          )}

          {/* ACTIONS */}

          <div className="flex justify-end gap-3 border-t border-white/5 pt-5">

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !deviceName.trim() ||
                !deviceId.trim()
              }
              className="rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Registering..."
                : "Add Device"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}