import React, { useCallback, useEffect, useState } from "react";

const API_BASE = "https://human-guard-ai-api.onrender.com";
const AUTH_STORAGE_KEY = "sb-ljgnscuhcxobimuwlrzf-auth-token";

interface ChannelInfo {
  id: string;
  device_id: string;
  channel_number?: number;
  name?: string;
  type?: string;
  state?: string | null;
}

interface RoomLightControlProps {
  deviceId?: string;
  channelId?: string;
  label?: string;
  pollIntervalMs?: number;
}

function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.access_token === "string" ? parsed.access_token : null;
  } catch {
    return null;
  }
}

export const RoomLightControl: React.FC<RoomLightControlProps> = ({
  deviceId = "ESP32S3_01",
  channelId = "f3497fc706a64884acf5ef7d50dc93ed",
  label = "Room Light S3",
  pollIntervalMs = 4000,
}) => {
  const [channelState, setChannelState] = useState<"ON" | "OFF" | "UNKNOWN">("UNKNOWN");
  const [statusNote, setStatusNote] = useState<string>("Ready");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [awaitingAck, setAwaitingAck] = useState<boolean>(false);

  const syncChannelState = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setErrorMsg("Session expired or not logged in. Please sign in again.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/devices/${deviceId}/channels`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        setErrorMsg("Authentication failed (401/403). Please log in again.");
        return;
      }

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      const list: ChannelInfo[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.channels)
        ? data.channels
        : [];

      const target = list.find((ch) => ch.id === channelId);
      if (target?.state) {
        const normalized = target.state.toUpperCase();
        if (normalized === "ON" || normalized === "OFF") {
          setChannelState((prev) => {
            if (awaitingAck && prev !== normalized) {
              setAwaitingAck(false);
              setStatusNote(`ACK received • State: ${normalized}`);
            } else if (!awaitingAck) {
              setStatusNote(`Synced • State: ${normalized}`);
            }
            return normalized;
          });
          setErrorMsg(null);
        }
      }
    } catch {
      // Transient network hiccup during background polling is ignored until user action
    }
  }, [deviceId, channelId, awaitingAck]);

  useEffect(() => {
    syncChannelState();
    const timer = setInterval(syncChannelState, pollIntervalMs);
    return () => clearInterval(timer);
  }, [syncChannelState, pollIntervalMs]);

  const handleCommand = async (command: "ON" | "OFF") => {
    setErrorMsg(null);
    const token = getAccessToken();
    if (!token) {
      setErrorMsg("No active auth token found. Please log in first.");
      return;
    }

    setIsSending(true);
    setStatusNote(`Sending ${command}...`);

    try {
      const url = `${API_BASE}/api/v1/devices/${deviceId}/channels/${channelId}/command?command=${command}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        setIsSending(false);
        setAwaitingAck(false);
        setStatusNote("Auth failed");
        setErrorMsg("Session expired or unauthorized. Please sign in again.");
        return;
      }

      if (!res.ok) {
        const errBody = await res.text();
        setIsSending(false);
        setAwaitingAck(false);
        setStatusNote("Command failed");
        setErrorMsg(`Server error (${res.status}): ${errBody || "Unable to send command"}`);
        return;
      }

      setIsSending(false);
      setAwaitingAck(true);
      setStatusNote(`Pending ACK (${command})...`);

      setTimeout(() => {
        syncChannelState();
      }, 1500);
    } catch {
      setIsSending(false);
      setAwaitingAck(false);
      setStatusNote("Network error");
      setErrorMsg("Network error while sending command. Check internet or server connection.");
    }
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-3 text-zinc-100 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-zinc-400">
            Channel: <span className="font-mono text-zinc-300">{channelId.slice(0, 8)}…</span>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
            channelState === "ON"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : channelState === "OFF"
              ? "bg-zinc-700/60 text-zinc-300 border border-zinc-600"
              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
          }`}
        >
          {channelState}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isSending}
          onClick={() => handleCommand("ON")}
          className="flex-1 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition"
        >
          {isSending ? "Sending..." : "Turn ON"}
        </button>

        <button
          type="button"
          disabled={isSending}
          onClick={() => handleCommand("OFF")}
          className="flex-1 px-3 py-1.5 rounded text-xs font-semibold bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white transition"
        >
          {isSending ? "Sending..." : "Turn OFF"}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>{statusNote}</span>
        {awaitingAck && <span className="text-amber-300 animate-pulse">Waiting for ACK</span>}
      </div>

      {errorMsg && (
        <div className="rounded bg-red-500/15 border border-red-500/40 px-2.5 py-1.5 text-xs text-red-300">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
