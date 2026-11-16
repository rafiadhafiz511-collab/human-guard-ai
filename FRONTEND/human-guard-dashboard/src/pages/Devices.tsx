import { useEffect, useState } from "react";
import api from "../api/client";

import Header from "../components/Header";
import DeviceTable from "../components/DeviceTable";

import type { Device } from "../types";

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/devices/")
      .then((res) => {
        setDevices(Array.isArray(res.data) ? res.data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1">
      <Header />

      <main className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Devices</h2>

          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
            + Add Device
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">Loading...</div>
        ) : (
          <DeviceTable devices={devices} />
        )}
      </main>
    </div>
  );
}