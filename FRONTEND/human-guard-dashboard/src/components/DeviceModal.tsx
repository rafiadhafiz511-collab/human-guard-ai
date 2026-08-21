import { useState } from "react";
import api from "../api/client";

type Props = {
  onClose: () => void;
  onDeviceAdded: () => void;
};

const DEVICE_TYPES = [
  { value: "PUMP", label: "💧 Pump" },
  { value: "LIGHT", label: "💡 Light" },
  { value: "FAN", label: "🌀 Fan" },
  { value: "TV", label: "📺 TV" },
  { value: "AC", label: "❄️ AC" },
  { value: "SMART_PLUG", label: "🔌 Smart Plug" },
  { value: "CAMERA", label: "📹 Camera" },
];

export default function DeviceModal({
  onClose,
  onDeviceAdded,
}: Props) {
  const [deviceName, setDeviceName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceType, setDeviceType] = useState("LIGHT");

 async function handleSubmit(event: React.FormEvent) {
  event.preventDefault();

  if (!deviceName.trim() || !deviceId.trim()) {
    alert("Device Name এবং Device ID দিন");
    return;
  }

  try {
    await api.post("/devices/register", {
      device_id: deviceId.trim(),
      device_name: deviceName.trim(),
      device_type: deviceType,
    });

    alert("Device successfully added");

    onDeviceAdded();
    onClose();

  } catch (error) {
    console.error("Device registration error:", error);

    alert("Device add করা যায়নি");
  }
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b p-6">

          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Add Device
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a new Human Tech device
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-slate-400 hover:text-slate-700"
          >
            ×
          </button>

        </div>


        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >

          {/* Device Name */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Device Name
            </label>

            <input
              type="text"
              value={deviceName}
              onChange={(event) =>
                setDeviceName(event.target.value)
              }
              placeholder="Example: Living Room Light"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>


          {/* Device ID */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Device ID
            </label>

            <input
              type="text"
              value={deviceId}
              onChange={(event) =>
                setDeviceId(event.target.value.toUpperCase())
              }
              placeholder="Example: LIGHT001"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>


          {/* Device Type */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Device Type
            </label>

            <select
              value={deviceType}
              onChange={(event) =>
                setDeviceType(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >

              {DEVICE_TYPES.map((type) => (
                <option
                  key={type.value}
                  value={type.value}
                >
                  {type.label}
                </option>
              ))}

            </select>

          </div>


          {/* Buttons */}

          <div className="flex gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
            >
              Add Device
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}