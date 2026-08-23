import { useState, type FormEvent } from "react";
import api from "../api/client";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceAdded: () => void;
}

export default function AddDeviceModal({
  isOpen,
  onClose,
  onDeviceAdded,
}: AddDeviceModalProps) {
  const [deviceName, setDeviceName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceType, setDeviceType] = useState("SMART_DEVICE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!deviceName.trim() || !deviceId.trim()) {
      setError("Device name and Device ID are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/devices/register", {
        device_id: deviceId.trim(),
        device_name: deviceName.trim(),
        device_type: deviceType,
      });

      console.log("[DEVICE] Registered:", response.data);

      onDeviceAdded();

      setDeviceName("");
      setDeviceId("");
      setDeviceType("SMART_DEVICE");

      onClose();
    } catch (error: any) {
      console.error("[DEVICE] Registration failed:", error);

      const message =
        error?.response?.data?.detail ||
        "Failed to register device. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5">
          <h2 className="text-xl font-bold !text-white">
            Add New Device
          </h2>

          <p className="mt-1 text-xs !text-slate-400">
            Register a new IoT device with Human Tech.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* DEVICE NAME */}
          <div>
            <label className="block text-sm font-medium !text-slate-300">
              Device Name
            </label>

            <input
              type="text"
              required
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 !text-white outline-none placeholder:!text-slate-600 focus:border-cyan-400"
              placeholder="Main Water Pump"
            />
          </div>

          {/* DEVICE ID */}
          <div>
            <label className="block text-sm font-medium !text-slate-300">
              Device Unique ID
            </label>

            <input
              type="text"
              required
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono !text-white outline-none placeholder:!text-slate-600 focus:border-cyan-400"
              placeholder="HT-PUMP-005"
            />
          </div>

          {/* DEVICE TYPE */}
          <div>
            <label className="block text-sm font-medium !text-slate-300">
              Device Type
            </label>

            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 !text-white outline-none focus:border-cyan-400"
            >
              <option value="SMART_DEVICE">Smart Device</option>
              <option value="PUMP">Pump</option>
              <option value="LIGHT">Light</option>
              <option value="CAMERA">Camera</option>
            </select>
          </div>

          {/* ERROR */}
          {error && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs !text-rose-300">
              {error}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg bg-slate-700 px-4 py-2 font-medium !text-white transition hover:bg-slate-600 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-cyan-500 px-4 py-2 font-bold !text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Registering..." : "Add Device"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}