import { useEffect, useState } from "react";
import api from "../api/client";

type ApiDevice = {
  id: string;
  device_id: string;
  device_name: string;
  status: string;
  device_type: string;
  state: string;
  last_seen: string | null;
  firmware_version: string;
  home_id: string | null;
};

type Device = {
  id: string;
  name: string;
  deviceCode: string;
  type: "PUMP" | "LIGHT" | "CAMERA" | "SMART_DEVICE";
  location: string;
  status: "ONLINE" | "OFFLINE";
  rssi: string;
  powerDraw: string;
  state: boolean;
};

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  // ============================================================
  // LOAD DEVICES FROM BACKEND
  // ============================================================

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<ApiDevice[]>("/devices/");

      const mappedDevices: Device[] = response.data.map((device) => ({
        id: device.id,
        name: device.device_name,
        deviceCode: device.device_id,
        type: normalizeDeviceType(device.device_type),
        location: device.home_id || "Unassigned",
        status:
          device.status?.toLowerCase() === "online"
            ? "ONLINE"
            : "OFFLINE",
        rssi: "N/A",
        powerDraw: "N/A",
        state:
          device.state?.toUpperCase() === "ON",
      }));

      setDevices(mappedDevices);
    } catch (err) {
      console.error("[DEVICES] Failed to load devices:", err);
      setError("Failed to load devices from server.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadDevices();
  }, []);

  // ============================================================
  // DEVICE TYPE NORMALIZER
  // ============================================================

  function normalizeDeviceType(
    type: string
  ): "PUMP" | "LIGHT" | "CAMERA" | "SMART_DEVICE" {
    const normalized = type?.toUpperCase();

    if (normalized === "PUMP") return "PUMP";
    if (normalized === "LIGHT") return "LIGHT";
    if (normalized === "CAMERA") return "CAMERA";

    return "SMART_DEVICE";
  }

  // ============================================================
  // FILTER
  // ============================================================

  const filteredDevices = devices.filter((dev) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      dev.name.toLowerCase().includes(search) ||
      dev.deviceCode.toLowerCase().includes(search);

    const matchesType =
      filterType === "ALL" || dev.type === filterType;

    return matchesSearch && matchesType;
  });

  // ============================================================
  // TOGGLE DEVICE
  // ============================================================

  const toggleDevice = async (device: Device) => {
    if (device.status === "OFFLINE") {
      return;
    }

    try {
      const command = device.state ? "POWER_OFF" : "POWER_ON";

      await api.post(
        `/devices/${device.deviceCode}/command`,
        {
          command,
        }
      );

      setDevices((prev) =>
        prev.map((dev) =>
          dev.id === device.id
            ? {
                ...dev,
                state: !dev.state,
              }
            : dev
        )
      );
    } catch (err) {
      console.error(
        "[DEVICES] Failed to send command:",
        err
      );
    }
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl font-black tracking-wide text-white">
            Device Management Terminal
          </h1>

          <p className="mt-1 text-xs text-white/50">
            Provision, monitor, and control enterprise IoT hardware
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <input
            type="text"
            placeholder="Search by name or device ID..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs text-white placeholder-white/40 backdrop-blur-xl outline-none focus:border-cyan-400 sm:w-64"
          />

          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value)
            }
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs text-white backdrop-blur-xl outline-none focus:border-cyan-400"
          >
            <option
              value="ALL"
              className="bg-slate-900"
            >
              All Hardware Types
            </option>

            <option
              value="PUMP"
              className="bg-slate-900"
            >
              Pumps
            </option>

            <option
              value="LIGHT"
              className="bg-slate-900"
            >
              Lights
            </option>

            <option
              value="CAMERA"
              className="bg-slate-900"
            >
              Cameras
            </option>

            <option
              value="SMART_DEVICE"
              className="bg-slate-900"
            >
              Smart Devices
            </option>
          </select>

        </div>
      </div>

      {/* ====================================================== */}
      {/* LOADING */}
      {/* ====================================================== */}

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-black/40 p-10 text-center">
          <p className="text-sm text-cyan-400 animate-pulse">
            Loading devices...
          </p>
        </div>
      )}

      {/* ====================================================== */}
      {/* ERROR */}
      {/* ====================================================== */}

      {!loading && error && (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
          <p className="text-sm text-rose-400">
            {error}
          </p>

          <button
            onClick={loadDevices}
            className="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* ====================================================== */}
      {/* EMPTY */}
      {/* ====================================================== */}

      {!loading &&
        !error &&
        filteredDevices.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-black/40 p-12 text-center">
            <div className="text-4xl">📡</div>

            <h2 className="mt-4 text-lg font-bold text-white">
              No Devices Found
            </h2>

            <p className="mt-2 text-xs text-white/40">
              No registered devices match your current search or filter.
            </p>
          </div>
        )}

      {/* ====================================================== */}
      {/* DEVICE GRID */}
      {/* ====================================================== */}

      {!loading && !error && filteredDevices.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {filteredDevices.map((device) => (

            <div
              key={device.id}
              className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 shadow-xl ${
                device.state
                  ? "border-cyan-500/30 bg-cyan-950/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                  : "border-white/10 bg-black/40"
              }`}
            >

              {/* CARD TOP */}

              <div>

                <div className="flex items-start justify-between">

                  <span className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/60">
                    {device.type}
                  </span>

                  <span
                    className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                      device.status === "ONLINE"
                        ? "text-emerald-400"
                        : "text-rose-500"
                    }`}
                  >

                    <span
                      className={`h-2 w-2 rounded-full ${
                        device.status === "ONLINE"
                          ? "animate-pulse bg-emerald-400"
                          : "bg-rose-500"
                      }`}
                    />

                    {device.status}

                  </span>

                </div>

                {/* DEVICE NAME */}

                <div className="mt-4">

                  <h3 className="text-base font-bold tracking-wide text-white">
                    {device.name}
                  </h3>

                  <p className="mt-0.5 font-mono text-[11px] text-cyan-400">
                    {device.deviceCode}
                  </p>

                </div>

                {/* INFO */}

                <div className="mt-4 space-y-2 border-t border-white/5 pt-3 text-xs text-white/60">

                  <div className="flex justify-between gap-4">

                    <span>
                      Location:
                    </span>

                    <span className="font-medium text-white">
                      {device.location}
                    </span>

                  </div>

                  <div className="flex justify-between">

                    <span>
                      Signal:
                    </span>

                    <span className="font-mono text-white/80">
                      {device.rssi}
                    </span>

                  </div>

                  <div className="flex justify-between">

                    <span>
                      Current Draw:
                    </span>

                    <span className="font-mono font-bold text-cyan-300">
                      {device.powerDraw}
                    </span>

                  </div>

                </div>

              </div>

              {/* POWER BUTTON */}

              <div className="mt-6 border-t border-white/10 pt-4">

                <button
                  type="button"
                  disabled={device.status === "OFFLINE"}
                  onClick={() =>
                    toggleDevice(device)
                  }
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 ${
                    device.status === "OFFLINE"
                      ? "cursor-not-allowed border border-white/5 bg-white/5 text-white/20"
                      : device.state
                      ? "bg-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.5)] hover:bg-cyan-300"
                      : "border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-4 w-4 ${
                      device.state
                        ? "animate-pulse"
                        : ""
                    }`}
                  >
                    <path d="M12 2v10" />
                    <path d="M18.4 6.6a9 9 0 1 1-12.77 0" />
                  </svg>

                  {device.status === "OFFLINE"
                    ? "DISABLED"
                    : device.state
                    ? "POWER ON"
                    : "POWER OFF"}

                </button>

              </div>

            </div>

          ))}

        </div>
      )}

    </div>
  );
}