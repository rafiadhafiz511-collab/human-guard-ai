import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardStats } from "../../types";

type Props = {
  commands: DashboardStats["commands"];
};

export default function CommandActivityChart({
  commands,
}: Props) {
  const data = [
    {
      name: "Pending",
      value: commands.pending,
    },
    {
      name: "Sent",
      value: commands.sent,
    },
    {
      name: "Completed",
      value: commands.completed,
    },
    {
      name: "Failed",
      value: commands.failed,
    },
    {
      name: "Cancelled",
      value: commands.cancelled,
    },
  ];

  return (
    <section className="rounded-3xl border border-theme-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-text-main">
          Command Activity
        </h2>

        <p className="mt-1 text-xs text-muted">
          Current device command execution status
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: -20,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-theme-border"
            />

            <XAxis
              dataKey="name"
              tick={{
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
              className="fill-muted"
            />

            <YAxis
              allowDecimals={false}
              tick={{
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
              className="fill-muted"
            />

            <Tooltip
              cursor={{
                fill: "rgba(148, 163, 184, 0.08)",
              }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid var(--theme-border)",
                backgroundColor: "var(--card)",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.08)",
              }}
            />

            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              fill="currentColor"
              className="text-accent"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-theme-border pt-4">
        <span className="text-xs text-muted">
          Total Commands
        </span>

        <span className="text-sm font-bold text-text-main">
          {commands.total}
        </span>
      </div>
    </section>
  );
}