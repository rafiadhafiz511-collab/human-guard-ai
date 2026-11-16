
import { useEffect, useState } from "react";

import api from "../api/client";
import DetectionCard from "../components/DetectionCard";
import type { Detection } from "../types";

export default function Detections() {
  const [detections, setDetections] = useState<Detection[]>([]);

  useEffect(() => {
    api
      .get("/detections/")
      .then((res: { data: Detection[] }) => {
        setDetections(res.data);
      })
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Detection Gallery</h1>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {detections.map((item) => (
          <DetectionCard
            key={item.id}
            detection={item}
          />
        ))}
      </div>
    </div>
  );
}

