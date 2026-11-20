import type { Detection } from "../types";

type Props = {
  detection: Detection;
};

export default function DetectionCard({ detection }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm transition hover:shadow-md">
      {detection.image_url && (
        <img
          src={detection.image_url}
          alt={detection.label || "Detection"}
          className="h-48 w-full rounded-xl object-cover"
        />
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800 dark:text-white">
            {detection.label || "Detection Event"}
          </span>
          {detection.confidence !== undefined && (
            <span className="rounded-md bg-cyan-50 dark:bg-cyan-500/10 px-2 py-1 text-xs font-bold text-cyan-600 dark:text-cyan-400">
              {(detection.confidence * 100).toFixed(1)}%
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono">ID: {detection.id}</span>
          {detection.alarm && (
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 font-bold text-rose-500">
              ALARM
            </span>
          )}
        </div>
      </div>
    </div>
  );
}