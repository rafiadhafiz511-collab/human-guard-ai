import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { getDevices } from "../api/devices";
import { createHome } from "../api/homes";
import {
  claimDeviceApi,
  validateClaimTokenApi,
  type ValidateClaimTokenResponse,
} from "../api/deviceClaims";
import { useHomeContext } from "../contexts/HomeContext";

type DeviceClaimGateProps = {
  children: ReactNode;
};

export default function DeviceClaimGate({ children }: DeviceClaimGateProps) {
  const {
    homes,
    currentHomeId,
    loading: homeLoading,
    switchHome,
    refreshHomes,
  } = useHomeContext();

  const [checkingDevices, setCheckingDevices] = useState(true);
  const [hasAnyDevice, setHasAnyDevice] = useState(false);

  const [selectedHomeId, setSelectedHomeId] = useState<string>("");
  const [newHomeName, setNewHomeName] = useState("");
  const [creatingHome, setCreatingHome] = useState(false);

  const [token, setToken] = useState("");
  const [validating, setValidating] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [previewInfo, setPreviewInfo] = useState<ValidateClaimTokenResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (currentHomeId) {
      setSelectedHomeId(currentHomeId);
    } else if (homes.length > 0) {
      setSelectedHomeId(homes[0].id);
    }
  }, [currentHomeId, homes]);

  const checkUserDevices = async () => {
    setCheckingDevices(true);
    try {
      const devices = await getDevices();
      setHasAnyDevice(Array.isArray(devices) && devices.length > 0);
    } catch {
      // ইউজারের হোমে ডিভাইস না থাকলে বা 404/খালি লিস্ট আসলে gate সক্রিয় থাকবে
      setHasAnyDevice(false);
    } finally {
      setCheckingDevices(false);
    }
  };

  useEffect(() => {
    if (homeLoading) return;
    void checkUserDevices();
  }, [homeLoading, homes.length, currentHomeId]);

  const handleCreateHome = async () => {
    const trimmed = newHomeName.trim();
    if (!trimmed) {
      setErrorMsg("Please enter a home name first.");
      return;
    }
    setCreatingHome(true);
    setErrorMsg("");
    try {
      const created = await createHome({ name: trimmed });
      await refreshHomes();
      switchHome(created.id);
      setSelectedHomeId(created.id);
      setNewHomeName("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create home.";
      setErrorMsg(message);
    } finally {
      setCreatingHome(false);
    }
  };

  const handleValidateToken = async () => {
    setErrorMsg("");
    setPreviewInfo(null);
    if (!token.trim()) {
      setErrorMsg("Please enter your Device Claim Token / ID.");
      return;
    }
    setValidating(true);
    try {
      const res = await validateClaimTokenApi(token);
      if (res.valid) {
        setPreviewInfo(res);
      } else {
        setErrorMsg("Invalid or expired claim token.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Token validation failed.";
      setErrorMsg(message);
    } finally {
      setValidating(false);
    }
  };

  const handleClaimSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!token.trim()) {
      setErrorMsg("Please enter your Claim Token.");
      return;
    }

    let targetHomeId = selectedHomeId;
    if (!targetHomeId && homes.length > 0) {
      targetHomeId = homes[0].id;
    }

    if (!targetHomeId) {
      setErrorMsg("Please create or select a home first.");
      return;
    }

    setClaiming(true);
    try {
      await claimDeviceApi({
        token: token.trim(),
        home_id: targetHomeId,
      });
      setSuccessMsg("Device claimed successfully! Unlocking dashboard...");
      await refreshHomes();
      await checkUserDevices();
      setHasAnyDevice(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to claim device.";
      setErrorMsg(message);
    } finally {
      setClaiming(false);
    }
  };

  if (homeLoading || checkingDevices) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <p className="text-sm tracking-wide">Checking device activation status...</p>
      </div>
    );
  }

  if (hasAnyDevice) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h1 className="text-xl font-bold text-cyan-400">
          Activate Your Human Tech Device
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Enter your hardware Claim Token to link your ESP32 controller and unlock your dashboard.
        </p>

        {homes.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <label className="block text-xs font-medium text-slate-300">
              Create Home First
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newHomeName}
                onChange={(e) => setNewHomeName(e.target.value)}
                placeholder="e.g. Rajshahi Home"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              />
              <button
                type="button"
                onClick={handleCreateHome}
                disabled={creatingHome}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
              >
                {creatingHome ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-300">
              Target Home
            </label>
            <select
              value={selectedHomeId}
              onChange={(e) => {
                setSelectedHomeId(e.target.value);
                switchHome(e.target.value);
              }}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {homes.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleClaimSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Device Claim Token
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste claim token from device box/setup"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
              <button
                type="button"
                onClick={handleValidateToken}
                disabled={validating}
                className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
              >
                {validating ? "Checking..." : "Verify"}
              </button>
            </div>
          </div>

          {previewInfo && previewInfo.valid && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-200 space-y-1">
              <div>
                <strong>Device ID:</strong> {previewInfo.device_id}
              </div>
              {previewInfo.device_name && (
                <div>
                  <strong>Name:</strong> {previewInfo.device_name}
                </div>
              )}
              {previewInfo.device_type && (
                <div>
                  <strong>Type:</strong> {previewInfo.device_type}
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={claiming || (homes.length === 0 && !selectedHomeId)}
            className="w-full rounded-xl bg-cyan-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            {claiming ? "Activating Device..." : "Claim & Unlock Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}