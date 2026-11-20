import type { Detection } from "../types";

type Props = {
  detections: Detection[];
};

export default function DetectionTable({ detections }: Props) {
  if (!Array.isArray(detections) || detections.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">
          Recent Detections
        </h3>

        <p className="mt-2 text-slate-500">
          No detections found.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <div className="border-b p-5">
        <h2 className="text-xl font-semibold text-slate-800">
          Recent Detections
        </h2>
      </div>

      <table className="w-full text-left">
        <thead className="border-b bg-slate-50">
          <tr>
            <th className="p-4">Image</th>
            <th className="p-4">Date</th>
            <th className="p-4">Person</th>
            <th className="p-4">Confidence</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>

        <tbody>
          {detections.map((detection) => (
            <tr
              key={detection.id}
              className="border-b last:border-b-0 hover:bg-slate-50"
            >
              <td className="p-4">
                <div className="h-16 w-24 overflow-hidden rounded-lg bg-slate-100">
                  {detection.image_path ? (
                    <img
                      src={`http://127.0.0.1:8000/${detection.image_path.replace(
                        "app/",
                        ""
                      )}`}
                      alt="Detection"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No Image
                    </div>
                  )}
                </div>
              </td>

              <td className="p-4 text-sm text-slate-600">
                new Date(detection.created_at || detection.detected_at || "")
              </td>

              <td className="p-4">
                {detection.person ? (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                    Human
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    None
                  </span>
                )}
              </td>

              <td className="p-4">
                ((detection.confidence ?? 0) * 100).toFixed(0)
              </td>

              <td className="p-4">
                {detection.alarm ? (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
                    🚨 Alarm
                  </span>
                ) : (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                    ✅ Safe
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}