import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AddDeviceModal from "../components/AddDeviceModal";

// Real-time Energy Usage Data
const livePowerData = [
  { time: "00:00", power: 120 },
  { time: "04:00", power: 80 },
  { time: "08:00", power: 450 },
  { time: "12:00", power: 980 },
  { time: "16:00", power: 650 },
  { time: "20:00", power: 1100 },
  { time: "23:59", power: 340 },
];

export default function Dashboard() {
  const [selectedLocation, setSelectedLocation] = useState("ALL");
  const [quickScene, setQuickScene] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSceneTrigger = (sceneName: string) => {
    setQuickScene(sceneName);
    setTimeout(() => setQuickScene(null), 3000);
  };

  const handleDeviceAdded = () => {
    // ডিভাইস যোগ হওয়ার পর ডেটা রিফ্রেশ লজিক এখানে দিতে পারেন
    console.log("Device list updated successfully!");
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8">
      {/* 1. TOP HEADER & LOCATION SWITCHER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-wide">
              Human Tech Engine
            </h1>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              MQTT Live
            </span>
          </div>
          <p className="mt-1 text-xs text-white/50">
            Real-time IoT Telemetry & Enterprise Control Panel
          </p>
        </div>

        {/* LOCATION DROPDOWN & ADD DEVICE BUTTON */}
        <div className="flex items-center gap-3">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/50 px-4 py-2 text-sm font-medium text-white outline-none backdrop-blur-md focus:border-cyan-400 [&>option]:bg-slate-900"
          >
            <option value="ALL">All Properties (4 Locations)</option>
            <option value="HOME">Rajshahi Residence</option>
            <option value="COW_SHED">Cow Shed Project</option>
            <option value="OFFICE">Matarbari HQ</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-cyan-400 active:scale-95"
          >
            <span>+</span> Add Device
          </button>
        </div>
      </div>

      {/* 2. SYSTEM KPI CARDS */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* TOTAL DEVICES */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs font-bold uppercase">Total Hardware</span>
            <span className="text-lg">📡</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">42</span>
            <span className="text-xs text-emerald-400 font-semibold">38 Active</span>
          </div>
          <p className="mt-2 text-[11px] text-white/40">4 Devices Offline</p>
        </div>

        {/* LIVE POWER LOAD */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs font-bold uppercase">Current Power Load</span>
            <span className="text-lg">⚡</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400">1.10 kW</span>
            <span className="text-xs text-cyan-400/80 font-mono">220V / 5.0A</span>
          </div>
          <p className="mt-2 text-[11px] text-white/40">Peak today: 1.85 kW</p>
        </div>

        {/* TODAY'S ESTIMATED COST */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs font-bold uppercase">Today's Cost</span>
            <span className="text-lg">৳</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">৳ 84.50</span>
            <span className="text-xs text-white/50">(8.45 kWh)</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-400">Est. Monthly: ৳ 2,530</p>
        </div>

        {/* SECURITY & ALERTS */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs font-bold uppercase">System Health</span>
            <span className="text-lg">🛡️</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">98.2%</span>
          </div>
          <p className="mt-2 text-[11px] text-white/40">0 Critical Anomaly</p>
        </div>
      </div>

      {/* 3. QUICK SCENES / ONE-TAP MODES */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">One-Tap Smart Scenes</h2>
          {quickScene && (
            <span className="text-xs text-cyan-400 animate-pulse font-mono">
              Executing Scene: {quickScene}...
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => handleSceneTrigger("Full Shutdown")}
            className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 py-3 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 active:scale-95"
          >
            🚨 Emergency Off
          </button>
          <button
            type="button"
            onClick={() => handleSceneTrigger("Night Mode")}
            className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 py-3 text-xs font-bold text-indigo-300 transition hover:bg-indigo-500/20 active:scale-95"
          >
            🌙 Night Mode
          </button>
          <button
            type="button"
            onClick={() => handleSceneTrigger("Away Mode")}
            className="flex items-center justify-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 py-3 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20 active:scale-95"
          >
            🛡️ Away Guard
          </button>
          <button
            type="button"
            onClick={() => handleSceneTrigger("Pump Automation")}
            className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 py-3 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20 active:scale-95"
          >
            💧 Smart Irrigation
          </button>
        </div>
      </div>

      {/* 4. REAL-TIME TELEMETRY GRAPH */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Live Power Consumption</h2>
            <p className="text-xs text-white/40">Aggregated Wattage (W) over 24 hours</p>
          </div>
          <span className="font-mono text-xs text-cyan-400">Refresh Rate: 1s</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={livePowerData}>
              <defs>
                <linearGradient id="livePowerGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="time" stroke="#ffffff40" fontSize={11} />
              <YAxis stroke="#ffffff40" fontSize={11} unit="W" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000000e0",
                  borderColor: "#ffffff20",
                  borderRadius: "16px",
                  color: "#fff",
                }}
              />
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
        </div>
      </div>

      {/* 5. ADD DEVICE MODAL */}
      <AddDeviceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDeviceAdded={handleDeviceAdded}
      />
    </div>
  );
}