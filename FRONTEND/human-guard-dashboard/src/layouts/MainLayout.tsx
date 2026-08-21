import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

const navigationItems = [
  { name: "Dashboard", path: "/", icon: "🏠" },
  { name: "Devices", path: "/devices", icon: "📱" },
  { name: "Analytics", path: "/analytics", icon: "📊" },
  { name: "Activity", path: "/activity", icon: "⏰" },
  { name: "Settings", path: "/settings", icon: "⚙️" },
];

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl">
        {/* BRAND LOGO */}
        <div className="flex h-20 items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 font-bold text-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              ⚡
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-wide text-white">Human Tech</h1>
              <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">Smart Engine</p>
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* USER PROFILE FOOTER */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 border border-white/5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-black text-sm">
              HT
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Enterprise Admin</p>
              <p className="text-[10px] text-emerald-400 font-mono truncate">● System Online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <header className="flex md:hidden items-center justify-between h-16 px-6 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">⚡ Human Tech</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/5 text-white/80 border border-white/10"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </header>

        {/* MOBILE DROPDOWN MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute inset-x-0 top-16 z-50 bg-slate-950/95 border-b border-white/10 p-4 backdrop-blur-2xl space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        )}

        {/* MAIN CONTENT OUTLET */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}