import type { Device } from "../types";

type Props = {
  devices: Device[];
};

export default function DeviceTable({ devices }: Props) {
  if (!Array.isArray(devices) || devices.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">
          Devices
        </h3>

        <p className="mt-2 text-slate-500">
          No devices found.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <div className="border-b p-5">
        <h2 className="text-xl font-semibold text-slate-800">
          Devices
        </h2>
      </div>

      <table className="w-full text-left">
        <thead className="border-b bg-slate-50">
          <tr>
            <th className="p-4">Device</th>
            <th className="p-4">Device ID</th>
            <th className="p-4">Firmware</th>
            <th className="p-4">Status</th>
            <th className="p-4">Last Seen</th>
            <th className="p-4">Command</th>
            <th className="p-4">Action</th>
          </tr>
        </thead>

        <tbody>
          {devices.map((device) => (
            <tr
              key={device.id}
              className="border-b last:border-b-0 hover:bg-slate-50"
            >
              <td className="p-4">
                <div>
                  <p className="font-semibold text-slate-800">
                    {device.device_name}
                  </p>

                  <p className="text-sm text-slate-500">
                    Security Camera
                  </p>
                </div>
              </td>

              <td className="p-4 font-mono text-sm">
                {device.device_id}
              </td>

              <td className="p-4">
                {device.firmware_version ?? "-"}
              </td>

              <td className="p-4">
                {device.status === "online" ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                    🟢 Online
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
                    🔴 Offline
                  </span>
                )}
              </td>

              <td className="p-4 text-sm text-slate-600">
                {device.last_seen
                  ? new Date(device.last_seen).toLocaleString()
                  : "-"}
              </td>

              <td className="p-4">
                {device.pending_command ? (
                  <span className="rounded bg-yellow-100 px-2 py-1 text-sm text-yellow-700">
                    {device.pending_command}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">
                    None
                  </span>
                )}
              </td>

              <td className="p-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}