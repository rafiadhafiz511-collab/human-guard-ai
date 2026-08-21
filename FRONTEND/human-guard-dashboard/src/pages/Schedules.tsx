import { useState } from "react";

type Schedule = {
  id: string;
  name: string;
  device: string;
  time: string;
  days: string[];
  action: "TURN_ON" | "TURN_OFF";
  enabled: boolean;
};

const initialSchedules: Schedule[] = [
  {
    id: "SCH-001",
    name: "Morning Irrigation",
    device: "Main Water Pump",
    time: "06:00 AM",
    days: ["Mon", "Wed", "Fri"],
    action: "TURN_ON",
    enabled: true,
  },
  {
    id: "SCH-002",
    name: "Night Security Light",
    device: "Living Room Light",
    time: "06:30 PM",
    days: ["Everyday"],
    action: "TURN_ON",
    enabled: true,
  },
];

export default function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [device, setDevice] = useState("Main Water Pump");
  const [time, setTime] = useState("08:00");
  const [action, setAction] = useState<"TURN_ON" | "TURN_OFF">("TURN_ON");
  const [enabled, setEnabled] = useState(true);

  // Toggle Schedule Status
  const toggleSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // Delete Schedule Handler
  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  // Create New Schedule Handler
  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    // Convert 24h time format to 12h string for display
    const [hours, minutes] = time.split(":");
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? "PM" : "AM";
    const formattedHour = hourNum % 12 || 12;
    const formattedTime = `${formattedHour}:${minutes} ${period}`;

    const newSchedule: Schedule = {
      id: `SCH-00${schedules.length + 1}`,
      name,
      device,
      time: formattedTime,
      days: ["Everyday"],
      action,
      enabled,
    };

    setSchedules([newSchedule, ...schedules]);
    setName("");
    setEnabled(true);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide">
            Automations & Schedules
          </h1>
          <p className="mt-1 text-xs text-white/50">
            Configure automated hardware triggers and routine schedules
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-2xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-black transition hover:bg-cyan-400 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        >
          + Create New Schedule
        </button>
      </div>

      {/* SCHEDULES GRID */}
      {schedules.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-black/40 p-12 text-center backdrop-blur-xl">
          <p className="text-sm font-semibold text-white/50">
            No automated schedules set up yet.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20"
          >
            Create Your First Schedule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map((item) => (
            <div
              key={item.id}
              className={`group relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl transition ${
                item.enabled
                  ? "border-cyan-500/30 bg-black/50 shadow-[0_0_15px_rgba(6,182,212,0.05)]"
                  : "border-white/10 bg-black/20 opacity-60"
              }`}
            >
              {/* CARD TOP BAR */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                  {item.id}
                </span>

                <div className="flex items-center gap-3">
                  {/* DELETE BUTTON */}
                  <button
                    type="button"
                    title="Delete Schedule"
                    onClick={() => handleDeleteSchedule(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-xs font-bold text-rose-400 opacity-80 transition hover:bg-rose-500/20 hover:opacity-100"
                  >
                    🗑️
                  </button>

                  {/* TOGGLE SWITCH */}
                  <button
                    type="button"
                    onClick={() => toggleSchedule(item.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      item.enabled ? "bg-cyan-500" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        item.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* CARD DETAILS */}
              <h3 className="mt-3 text-lg font-bold text-white">{item.name}</h3>
              <p className="text-xs text-white/50 mt-1">Target: {item.device}</p>

              {/* EXECUTION DETAILS */}
              <div className="mt-6 flex items-baseline justify-between border-t border-white/10 pt-4">
                <div>
                  <div className="text-2xl font-black text-white font-mono">
                    {item.time}
                  </div>
                  <div className="text-[10px] text-white/40 font-semibold mt-0.5">
                    {item.days.join(", ")}
                  </div>
                </div>
                <span
                  className={`rounded-xl px-3 py-1 text-[10px] font-bold ${
                    item.action === "TURN_ON"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {item.action === "TURN_ON" ? "POWER ON" : "POWER OFF"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NEW SCHEDULE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Add New Schedule</h2>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/60">Schedule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Evening Pump Trigger"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/60">Target Device</label>
                <select
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none focus:border-cyan-400 [&>option]:bg-slate-900"
                >
                  <option value="Main Water Pump">Main Water Pump</option>
                  <option value="Living Room Light">Living Room Light</option>
                  <option value="Irrigation Pump 2">Irrigation Pump 2</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/60">Execution Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/60">Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value as "TURN_ON" | "TURN_OFF")}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none focus:border-cyan-400 [&>option]:bg-slate-900"
                  >
                    <option value="TURN_ON">POWER ON</option>
                    <option value="TURN_OFF">POWER OFF</option>
                  </select>
                </div>
              </div>

              {/* SCHEDULE INITIAL STATUS (ENABLE / DISABLE) */}
              <div>
                <label className="text-xs font-semibold text-white/60">Initial Status</label>
                <select
                  value={enabled ? "ENABLED" : "DISABLED"}
                  onChange={(e) => setEnabled(e.target.value === "ENABLED")}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none focus:border-cyan-400 [&>option]:bg-slate-900"
                >
                  <option value="ENABLED">ACTIVE (ON)</option>
                  <option value="DISABLED">INACTIVE (OFF)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-white/70 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-black hover:bg-cyan-400"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}