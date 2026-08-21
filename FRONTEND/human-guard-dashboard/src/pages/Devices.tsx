import { useState } from "react";

type Device = {
  id: string;
  name: string;
  deviceCode: string;
  type: "PUMP" | "LIGHT" | "CAMERA";
  location: string;
  status: "ONLINE" | "OFFLINE";
  rssi: string;
  powerDraw: string;
  state: boolean;
};

const initialDevices: Device[] = [
  {
    id: "1",
    name: "Main Water Pump",
    deviceCode: "HT-PUMP-001",
    type: "PUMP",
    location: "Rajshahi Residence",
    status: "ONLINE",
    rssi: "-55 dBm",
    powerDraw: "750 W",
    state: true,
  },
  {
    id: "2",
    name: "Living Room Light",
    deviceCode: "HT-LGT-002",
    type: "LIGHT",
    location: "Rajshahi Residence",
    status: "ONLINE",
    rssi: "-62 dBm",
    powerDraw: "18 W",
    state: true,
  },
  {
    id: "3",
    name: "Cow Shed Surveillance",
    deviceCode: "HT-CAM-003",
    type: "CAMERA",
    location: "Cow Shed Project",
    status: "OFFLINE",
    rssi: "N/A",
    powerDraw: "0 W",
    state: false,
  },
  {
    id: "4",
    name: "Irrigation Pump 2",
    deviceCode: "HT-PUMP-004",
    type: "PUMP",
    location: "Cow Shed Project",
    status: "ONLINE",
    rssi: "-48 dBm",
    powerDraw: "1100 W",
    state: true,
  },
];

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const toggleDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((dev) => (dev.id === id ? { ...dev, state: !dev.state } : dev))
    );
  };

  const filteredDevices = devices.filter((dev) => {
    const matchesSearch =
      dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.deviceCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || dev.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8">
      {/* HEADER & FILTERS */}
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs text-white placeholder-white/40 backdrop-blur-xl outline-none focus:border-cyan-400 sm:w-64"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs text-white backdrop-blur-xl outline-none focus:border-cyan-400"
          >
            <option value="ALL" className="bg-slate-900">All Hardware Types</option>
            <option value="PUMP" className="bg-slate-900">Pumps</option>
            <option value="LIGHT" className="bg-slate-900">Lights</option>
            <option value="CAMERA" className="bg-slate-900">Cameras</option>
          </select>
        </div>
      </div>

      {/* DEVICE CARDS GRID */}
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
            {/* CARD TOP SECTION */}
            <div>
              <div className="flex items-start justify-between">
                <span className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/60">
                  {device.type}
                </span>

                {/* ONLINE / OFFLINE STATUS */}
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

              {/* DEVICE TITLE & CODE */}
              <div className="mt-4">
                <h3 className="text-base font-bold tracking-wide text-white">
                  {device.name}
                </h3>
                <p className="mt-0.5 font-mono text-[11px] text-cyan-400">
                  {device.deviceCode}
                </p>
              </div>

              <div className="mt-4 space-y-2 border-t border-white/5 pt-3 text-xs text-white/60">
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="font-medium text-white">{device.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>Signal:</span>
                  <span className="font-mono text-white/80">{device.rssi}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Draw:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {device.powerDraw}
                  </span>
                </div>
              </div>
            </div>

            {/* FULL WIDTH POWER PUSH BUTTON */}
            <div className="mt-6 border-t border-white/10 pt-4">
              <button
                type="button"
                disabled={device.status === "OFFLINE"}
                onClick={() => toggleDevice(device.id)}
                className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 px-4 text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 ${
                  device.status === "OFFLINE"
                    ? "cursor-not-allowed bg-white/5 text-white/20 border border-white/5"
                    : device.state
                    ? "bg-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.5)] hover:bg-cyan-300 font-bold"
                    : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white"
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
                  className={`h-4 w-4 ${device.state ? "animate-pulse" : ""}`}
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
    </div>
  );
}