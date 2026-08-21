import { useEffect, useState } from "react";
import api from "../api/client";

type Command = {
  id: string;
  device_id: string;
  command: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  completed_at: string | null;
};

function statusStyle(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "sent":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-green-100 text-green-700";
    case "failed":
      return "bg-red-100 text-red-700";
    case "cancelled":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function commandLabel(command: string) {
  switch (command) {
    case "PUMP_ON":
      return "💧 Pump ON";

    case "PUMP_OFF":
      return "⛔ Pump OFF";

    case "AUTO_MODE":
      return "🤖 Auto Mode";

    case "MANUAL_MODE":
      return "🖐️ Manual Mode";

    default:
      return command;
  }
}

export default function CommandActivity() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCommands() {
      try {
        const response = await api.get("/devices/CAM001/commands");
        setCommands(response.data);
      } catch (error) {
        console.error("Command history loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCommands();
  }, []);

  if (loading) {
    return (
      <main className="p-8">
        <div className="text-center py-20 text-xl">
          Loading command history...
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Command Activity
        </h1>

        <p className="text-slate-500 mt-1">
          Smart pump command history
        </p>
      </div>

      {/* Empty state */}
      {commands.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-slate-500">
            No commands found.
          </p>
        </div>
      ) : (
        /* Command table */
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-4">Command</th>
                  <th className="p-4">Device</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Sent</th>
                  <th className="p-4">Completed</th>
                </tr>
              </thead>

              <tbody>
                {commands.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="p-4 font-semibold">
                      {commandLabel(item.command)}
                    </td>

                    <td className="p-4">
                      {item.device_id}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="p-4 text-sm text-slate-600">
                      {new Date(
                        item.created_at
                      ).toLocaleString()}
                    </td>

                    <td className="p-4 text-sm text-slate-600">
                      {item.sent_at
                        ? new Date(
                            item.sent_at
                          ).toLocaleString()
                        : "—"}
                    </td>

                    <td className="p-4 text-sm text-slate-600">
                      {item.completed_at
                        ? new Date(
                            item.completed_at
                          ).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}