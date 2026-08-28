import { useEffect, useMemo, useState } from "react";
import { useHomeContext } from "../contexts/HomeContext";

import {
  createRoom,
  deleteRoom,
  getHomeRooms,
  getRoomDevices,
  updateRoom,
} from "../api/rooms";

import type {
  Room,
  RoomDevice,
} from "../types";

// ============================================================
// ROOM PAGE
// ============================================================

export default function Rooms() {
  const { currentHomeId, currentHome, loading: homeLoading } = useHomeContext();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomDevices, setRoomDevices] = useState<Record<string, RoomDevice[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newRoomName, setNewRoomName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [loadingDevices, setLoadingDevices] = useState<Record<string, boolean>>({});

  const [actionError, setActionError] = useState("");

  // ============================================================
  // LOAD ROOMS
  // ============================================================

  const loadRooms = async () => {
    if (!currentHomeId) {
      setRooms([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getHomeRooms(currentHomeId);
      setRooms(data);
    } catch (err) {
      console.error("[ROOMS] Failed to load rooms:", err);
      setError("Server থেকে রুম লোড করা সম্ভব হয়নি।");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL & CONTEXT LOAD
  // ============================================================

  useEffect(() => {
    if (homeLoading) {
      return;
    }

    void loadRooms();
  }, [currentHomeId, homeLoading]);

  // ============================================================
  // CREATE ROOM
  // ============================================================

  const handleCreateRoom = async () => {
    const name = newRoomName.trim();

    if (!name) {
      setActionError("রুমের নাম প্রদান করা আবশ্যক।");
      return;
    }

    if (!currentHomeId) {
      setActionError("কোনো হোম সিলেক্ট করা নেই।");
      return;
    }

    try {
      setCreating(true);
      setActionError("");

      const room = await createRoom(currentHomeId, { name });

      setRooms((current) =>
        [...current, room].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setNewRoomName("");
    } catch (err) {
      console.error("[ROOMS] Failed to create room:", err);
      setActionError("নতুন রুম তৈরি করা সম্ভব হয়নি।");
    } finally {
      setCreating(false);
    }
  };

  // ============================================================
  // START EDIT
  // ============================================================

  const startEditing = (room: Room) => {
    setEditingRoomId(room.id);
    setEditingName(room.name);
    setActionError("");
  };

  // ============================================================
  // CANCEL EDIT
  // ============================================================

  const cancelEditing = () => {
    setEditingRoomId(null);
    setEditingName("");
  };

  // ============================================================
  // SAVE ROOM NAME
  // ============================================================

  const handleUpdateRoom = async (roomId: string) => {
    const name = editingName.trim();

    if (!name) {
      setActionError("রুমের নাম প্রদান করা আবশ্যক।");
      return;
    }

    if (!currentHomeId) {
      setActionError("কোনো হোম সিলেক্ট করা নেই।");
      return;
    }

    try {
      setActionError("");

      const updatedRoom = await updateRoom(currentHomeId, roomId, { name });

      setRooms((current) =>
        current
          .map((room) => (room.id === roomId ? updatedRoom : room))
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      cancelEditing();
    } catch (err) {
      console.error("[ROOMS] Failed to update room:", err);
      setActionError("রুমের নাম পরিবর্তন করা সম্ভব হয়নি।");
    }
  };

  // ============================================================
  // DELETE ROOM
  // ============================================================

  const handleDeleteRoom = async (room: Room) => {
    if (!currentHomeId) {
      setActionError("কোনো হোম সিলেক্ট করা নেই।");
      return;
    }

    const confirmed = window.confirm(`আপনি কি নিশ্চিত যে "${room.name}" রুমটি মুছে ফেলতে চান?`);

    if (!confirmed) {
      return;
    }

    try {
      setActionError("");

      await deleteRoom(currentHomeId, room.id);

      setRooms((current) => current.filter((item) => item.id !== room.id));

      setRoomDevices((current) => {
        const next = { ...current };
        delete next[room.id];
        return next;
      });

      if (expandedRoomId === room.id) {
        setExpandedRoomId(null);
      }
    } catch (err) {
      console.error("[ROOMS] Failed to delete room:", err);
      setActionError("রুমটি মুছে ফেলা সম্ভব হয়নি। নিশ্চিত করুন রুমে কোনো ডিভাইস যুক্ত নেই।");
    }
  };

  // ============================================================
  // LOAD ROOM DEVICES
  // ============================================================

  const handleToggleRoom = async (roomId: string) => {
    if (expandedRoomId === roomId) {
      setExpandedRoomId(null);
      return;
    }

    setExpandedRoomId(roomId);

    if (roomDevices[roomId]) {
      return;
    }

    if (!currentHomeId) {
      setActionError("কোনো হোম সিলেক্ট করা নেই।");
      return;
    }

    try {
      setLoadingDevices((current) => ({
        ...current,
        [roomId]: true,
      }));

      setActionError("");

      const response = await getRoomDevices(currentHomeId, roomId);

      setRoomDevices((current) => ({
        ...current,
        [roomId]: response.devices,
      }));
    } catch (err) {
      console.error("[ROOMS] Failed to load room devices:", err);
      setActionError("রুমের ডিভাইসসমূহ লোড করা সম্ভব হয়নি।");
    } finally {
      setLoadingDevices((current) => ({
        ...current,
        [roomId]: false,
      }));
    }
  };

  // ============================================================
  // ROOM SUMMARY
  // ============================================================

  const totalDevices = useMemo(
    () =>
      Object.values(roomDevices).reduce(
        (total, devices) => total + devices.length,
        0
      ),
    [roomDevices]
  );

  // ============================================================
  // NO SELECTED HOME STATE
  // ============================================================

  if (!homeLoading && !currentHomeId) {
    return (
      <div className="p-6 md:p-8">
        <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-12 text-center">
          <div className="text-4xl">🏡</div>
          <h2 className="mt-4 text-lg font-bold text-white">
            কোনো হোম নির্বাচিত নেই
          </h2>
          <p className="mt-2 text-xs text-white/40">
            রুম ও ডিভাইস দেখতে অনুগ্রহ করে একটি হোম নির্বাচন করুন।
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">
            Home Infrastructure {currentHome ? `• ${currentHome.name}` : ""}
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-wide text-white">
            Room Management
          </h1>

          <p className="mt-2 max-w-2xl text-xs text-white/50">
            Organize smart devices by physical room and manage room assignments.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40">
            Rooms
          </p>

          <p className="mt-1 text-xl font-black text-cyan-400">
            {rooms.length}
          </p>
        </div>
      </div>

      {/* CREATE ROOM */}
      <section className="rounded-3xl border border-white/10 bg-black/30 p-5 shadow-xl backdrop-blur-xl">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-white">
            Create New Room
          </h2>

          <p className="mt-1 text-[11px] text-white/40">
            Add a physical location to your home.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newRoomName}
            onChange={(event) => setNewRoomName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleCreateRoom();
              }
            }}
            placeholder="উদাহরণ: Living Room"
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-cyan-400/50"
          />

          <button
            type="button"
            disabled={creating || !currentHomeId}
            onClick={() => void handleCreateRoom()}
            className="rounded-2xl bg-cyan-400 px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creating ? "Creating..." : "Add Room"}
          </button>
        </div>
      </section>

      {/* ACTION ERROR */}
      {actionError && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          {actionError}
        </div>
      )}

      {/* LOAD ERROR */}
      {error && !loading && (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
          <p className="text-sm text-rose-400">{error}</p>

          <button
            type="button"
            onClick={() => void loadRooms()}
            className="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING */}
      {(loading || homeLoading) && (
        <div className="rounded-3xl border border-white/10 bg-black/30 p-12 text-center">
          <p className="animate-pulse text-sm text-cyan-400">
            Loading rooms...
          </p>
        </div>
      )}

      {/* EMPTY */}
      {!loading && !homeLoading && !error && rooms.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-12 text-center">
          <div className="text-4xl">🏠</div>

          <h2 className="mt-4 text-lg font-bold text-white">
            No Rooms Yet
          </h2>

          <p className="mt-2 text-xs text-white/40">
            Create your first room to start organizing your smart devices.
          </p>
        </div>
      )}

      {/* ROOM GRID */}
      {!loading && !homeLoading && !error && rooms.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {rooms.map((room) => {
            const devices = roomDevices[room.id] ?? [];
            const isExpanded = expandedRoomId === room.id;
            const isEditing = editingRoomId === room.id;
            const isLoadingDevices = loadingDevices[room.id] === true;

            return (
              <article
                key={room.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-xl backdrop-blur-xl"
              >
                {/* ROOM HEADER */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-xl">
                          🏠
                        </div>

                        {isEditing ? (
                          <input
                            autoFocus
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                void handleUpdateRoom(room.id);
                              }
                              if (event.key === "Escape") {
                                cancelEditing();
                              }
                            }}
                            className="min-w-0 flex-1 rounded-xl border border-cyan-400/40 bg-white/5 px-3 py-2 text-sm font-bold text-white outline-none"
                          />
                        ) : (
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-black text-white">
                              {room.name}
                            </h3>
                            <p className="mt-0.5 font-mono text-[9px] text-white/30">
                              {room.id}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/50">
                      {devices.length} device{devices.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleUpdateRoom(room.id)}
                          className="rounded-xl bg-cyan-400 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-950 hover:bg-cyan-300"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(room)}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white"
                        >
                          Rename
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDeleteRoom(room)}
                          className="rounded-xl border border-rose-500/10 bg-rose-500/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10"
                        >
                          Delete
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleToggleRoom(room.id)}
                          className="ml-auto rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-400/10"
                        >
                          {isExpanded ? "Hide Devices" : "View Devices"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* DEVICES */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-black/20 p-5">
                    {isLoadingDevices ? (
                      <p className="animate-pulse text-xs text-cyan-400">
                        Loading room devices...
                      </p>
                    ) : devices.length === 0 ? (
                      <div className="py-6 text-center">
                        <div className="text-3xl">🔌</div>
                        <p className="mt-3 text-xs font-bold text-white/60">
                          No devices assigned
                        </p>
                        <p className="mt-1 text-[10px] text-white/30">
                          Assign devices from the Devices page.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {devices.map((device) => (
                          <div
                            key={device.id}
                            className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-white">
                                {device.device_name}
                              </p>
                              <p className="mt-0.5 font-mono text-[9px] text-cyan-400">
                                {device.device_id}
                              </p>
                            </div>

                            <div className="ml-4 flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  device.status === "ONLINE"
                                    ? "bg-emerald-400"
                                    : "bg-rose-500"
                                }`}
                              />
                              <span className="text-[9px] font-bold uppercase text-white/40">
                                {device.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* SUMMARY */}
      {!loading && !homeLoading && rooms.length > 0 && (
        <div className="border-t border-white/5 pt-5 text-[10px] uppercase tracking-widest text-white/30">
          {rooms.length} room{rooms.length !== 1 ? "s" : ""} • {totalDevices} loaded device
          {totalDevices !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}