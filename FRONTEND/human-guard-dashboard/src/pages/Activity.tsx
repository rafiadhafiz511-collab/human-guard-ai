import { useCallback, useEffect, useState } from "react";
import api from "../api/client";
import type { Device } from "../types";

type Command = {
  id: string;
  device_id: string;
  command: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  completed_at: string | null;
};

export default function Activity() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search State
  const [selectedDevice, setSelectedDevice] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const loadActivity = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      const devicesResponse = await api.get("/devices/");
      const fetchedDevices: Device[] = Array.isArray(devicesResponse.data)
        ? devicesResponse.data
        : Array.isArray(devicesResponse.data?.data)
        ? devicesResponse.data.data
        : [];

      setDevices(fetchedDevices);

      if (fetchedDevices.length === 0) {
        setCommands([]);
        return;
      }

      const commandResponses = await Promise.all(
        fetchedDevices.map((device) =>
          api
            .get<Command[]>(`/devices/${device.device_id}/commands`)
            .catch(() => ({ data: [] as Command[] }))
        )
      );

      const allCommands = commandResponses.flatMap((res) => res.data);

      allCommands.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setCommands(allCommands);
    } catch (err) {
      console.error("[Activity] Failed to load activity log:", err);
    } finally {
      if (isInitial) setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadActivity(true);
  }, [loadActivity]);

  function formatDate(value: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  }

  function statusClass(status: string) {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "sent":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "failed":
      case "cancelled":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  }

  function getDeviceName(deviceId: string): string {
    const found = devices.find(
      (d) => d.device_id === deviceId || d.id === deviceId
    );
    return found ? found.device_name : deviceId;
  }

  const filteredCommands = commands.filter((cmd) => {
    const matchesDevice =
      selectedDevice === "ALL" || cmd.device_id === selectedDevice;

    const matchesStatus =
      selectedStatus === "ALL" ||
      cmd.status.toLowerCase() === selectedStatus.toLowerCase();

    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      cmd.command.toLowerCase().includes(searchLower) ||
      cmd.device_id.toLowerCase().includes(searchLower) ||
      getDeviceName(cmd.device_id).toLowerCase().includes(searchLower);

    return matchesDevice && matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen flex-1 bg-[#0b0f19] p-6 text-white md:p-8">
      {/* FORCE DARK THEME OVERRIDE */}
      <style>{`
        .activity-area, .activity-area * {
          background-color: transparent !important;
          color: #ffffff !important;
        }
        select option {
          background-color: #0f172a !important;
          color: #ffffff !important;
        }
      `}</style>

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-white">
            Command Activity
          </h1>
          <p className="mt-1 text-xs text-white/50">
            Real-time command history across all smart devices
          </p>
        </div>
        <div className="flex items-center gap-3">
          {refreshing && (
            <span className="animate-pulse text-xs font-medium text-cyan-400">
              Refreshing...
            </span>
          )}
          <button
            type="button"
            onClick={() => loadActivity(false)}
            disabled={loading || refreshing}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* FILTERS & SEARCH BAR */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <input
          type="text"
          placeholder="Search by command or device..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs text-white placeholder-white/40 outline-none backdrop-blur-md focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
        />

        <select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs text-white outline-none backdrop-blur-md focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
        >
          <option value="ALL">All Devices ({devices.length})</option>
          {devices.map((device) => (
            <option key={device.device_id} value={device.device_id}>
              {device.device_name} ({device.device_id})
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs text-white outline-none backdrop-blur-md focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
        >
          <option value="ALL">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed / Cancelled</option>
        </select>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center backdrop-blur-xl">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-cyan-400" />
          <p className="mt-4 text-xs font-medium text-white/80">
            Loading activity history...
          </p>
        </div>
      ) : filteredCommands.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center backdrop-blur-xl">
          <p className="text-sm font-semibold text-white/80">
            No command activity found
          </p>
          <p className="mt-1 text-xs text-white/40">
            Try adjusting your filters or send a command to a device.
          </p>
        </div>
      ) : (
        <div className="activity-area overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl backdrop-blur-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-white/50">
                <tr>
                  <th className="px-6 py-4">Command</th>
                  <th className="px-6 py-4">Device</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Sent</th>
                  <th className="px-6 py-4">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-white/80">
                {filteredCommands.map((command) => (
                  <tr
                    key={command.id}
                    className="transition-colors hover:bg-white/5"
                  >
                    <td className="px-6 py-4 font-sans font-bold text-cyan-400">
                      {command.command}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-sans font-semibold text-white">
                        {getDeviceName(command.device_id)}
                      </div>
                      <div className="text-[10px] text-white/40">
                        {command.device_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass(
                          command.status
                        )}`}
                      >
                        {command.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {formatDate(command.created_at)}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {formatDate(command.sent_at)}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {formatDate(command.completed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}