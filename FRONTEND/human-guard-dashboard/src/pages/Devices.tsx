import { useEffect, useMemo, useState } from "react";
import api from "../api/client";

import type {
  ApiDevice,
  Device,
} from "../types";

import {
  mapApiDevices,
} from "../api/deviceMapper";

// ============================================================
// DEVICE PAGE
// ============================================================

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [filterType, setFilterType] =
    useState("ALL");

  // ============================================================
  // LOAD DEVICES
  // ============================================================

  const loadDevices = async () => {
    try {
      setLoading(true);

      setError("");

      const response =
        await api.get<ApiDevice[]>("/devices/");

      const mappedDevices =
        mapApiDevices(response.data);

      setDevices(mappedDevices);
    } catch (err) {
      console.error(
        "[DEVICES] Failed to load devices:",
        err
      );

      setError(
        "Failed to load devices from server."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    void loadDevices();
  }, []);

  // ============================================================
  // FILTERED DEVICES
  // ============================================================

  const filteredDevices = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return devices.filter((device) => {
      const matchesSearch =
        !search ||
        device.device_name
          .toLowerCase()
          .includes(search) ||
        device.device_id
          .toLowerCase()
          .includes(search);

      const matchesType =
        filterType === "ALL" ||
        device.device_type === filterType;

      return (
        matchesSearch &&
        matchesType
      );
    });
  }, [
    devices,
    searchTerm,
    filterType,
  ]);

  // ============================================================
  // TOGGLE DEVICE
  // ============================================================

  const toggleDevice = async (
    device: Device
  ) => {
    if (
      device.status !== "ONLINE"
    ) {
      return;
    }

    if (
      device.state === "UNKNOWN"
    ) {
      return;
    }

    try {
      const command =
        device.state === "ON"
          ? "POWER_OFF"
          : "POWER_ON";

      await api.post(
        `/devices/${device.device_id}/command`,
        {
          command,
        }
      );

      await loadDevices();
    } catch (err) {
      console.error(
        "[DEVICES] Failed to send command:",
        err
      );
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8">

      {/* HEADER */}

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
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs text-white placeholder-white/40 backdrop-blur-xl outline-none focus:border-cyan-400 sm:w-64"
          />

          <select
            value={filterType}
            onChange={(event) =>
              setFilterType(event.target.value)
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

      {/* LOADING */}

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-black/40 p-10 text-center">
          <p className="animate-pulse text-sm text-cyan-400">
            Loading devices...
          </p>
        </div>
      )}

      {/* ERROR */}

      {!loading && error && (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">

          <p className="text-sm text-rose-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadDevices()}
            className="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30"
          >
            Retry
          </button>

        </div>
      )}

      {/* EMPTY */}

      {!loading &&
        !error &&
        filteredDevices.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-black/40 p-12 text-center">

            <div className="text-4xl">
              📡
            </div>

            <h2 className="mt-4 text-lg font-bold text-white">
              No Devices Found
            </h2>

            <p className="mt-2 text-xs text-white/40">
              No registered devices match your current search or filter.
            </p>

          </div>
        )}

      {/* DEVICE GRID */}

      {!loading &&
        !error &&
        filteredDevices.length > 0 && (

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {filteredDevices.map(
              (device) => (

                <div
                  key={device.id}
                  className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 shadow-xl ${
                    device.state === "ON"
                      ? "border-cyan-500/30 bg-cyan-950/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                      : "border-white/10 bg-black/40"
                  }`}
                >

                  {/* CARD TOP */}

                  <div>

                    <div className="flex items-start justify-between">

                      <span className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/60">
                        {device.device_type}
                      </span>

                      <span
                        className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                          device.status === "ONLINE"
                            ? "text-emerald-400"
                            : device.status === "OFFLINE"
                            ? "text-rose-500"
                            : "text-amber-400"
                        }`}
                      >

                        <span
                          className={`h-2 w-2 rounded-full ${
                            device.status === "ONLINE"
                              ? "animate-pulse bg-emerald-400"
                              : device.status === "OFFLINE"
                              ? "bg-rose-500"
                              : "bg-amber-400"
                          }`}
                        />

                        {device.status}

                      </span>

                    </div>

                    {/* NAME */}

                    <div className="mt-4">

                      <h3 className="text-base font-bold tracking-wide text-white">
                        {device.device_name}
                      </h3>

                      <p className="mt-0.5 font-mono text-[11px] text-cyan-400">
                        {device.device_id}
                      </p>

                    </div>

                    {/* INFO */}

                    <div className="mt-4 space-y-2 border-t border-white/5 pt-3 text-xs text-white/60">

                      <div className="flex justify-between gap-4">

                        <span>
                          Location:
                        </span>

                        <span className="font-medium text-white">
                          {device.home_id ||
                            "Unassigned"}
                        </span>

                      </div>

                      <div className="flex justify-between">

                        <span>
                          State:
                        </span>

                        <span className="font-mono text-white/80">
                          {device.state}
                        </span>

                      </div>

                      <div className="flex justify-between">

                        <span>
                          Firmware:
                        </span>

                        <span className="font-mono text-cyan-300">
                          {device.firmware_version ||
                            "N/A"}
                        </span>

                      </div>

                    </div>

                  </div>

                  {/* POWER BUTTON */}

                  <div className="mt-6 border-t border-white/10 pt-4">

                    <button
                      type="button"
                      disabled={
                        device.status !== "ONLINE" ||
                        device.state === "UNKNOWN"
                      }
                      onClick={() =>
                        void toggleDevice(device)
                      }
                      className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 ${
                        device.status !== "ONLINE" ||
                        device.state === "UNKNOWN"
                          ? "cursor-not-allowed border border-white/5 bg-white/5 text-white/20"
                          : device.state === "ON"
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
                          device.state === "ON"
                            ? "animate-pulse"
                            : ""
                        }`}
                      >
                        <path d="M12 2v10" />
                        <path d="M18.4 6.6a9 9 0 1 1-12.77 0" />
                      </svg>

                      {device.status !== "ONLINE"
                        ? "DISABLED"
                        : device.state === "UNKNOWN"
                        ? "UNKNOWN"
                        : device.state === "ON"
                        ? "POWER ON"
                        : "POWER OFF"}

                    </button>

                  </div>

                </div>
              )
            )}

          </div>
        )}

    </div>
  );
}