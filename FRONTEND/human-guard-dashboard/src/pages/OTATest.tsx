import { useState } from "react";

import { requestDeviceOTA } from "../api/firmware";

export default function OTATest() {
  const [deviceId, setDeviceId] = useState("");
  const [firmwareId, setFirmwareId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");

  async function handleOTA() {
    setError("");
    setResult(null);

    if (!deviceId.trim()) {
      setError("Device ID is required");
      return;
    }

    if (!firmwareId.trim()) {
      setError("Firmware ID is required");
      return;
    }

    const parsedFirmwareId = Number(firmwareId);

    if (!Number.isInteger(parsedFirmwareId)) {
      setError("Firmware ID must be a number");
      return;
    }

    try {
      setLoading(true);

      const response = await requestDeviceOTA(
        deviceId.trim(),
        parsedFirmwareId,
      );

      setResult(response);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "OTA request failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>OTA Test</h1>

      <div>
        <label>Device ID</label>
        <input
          type="text"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="ESP32-PUMP-001"
        />
      </div>

      <div>
        <label>Firmware ID</label>
        <input
          type="number"
          value={firmwareId}
          onChange={(e) => setFirmwareId(e.target.value)}
          placeholder="1"
        />
      </div>

      <button onClick={handleOTA} disabled={loading}>
        {loading ? "Sending OTA Request..." : "Request OTA"}
      </button>

      {error && (
        <div>
          <strong>Error:</strong>
          <pre>{error}</pre>
        </div>
      )}

      {result !== null && (
        <div>
          <strong>Backend Response:</strong>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
