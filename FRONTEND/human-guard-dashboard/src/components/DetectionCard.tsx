import type { Detection } from "../types";

type Props = {
  detection: Detection;
};

export default function DetectionCard({ detection }: Props) {
  const imageUrl =
    "http://127.0.0.1:8000/" + detection.image_path.replace("app/", "");

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <img
        src={imageUrl}
        alt="Detection"
        className="w-full h-52 object-cover rounded-lg"
      />

      <div className="mt-4 space-y-2">
        <p>
          <strong>Person:</strong> {detection.person ? "Human" : "None"}
        </p>

        <p>
          <strong>Confidence:</strong> {(detection.confidence * 100).toFixed(0)}%
        </p>

        <p>
          <strong>Status:</strong> {detection.alarm ? "🚨 Alarm" : "✅ Safe"}
        </p>

        <p className="text-sm text-gray-500">
          {new Date(detection.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}