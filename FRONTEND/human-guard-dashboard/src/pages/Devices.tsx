import { useEffect, useMemo, useRef, useState } from "react";
import { getHomeDevices } from "../api/devices";
import { getHomeRooms } from "../api/rooms";
import { useHomeContext } from "../contexts/HomeContext";
import type { Device, Room } from "../types";
import { mapApiDevices } from "../api/deviceMapper";
import DashboardDeviceCard from "../components/DashboardDeviceCard";
import DeviceDetailsDrawer from "../components/DeviceDetailsDrawer";

const POLL_INTERVAL_MS = 5000;

export default function Devices() {
  const {
    currentHomeId,
    loading: homeLoading,
  } = useHomeContext();

  const [devices, setDevices] = useState<Device[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [error, setError] = useState("");
  const [roomError, setRoomError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const isFetchingRef = useRef(false);

  const loadDevices = async (silent = false) => {
    if (!currentHomeId) {
      setDevices([]);
      setLoading(false);
      return;
    }

    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    try {
      if (!silent) {
        setLoading(true);
        setError("");
      }

      const apiDevices = await getHomeDevices(currentHomeId);
      const mappedDevices = mapApiDevices(apiDevices);
      setDevices(mappedDevices);
      setError("");
    } catch (err) {
      console.error("[DEVICES] Failed to load devices:", err);
      if (!silent) {
        setError("ডিভাইসগুলো লোড করা সম্ভব হয়নি। আবার চেষ্টা করুন।");
      }
    } finally {
      isFetchingRef.current = false;
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadRooms = async () => {
    if (!currentHomeId) {
      setRooms([]);
      return;
    }

    try {
      setLoadingRooms(true);
      setRoomError("");
      const data = await getHomeRooms(currentHomeId);
      setRooms(data);
    } catch (err) {
      console.error("[DEVICES] Failed to load rooms:", err);
      setRooms([]);
      setRoomError("Room information could not be loaded.");
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (homeLoading) {
      return;
    }

    void loadDevices(false);
    void loadRooms();

    if (!currentHomeId) {
      return;
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadDevices(true);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [currentHomeId, homeLoading]);

  const roomMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const room of rooms) {
      map.set(room.id, room.name);
    }
    return map;
  }, [rooms]);

  const getRoomName = (roomId?: string | null) => {
    if (!roomId) {
      return "Unassigned";
    }
    return roomMap.get(roomId) ?? "Unknown Room";
  };

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesType =
        filterType === "ALL" ||
        device.device_type?.toUpperCase() === filterType.toUpperCase();

      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        device.device_name?.toLowerCase().includes(q) ||
        device.device_id?.toLowerCase().includes(q) ||
        getRoomName(device.room_id).toLowerCase().includes(q);

      return matchesType && matchesSearch;
    });
  }, [devices, filterType, searchTerm, roomMap]);

  if (homeLoading || loading) {
    return (
      <div className="p-6 text-sm text-white/60">
        Loading devices...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Device Management Terminal</h1>
          <p className="text-xs text-white/50">
            Live status sync every 5s • State updates after device ACK
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, ID or room..."
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="ALL">All Hardware Types</option>
            <option value="PUMP">PUMP</option>
            <option value="SMART_PUMP">SMART_PUMP</option>
            <option value="CAMERA">CAMERA</option>
            <option value="SENSOR">SENSOR</option>
          </select>

          <button
            type="button"
            onClick={() => void loadDevices(false)}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10"
          >
            Sync Now
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {roomError && !loadingRooms && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          {roomError}
        </div>
      )}

      {filteredDevices.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-sm text-white/50">
          No matching devices found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDevices.map((device) => (
            <DashboardDeviceCard
              key={device.device_id || device.id}
              device={device}
              onRefresh={() => void loadDevices(true)}
              onDetails={(d) => setSelectedDevice(d)}
            />
          ))}
        </div>
      )}

      {selectedDevice && (
        <DeviceDetailsDrawer
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
}
