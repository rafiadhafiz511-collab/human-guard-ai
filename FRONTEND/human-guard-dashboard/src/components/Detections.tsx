import { useEffect, useState } from "react";
import api from "../api/client";
import type { Detection } from "../types";

export default function Detections() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchDetections() {
    try {
      const response = await api.get("/detections");
      setDetections(response.data);
    } catch (error) {
      console.error("Error fetching detections:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetections();
    const interval = setInterval(fetchDetections, 5000); // প্রতি ৫ সেকেন্ডে রিফ্রেশ
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-white/50">
        লোডিং ডিটেকশন ডেটা...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">AI Detections</h2>

      {detections.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center text-white/40">
          কোনো ডিটেকশন রেকর্ড পাওয়া যায়নি।
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {detections.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl"
            >
              {item.image_url && (
                <img
                  src={
                    item.image_url.startsWith("http")
                      ? item.image_url
                      : `${import.meta.env.VITE_API_URL || ""}${item.image_url}`
                  }
                  alt={item.label || "AI detection"}
                  className="mb-3 h-40 w-full rounded-xl object-cover"
                />
              )}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-400">{item.label || "Detection event"}</span>
                <span className="text-xs text-white/50">
                  {((item.confidence ?? 0) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="mt-1 text-xs text-white/40">
                {item.detected_at || item.created_at
                  ? new Date(item.detected_at || item.created_at!).toLocaleString()
                  : "Timestamp unavailable"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
