import { useState } from "react";

// Dummy Data for Energy Analytics
const usageSummary = {
  todayCost: 12.5, // Tk
  todayKwh: 1.25,
  sevenDaysCost: 85.0,
  sevenDaysKwh: 8.5,
  thirtyDaysCost: 360.0,
  thirtyDaysKwh: 36.0,
};

const deviceUsageBreakdown = [
  { name: "Main Water Pump", type: "PUMP", kwh: 18.5, cost: 185.0, percent: 51, color: "bg-cyan-500" },
  { name: "Living Room Light", type: "LIGHT", kwh: 9.2, cost: 92.0, percent: 26, color: "bg-blue-500" },
  { name: "Cow Shed Camera", type: "CAMERA", kwh: 8.3, cost: 83.0, percent: 23, color: "bg-purple-500" },
];

export default function EnergyAnalytics() {
  const [timeframe, setTimeframe] = useState<"7D" | "30D">("7D");

  return (
    <div className="flex-1 p-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Energy & Cost Analytics</h1>
          <p className="mt-1 text-sm text-white/60">
            Monitor real-time power consumption and estimated cost across devices.
          </p>
        </div>

        {/* TIMEFRAME TOGGLE */}
        <div className="flex rounded-xl border border-white/10 bg-black/40 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setTimeframe("7D")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              timeframe === "7D"
                ? "bg-cyan-500 text-black shadow-lg"
                : "text-white/60 hover:text-white"
            }`}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => setTimeframe("30D")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              timeframe === "30D"
                ? "bg-cyan-500 text-black shadow-lg"
                : "text-white/60 hover:text-white"
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* TODAY */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Today's Usage</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">৳ {usageSummary.todayCost}</span>
            <span className="text-xs text-cyan-400 font-medium">({usageSummary.todayKwh} kWh)</span>
          </div>
          <p className="mt-2 text-xs text-white/40">Est. rate: ৳ 10.00 / kWh</p>
        </div>

        {/* 7 DAYS */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Last 7 Days</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">৳ {usageSummary.sevenDaysCost}</span>
            <span className="text-xs text-cyan-400 font-medium">({usageSummary.sevenDaysKwh} kWh)</span>
          </div>
          <p className="mt-2 text-xs text-emerald-400 font-medium">↓ 5% lower than last week</p>
        </div>

        {/* 30 DAYS PROJECTION */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">30 Days Estimate</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400">৳ {usageSummary.thirtyDaysCost}</span>
            <span className="text-xs text-white/60 font-medium">({usageSummary.thirtyDaysKwh} kWh)</span>
          </div>
          <p className="mt-2 text-xs text-white/40">Based on active device average</p>
        </div>
      </div>

      {/* DEVICE CONSUMPTION BREAKDOWN */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <h2 className="text-lg font-bold text-white mb-6">Device Energy Breakdown</h2>

        <div className="space-y-6">
          {deviceUsageBreakdown.map((device) => (
            <div key={device.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white">{device.name}</span>
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase text-white/50">
                    {device.type}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-cyan-400">৳ {device.cost}</span>
                  <span className="ml-2 text-xs text-white/40">({device.kwh} kWh)</span>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full ${device.color} transition-all duration-500`}
                  style={{ width: `${device.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}