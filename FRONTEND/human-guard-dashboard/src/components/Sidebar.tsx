import { NavLink } from "react-router-dom";

const menus = [
  {
    name: "Dashboard",
    path: "/",
    icon: "🏠",
  },
  {
    name: "Devices",
    path: "/devices",
    icon: "📷",
  },
  {
    name: "Detections",
    path: "/detections",
    icon: "🚨",
  },
  {
    name: "Settings",
    path: "/settings",
    icon: "⚙️",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen">
      <div className="text-center py-8 border-b border-slate-700">
        <h1 className="text-2xl font-bold">
          Human Guard AI
        </h1>

        <p className="text-sm text-gray-400 mt-2">
          AI Security Platform
        </p>
      </div>

      <nav className="mt-6">
        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            end={menu.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 transition
              ${
                isActive
                  ? "bg-blue-600"
                  : "hover:bg-slate-800"
              }`
            }
          >
            <span>{menu.icon}</span>
            <span>{menu.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}