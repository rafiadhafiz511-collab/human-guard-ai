import { useState, type FormEvent } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

import { useAuthContext } from "../contexts/AuthContext";
import { useHomeContext } from "../contexts/HomeContext";

const navigationItems = [
  { name: "Dashboard", path: "/", icon: "⌂" },
  { name: "Devices", path: "/devices", icon: "▣" },
  { name: "Rooms", path: "/rooms", icon: "▤" },
  { name: "Analytics", path: "/analytics", icon: "▥" },
  { name: "Activity", path: "/activity", icon: "◷" },
  { name: "Settings", path: "/settings", icon: "⚙" },
];

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCreateHome, setShowCreateHome] = useState(false);
  const [newHomeName, setNewHomeName] = useState("");
  const [creatingHome, setCreatingHome] = useState(false);
  const [createHomeError, setCreateHomeError] = useState("");

  const location = useLocation();

  const { user, logout } = useAuthContext();

  const {
    homes,
    currentHome,
    currentHomeId,
    loading: homesLoading,
    switchHome,
    addHome,
  } = useHomeContext();

  async function handleCreateHome(event: FormEvent) {
    event.preventDefault();
    const trimmed = newHomeName.trim();
    if (!trimmed) {
      setCreateHomeError("Home name is required");
      return;
    }

    try {
      setCreatingHome(true);
      setCreateHomeError("");
      await addHome(trimmed);
      setNewHomeName("");
      setShowCreateHome(false);
    } catch (err: any) {
      setCreateHomeError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to create home"
      );
    } finally {
      setCreatingHome(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans text-white">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl md:flex">
        {/* BRAND */}
        <div className="flex h-20 items-center border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-lg font-bold text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              ⚡
            </div>

            <div>
              <h1 className="text-base font-extrabold tracking-wide text-white">
                Human Tech
              </h1>

              <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
                Smart Engine
              </p>
            </div>
          </div>
        </div>

        {/* HOME SELECTOR */}
        <div className="border-b border-white/10 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
              Active Home
            </p>

            <button
              type="button"
              onClick={() => {
                setShowCreateHome((prev) => !prev);
                setCreateHomeError("");
              }}
              className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300 transition hover:bg-cyan-500/20"
            >
              {showCreateHome ? "Cancel" : "+ New"}
            </button>
          </div>

          {homesLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="animate-pulse text-xs text-cyan-400">
                Loading homes...
              </p>
            </div>
          ) : homes.length === 0 ? (
            <div className="space-y-2.5 rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-500/5 p-3">
              <p className="text-xs text-white/60">
                No homes yet. Create your first home:
              </p>

              <form onSubmit={handleCreateHome} className="space-y-2">
                <input
                  type="text"
                  value={newHomeName}
                  onChange={(e) => {
                    setNewHomeName(e.target.value);
                    setCreateHomeError("");
                  }}
                  placeholder="e.g. Main Home"
                  disabled={creatingHome}
                  className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={creatingHome || !newHomeName.trim()}
                  className="w-full rounded-xl bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
                >
                  {creatingHome ? "Creating..." : "Create Home"}
                </button>
              </form>

              {createHomeError && (
                <p className="text-[11px] text-rose-300">
                  {createHomeError}
                </p>
              )}
            </div>
          ) : (
            <>
              <select
                value={currentHomeId ?? ""}
                onChange={(event) =>
                  switchHome(event.target.value)
                }
                className="w-full cursor-pointer rounded-2xl border border-cyan-400/20 bg-slate-900 px-3 py-3 text-xs font-bold text-white outline-none transition focus:border-cyan-400/50"
              >
                {homes.map((home) => (
                  <option
                    key={home.id}
                    value={home.id}
                    className="bg-slate-900 text-white"
                  >
                    {home.name}
                  </option>
                ))}
              </select>

              {showCreateHome && (
                <form
                  onSubmit={handleCreateHome}
                  className="mt-2.5 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-2.5"
                >
                  <input
                    type="text"
                    value={newHomeName}
                    onChange={(e) => {
                      setNewHomeName(e.target.value);
                      setCreateHomeError("");
                    }}
                    placeholder="New home name..."
                    disabled={creatingHome}
                    className="w-full rounded-xl border border-white/15 bg-slate-900 px-2.5 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={creatingHome || !newHomeName.trim()}
                    className="w-full rounded-xl bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {creatingHome ? "Creating..." : "Save Home"}
                  </button>
                  {createHomeError && (
                    <p className="text-[11px] text-rose-300">
                      {createHomeError}
                    </p>
                  )}
                </form>
              )}
            </>
          )}

          {currentHome && (
            <p className="mt-2 truncate font-mono text-[8px] text-white/20">
              {currentHome.id}
            </p>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          {navigationItems.map((item) => {
            const isActive =
              location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? "border border-cyan-500/30 bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="w-5 text-center text-lg">
                  {item.icon}
                </span>

                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* USER PROFILE */}
        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-sm font-bold text-black">
                {(user?.name || user?.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">
                  {user?.name || user?.email || "User"}
                </p>

                <p className="truncate font-mono text-[10px] text-emerald-400">
                  ● System Online
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/50 transition hover:bg-rose-500/10 hover:text-rose-300"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {/* MOBILE HEADER */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-6 backdrop-blur-xl md:hidden">
          <div>
            <span className="font-bold text-cyan-400">
              ⚡ Human Tech
            </span>

            {currentHome && (
              <p className="mt-0.5 max-w-[180px] truncate text-[9px] text-white/40">
                {currentHome.name}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen((open) => !open)
            }
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </header>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="absolute inset-x-0 top-16 z-50 space-y-3 border-b border-white/10 bg-slate-950/95 p-4 backdrop-blur-2xl md:hidden">
            {/* MOBILE HOME SELECTOR */}
            {homes.length > 0 && (
              <div className="border-b border-white/10 pb-3">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-white/30">
                  Active Home
                </p>

                <select
                  value={currentHomeId ?? ""}
                  onChange={(event) =>
                    switchHome(event.target.value)
                  }
                  className="w-full rounded-xl border border-cyan-400/20 bg-slate-900 px-3 py-3 text-xs font-bold text-white outline-none"
                >
                  {homes.map((home) => (
                    <option
                      key={home.id}
                      value={home.id}
                      className="bg-slate-900 text-white"
                    >
                      {home.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* MOBILE NAVIGATION */}
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
                  location.pathname === item.path
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            ))}

            <button
              type="button"
              onClick={logout}
              className="w-full rounded-xl border border-rose-500/10 bg-rose-500/5 px-4 py-3 text-left text-sm font-semibold text-rose-300"
            >
              Logout
            </button>
          </div>
        )}

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}