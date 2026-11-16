import { useEffect, useState } from "react";
import api from "../api/client";

import StatCard from "../components/StatCard";
import DetectionTable from "../components/DetectionTable";

import type { Detection } from "../types";

type DashboardStats = {
  detections: {
    total: number;
    humans: number;
    alarms: number;
    today: number;
    today_humans: number;
    today_alarms: number;
  };
  devices: {
    total: number;
    online: number;
    offline: number;
  };
  commands: {
    total: number;
    pending: number;
    sent: number;
    completed: number;
    failed: number;
  };
  latest_detection: string | null;
  latest_command: unknown;
  server_time: string;
  offline_after_seconds: number;
};

export default function Dashboard() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    detections: {
      total: 0,
      humans: 0,
      alarms: 0,
      today: 0,
      today_humans: 0,
      today_alarms: 0,
    },
    devices: {
      total: 0,
      online: 0,
      offline: 0,
    },
    commands: {
      total: 0,
      pending: 0,
      sent: 0,
      completed: 0,
      failed: 0,
    },
    latest_detection: null,
    latest_command: null,
    server_time: "",
    offline_after_seconds: 60,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, detectionsRes] = await Promise.all([
          api.get("/dashboard/"),
          api.get("/detections/"),
        ]);

        setStats(statsRes.data);

        setDetections(detectionsRes.data.data ?? detectionsRes.data ?? []);
      } catch (err) {
        console.error("Dashboard loading error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-8">
        Human Guard Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

        <StatCard
          title="Total Detections"
          value={stats.detections.total}
          icon={<span className="text-3xl">📊</span>}
        />

        <StatCard
          title="Humans"
          value={stats.detections.humans}
          icon={<span className="text-3xl">👥</span>}
        />

        <StatCard
          title="Alarms"
          value={stats.detections.alarms}
          icon={<span className="text-3xl">🚨</span>}
        />

        <StatCard
          title="Devices"
          value={stats.devices.total}
          icon={<span className="text-3xl">📷</span>}
        />

      </div>

      {loading ? (
        <div className="text-center py-20 text-xl">
          Loading...
        </div>
      ) : (
        <DetectionTable detections={detections} />
      )}
    </main>
  );
}