import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AddDeviceModal from "../components/AddDeviceModal";
import { getDashboardStats } from "../api/dashboard";
import type { DashboardStats } from "../types";

// ============================================================
// TYPES
// ============================================================

type PowerPoint = {
  time: string;
  power: number;
};

// ============================================================
// HELPERS
// ============================================================

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

// ============================================================
// DASHBOARD
// ============================================================

export default function Dashboard() {
  const [selectedLocation, setSelectedLocation] = useState("ALL");

  const [quickScene, setQuickScene] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // Currently there is no backend power-history endpoint
  // connected to this page.
  //
  // Therefore we intentionally keep the chart empty instead
  // of displaying fabricated telemetry.
  const [powerData] = useState<PowerPoint[]>([]);

  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDashboardStats();

      setStats(data);
    } catch (err) {
      console.error(
        "[DASHBOARD] Failed to load dashboard:",
        err
      );

      setError(
        "Unable to load dashboard data from the server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ============================================================
  // DEVICE ADDED
  // ============================================================

  const handleDeviceAdded = async () => {
    await loadDashboard();
  };

  // ============================================================
  // QUICK SCENE
  // ============================================================

  const handleSceneTrigger = (sceneName: string) => {
    setQuickScene(sceneName);

    setTimeout(() => {
      setQuickScene(null);
    }, 3000);
  };

  // ============================================================
  // DERIVED VALUES
  // ============================================================

  const totalDevices =
    stats?.devices.total ?? null;

  const onlineDevices =
    stats?.devices.online ?? null;

  const offlineDevices =
    stats?.devices.offline ?? null;

  const commandStats =
    stats?.commands ?? null;

  const latestCommand =
    stats?.latest_command ?? null;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <h1 className="text-2xl font-black tracking-wide text-white">
              Human Tech Engine
            </h1>

            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">

              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />

              MQTT Live

            </span>

          </div>

          <p className="mt-1 text-xs text-white/50">
            Real-time IoT Telemetry & Enterprise Control Panel
          </p>

        </div>

        <div className="flex items-center gap-3">

          <select
            value={selectedLocation}
            onChange={(event) =>
              setSelectedLocation(event.target.value)
            }
            className="rounded-xl border border-white/10 bg-black/50 px-4 py-2 text-sm font-medium text-white outline-none backdrop-blur-md focus:border-cyan-400 [&>option]:bg-slate-900"
          >

            <option value="ALL">
              All Properties
            </option>

            <option value="HOME">
              Rajshahi Residence
            </option>

            <option value="COW_SHED">
              Cow Shed Project
            </option>

            <option value="OFFICE">
              Matarbari HQ
            </option>

          </select>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 active:scale-95"
          >

            <span>+</span>

            <span>Add Device</span>

          </button>

        </div>

      </div>

      {/* ====================================================== */}
      {/* ERROR */}
      {/* ====================================================== */}

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-rose-300">
            {error}
          </p>

          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/30"
          >
            Retry
          </button>

        </div>
      )}

      {/* ====================================================== */}
      {/* LOADING */}
      {/* ====================================================== */}

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-black/40 p-4 text-center backdrop-blur-xl">

          <p className="animate-pulse text-xs font-semibold text-cyan-400">
            Loading live dashboard data...
          </p>

        </div>
      )}

      {/* ====================================================== */}
      {/* KPI CARDS */}
      {/* ====================================================== */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

        {/* TOTAL DEVICES */}

        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl">

          <div className="flex items-center justify-between text-white/40">

            <span className="text-xs font-bold uppercase">
              Total Hardware
            </span>

            <span className="text-lg">
              📡
            </span>

          </div>

          <div className="mt-3 flex items-baseline gap-2">

            <span className="text-3xl font-black text-white">
              {totalDevices === null
                ? "—"
                : formatNumber(totalDevices)}
            </span>

            <span className="text-xs font-semibold text-emerald-400">
              {onlineDevices === null
                ? "—"
                : `${formatNumber(onlineDevices)} Online`}
            </span>

          </div>

          <p className="mt-2 text-[11px] text-white/40">
            {offlineDevices === null
              ? "Offline: —"
              : `Offline: ${formatNumber(offlineDevices)}`}
          </p>

        </div>

        {/* CONNECTION STATUS */}

        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl">

          <div className="flex items-center justify-between text-white/40">

            <span className="text-xs font-bold uppercase">
              Device Availability
            </span>

            <span className="text-lg">
              ⚡
            </span>

          </div>

          <div className="mt-3 flex items-baseline gap-2">

            <span className="text-3xl font-black text-cyan-400">

              {totalDevices && totalDevices > 0
                ? `${Math.round(
                    ((onlineDevices ?? 0) /
                      totalDevices) *
                      100
                  )}%`
                : "—"}

            </span>

          </div>

          <p className="mt-2 text-[11px] text-white/40">
            Based on latest heartbeat
          </p>

        </div>

        {/* COMMANDS */}

        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl">

          <div className="flex items-center justify-between text-white/40">

            <span className="text-xs font-bold uppercase">
              Commands
            </span>

            <span className="text-lg">
              ⚙️
            </span>

          </div>

          <div className="mt-3 flex items-baseline gap-2">

            <span className="text-3xl font-black text-white">

              {commandStats
                ? formatNumber(commandStats.total)
                : "—"}

            </span>

          </div>

          <p className="mt-2 text-[11px] text-white/40">

            {commandStats
              ? `${commandStats.pending} pending • ${commandStats.completed} completed`
              : "Command data unavailable"}

          </p>

        </div>

        {/* SYSTEM STATUS */}

        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl">

          <div className="flex items-center justify-between text-white/40">

            <span className="text-xs font-bold uppercase">
              System Status
            </span>

            <span className="text-lg">
              🛡️
            </span>

          </div>

          <div className="mt-3 flex items-baseline gap-2">

            <span className="text-2xl font-black text-emerald-400">
              {error
                ? "DEGRADED"
                : loading
                ? "LOADING"
                : "OPERATIONAL"}
            </span>

          </div>

          <p className="mt-2 text-[11px] text-white/40">

            Heartbeat timeout:{" "}
            {stats?.offline_after_seconds ?? "—"}s

          </p>

        </div>

      </div>

      {/* ====================================================== */}
      {/* COMMAND ACTIVITY */}
      {/* ====================================================== */}

      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-base font-bold text-white">
              Command Activity
            </h2>

            <p className="text-xs text-white/40">
              Live command lifecycle statistics
            </p>

          </div>

          {latestCommand && (
            <div className="text-right">

              <p className="text-[10px] uppercase tracking-wider text-white/30">
                Latest Command
              </p>

              <p className="font-mono text-xs text-cyan-400">
                {latestCommand.command}
              </p>

            </div>
          )}

        </div>

        {commandStats ? (

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

            {[
              ["Total", commandStats.total],
              ["Pending", commandStats.pending],
              ["Sent", commandStats.sent],
              ["Completed", commandStats.completed],
              ["Failed", commandStats.failed],
              ["Cancelled", commandStats.cancelled],
            ].map(([label, value]) => (

              <div
                key={String(label)}
                className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"
              >

                <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                  {label}
                </p>

                <p className="mt-2 text-2xl font-black text-white">
                  {formatNumber(Number(value))}
                </p>

              </div>

            ))}

          </div>

        ) : (

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">

            <p className="text-xs text-white/30">
              Command statistics unavailable.
            </p>

          </div>

        )}

      </div>

      {/* ====================================================== */}
      {/* LATEST COMMAND */}
      {/* ====================================================== */}

      {latestCommand && (
        <div className="rounded-3xl border border-cyan-500/10 bg-cyan-950/10 p-6 backdrop-blur-xl">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/60">
                Latest Device Command
              </p>

              <h2 className="mt-1 font-mono text-lg font-bold text-white">
                {latestCommand.command}
              </h2>

              <p className="mt-1 text-xs text-white/40">
                Device: {latestCommand.device_id}
              </p>

            </div>

            <div className="text-left sm:text-right">

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase text-white/70">
                {latestCommand.status}
              </span>

              <p className="mt-2 text-[10px] text-white/30">
                {formatDate(latestCommand.created_at)}
              </p>

            </div>

          </div>

        </div>
      )}

      {/* ====================================================== */}
      {/* QUICK SCENES */}
      {/* ====================================================== */}

      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">

        <div className="mb-4 flex items-center justify-between">

          <h2 className="text-base font-bold text-white">
            One-Tap Smart Scenes
          </h2>

          {quickScene && (
            <span className="animate-pulse font-mono text-xs text-cyan-400">
              Executing Scene: {quickScene}...
            </span>
          )}

        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

          <button
            type="button"
            onClick={() =>
              handleSceneTrigger("Full Shutdown")
            }
            className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 py-3 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 active:scale-95"
          >
            🚨 Emergency Off
          </button>

          <button
            type="button"
            onClick={() =>
              handleSceneTrigger("Night Mode")
            }
            className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 py-3 text-xs font-bold text-indigo-300 transition hover:bg-indigo-500/20 active:scale-95"
          >
            🌙 Night Mode
          </button>

          <button
            type="button"
            onClick={() =>
              handleSceneTrigger("Away Mode")
            }
            className="flex items-center justify-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 py-3 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20 active:scale-95"
          >
            🛡️ Away Guard
          </button>

          <button
            type="button"
            onClick={() =>
              handleSceneTrigger("Pump Automation")
            }
            className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 py-3 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20 active:scale-95"
          >
            💧 Smart Irrigation
          </button>

        </div>

      </div>

      {/* ====================================================== */}
      {/* POWER TELEMETRY */}
      {/* ====================================================== */}

      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">

        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-bold text-white">
              Live Power Consumption
            </h2>

            <p className="text-xs text-white/40">
              Aggregated telemetry from connected devices
            </p>

          </div>

          <span className="font-mono text-xs text-white/30">
            Telemetry history unavailable
          </span>

        </div>

        <div className="h-64 w-full">

          {powerData.length > 0 ? (

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <AreaChart data={powerData}>

                <defs>

                  <linearGradient
                    id="livePowerGlow"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="5%"
                      stopColor="#06b6d4"
                      stopOpacity={0.5}
                    />

                    <stop
                      offset="95%"
                      stopColor="#06b6d4"
                      stopOpacity={0}
                    />

                  </linearGradient>

                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff08"
                />

                <XAxis
                  dataKey="time"
                  stroke="#ffffff40"
                  fontSize={11}
                />

                <YAxis
                  stroke="#ffffff40"
                  fontSize={11}
                  unit="W"
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="power"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#livePowerGlow)"
                />

              </AreaChart>

            </ResponsiveContainer>

          ) : (

            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">

              <div className="text-center">

                <p className="text-sm font-semibold text-white/50">
                  No power telemetry available
                </p>

                <p className="mt-1 text-xs text-white/25">
                  Connect a telemetry-producing device to populate this chart.
                </p>

              </div>

            </div>

          )}

        </div>

      </div>

      {/* ====================================================== */}
      {/* ADD DEVICE MODAL */}
      {/* ====================================================== */}

      <AddDeviceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDeviceAdded={handleDeviceAdded}
      />

    </div>
  );
}