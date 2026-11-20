import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTheme, THEMES } from "../contexts/ThemeContext";

export default function Sidebar() {
  const { theme, setTheme } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);

  const navItems = [
    {
      to: "/",
      label: "Dashboard",
      icon: "🏠",
      end: true,
    },
    {
      to: "/devices",
      label: "Devices",
      icon: "📱",
      end: false,
    },
    {
      to: "/schedules",
      label: "Schedules",
      icon: "⏰",
      end: false,
    },
    {
      to: "/activity",
      label: "Activity",
      icon: "📊",
      end: false,
    },
    {
      to: "/settings",
      label: "Settings",
      icon: "⚙️",
      end: false,
    },
  ];

  return (
    <aside
      style={{
        backgroundColor: "var(--bg-card)",
        color: "var(--text-main)",
        borderColor: "var(--border-color)",
      }}
      className="relative flex h-screen w-64 flex-col justify-between border-r p-4 transition-colors duration-300"
    >
      <div>
        {/* Header */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div
            style={{ backgroundColor: "var(--accent)" }}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold text-white shadow-md"
          >
            ⚡
          </div>

          <div>
            <h2 className="font-bold tracking-tight">
              Human Tech
            </h2>

            <p
              style={{ color: "var(--text-muted)" }}
              className="text-xs"
            >
              Smart Home AI
            </p>
          </div>
        </div>

        {/* Menu */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition"
              style={({ isActive }) => ({
                backgroundColor: isActive
                  ? "var(--bg-main)"
                  : "transparent",
                color: isActive
                  ? "var(--accent)"
                  : "var(--text-muted)",
                fontWeight: isActive ? 600 : 500,
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Theme Switcher */}
      <div
        style={{ borderColor: "var(--border-color)" }}
        className="relative border-t pt-4"
      >
        <button
          type="button"
          onClick={() =>
            setShowThemePicker(!showThemePicker)
          }
          style={{
            backgroundColor: "var(--bg-main)",
            borderColor: "var(--border-color)",
            color: "var(--text-main)",
          }}
          className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition"
        >
          <div className="flex items-center gap-2">
            <span>🎨</span>
            <span>Theme</span>
          </div>

          <span
            style={{ color: "var(--text-muted)" }}
            className="text-xs capitalize"
          >
            {
              THEMES.find(
                (t: any) => t.id === theme
              )?.name
            }{" "}
            ▼
          </span>
        </button>

        {/* Dropdown Menu */}
        {showThemePicker && (
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-color)",
            }}
            className="absolute bottom-16 left-0 right-0 z-50 max-h-64 overflow-y-auto rounded-2xl border p-2 shadow-2xl"
          >
            <p
              style={{ color: "var(--text-muted)" }}
              className="px-2 py-1.5 text-[10px] font-bold uppercase"
            >
              Select Theme
            </p>

            <div className="space-y-1">
              {THEMES.map((t: any) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setShowThemePicker(false);
                  }}
                  style={{
                    backgroundColor:
                      theme === t.id
                        ? "var(--accent)"
                        : "transparent",
                    color:
                      theme === t.id
                        ? "#ffffff"
                        : "var(--text-main)",
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-80"
                >
                  <span className="flex items-center gap-2">
                    <span>{t.icon}</span>
                    <span>{t.name}</span>
                  </span>

                  <span
                    className={`h-3 w-3 rounded-full border ${t.bgPreview}`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}