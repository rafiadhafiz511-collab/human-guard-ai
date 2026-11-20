import { useCallback, useEffect, useState } from "react";
import api from "../api/client";

type Home = {
  id: string;
  name: string;
};

type Member = {
  user_id: string;
  email: string;
  role?: string;
};

export default function Settings() {
  // Existing state variables
  const [mqttBroker, setMqttBroker] = useState("mqtt.humanguard.ai");
  const [mqttPort, setMqttPort] = useState("8883");
  const [apiKey, setApiKey] = useState("hg_live_99a8b7c6d5e4f3a2b1");
  const [notifications, setNotifications] = useState({
    email: true,
    telegram: false,
    criticalAlertsOnly: true,
  });

  // Home & Member Management states
  const [homes, setHomes] = useState<Home[]>([]);
  const [selectedHomeId, setSelectedHomeId] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // New member input states
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [memberMsg, setMemberMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // ১. হোমের মেম্বার লিস্ট ফ্রেচ করা
  const fetchMembers = useCallback(async (homeId: string) => {
    if (!homeId || homeId === "default-home") return;
    try {
      setLoadingMembers(true);
      const res = await api.get(`/homes/${homeId}/members`);
      const fetchedMembers = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setMembers(fetchedMembers);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  // ২. ইউজারদের হোমস ফ্রেচ করা (এন্ডপয়েন্ট না থাকলেও ফলব্যাক হ্যান্ডেল করবে)
  const fetchHomes = useCallback(async () => {
    try {
      const res = await api.get("/homes/");
      let fetchedHomes = Array.isArray(res.data) ? res.data : res.data?.data || [];

      if (fetchedHomes.length === 0) {
        try {
          const createRes = await api.post("/homes/", { name: "My Smart Building" });
          if (createRes.data) {
            fetchedHomes = [createRes.data];
          }
        } catch (e) {
          // Backend POST call fail করলেও UI যেন না আটকায়
          fetchedHomes = [{ id: "default-home", name: "Main Building" }];
        }
      }

      setHomes(fetchedHomes);
      if (fetchedHomes.length > 0) {
        const firstHomeId = fetchedHomes[0].id || "default-home";
        setSelectedHomeId(firstHomeId);
        if (firstHomeId !== "default-home") {
          fetchMembers(firstHomeId);
        }
      }
    } catch (err) {
      console.error("Failed to fetch homes, using fallback:", err);
      const fallbackHomes = [{ id: "default-home", name: "Main Building" }];
      setHomes(fallbackHomes);
      setSelectedHomeId("default-home");
    }
  }, [fetchMembers]);

  useEffect(() => {
    fetchHomes();
  }, [fetchHomes]);

  // ৩. ইউজার যোগ করার ফাংশন
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) {
      setMemberMsg({ text: "অনুগ্রহ করে একটি ইমেইল দিন।", isError: true });
      return;
    }

    let activeHomeId = selectedHomeId;

    if (!activeHomeId && homes.length > 0) {
      activeHomeId = homes[0].id;
    }

    try {
      setActionLoading(true);
      setMemberMsg(null);

      // যদি ব্যাকএন্ডে হোম তৈরি করা না থাকে, তবে প্রথমে একটি হোম বানিয়ে নেওয়া হবে
      if (activeHomeId === "default-home") {
        try {
          const createHomeRes = await api.post("/homes/", { name: "Main Building" });
          if (createHomeRes.data?.id) {
            activeHomeId = createHomeRes.data.id;
            setSelectedHomeId(activeHomeId);
          }
        } catch (err) {
          console.warn("Could not create home automatically, trying direct member add");
        }
      }

      await api.post(`/homes/${activeHomeId}/members`, {
        email: newMemberEmail,
        role: "member",
      });

      setMemberMsg({ text: "ইউজার সফলভাবে যুক্ত করা হয়েছে!", isError: false });
      setNewMemberEmail("");
      if (activeHomeId !== "default-home") {
        fetchMembers(activeHomeId);
      }
    } catch (err: any) {
      console.error("Failed to add user:", err);
      setMemberMsg({
        text: err.response?.data?.detail || "ইউজার যুক্ত করতে সমস্যা হয়েছে। Backend API চেক করুন।",
        isError: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ৪. ইউজার ডিলিট করার ফাংশন
  const handleRemoveUser = async (userId: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই ইউজারকে মুছে ফেলতে চান?")) return;

    try {
      await api.delete(`/homes/${selectedHomeId}/members/${userId}`);
      setMemberMsg({ text: "ইউজার সফলভাবে মুছে ফেলা হয়েছে!", isError: false });
      fetchMembers(selectedHomeId);
    } catch (err: any) {
      console.error("Failed to remove user:", err);
      setMemberMsg({
        text: err.response?.data?.detail || "ইউজার মুছে ফেলতে সমস্যা হয়েছে।",
        isError: true,
      });
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Settings updated successfully!");
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-wide">
          System Settings
        </h1>
        <p className="mt-1 text-xs text-white/50">
          Manage system configurations, hardware gateway, and security keys
        </p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* BUILDING & USER ACCESS CONTROL */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest font-mono">
                Building & Access Control
              </h2>
              <p className="text-[11px] text-white/50 mt-0.5">
                Add new users to your building or remove existing users
              </p>
            </div>

            {homes.length > 1 && (
              <select
                value={selectedHomeId}
                onChange={(e) => {
                  setSelectedHomeId(e.target.value);
                  fetchMembers(e.target.value);
                }}
                className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-cyan-400 outline-none font-mono"
              >
                {homes.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ADD USER FORM */}
          <form onSubmit={handleAddUser} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="text-[11px] font-semibold text-white/60 block mb-1">
                User Email Address
              </label>
              <input
                type="email"
                required
                placeholder="enter_user_email@gmail.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-white font-mono outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 text-xs font-bold text-black hover:bg-cyan-400 transition disabled:opacity-50 font-mono"
            >
              {actionLoading ? "Adding..." : "+ Add User"}
            </button>
          </form>

          {memberMsg && (
            <div
              className={`rounded-xl border p-3 text-xs ${
                memberMsg.isError
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {memberMsg.text}
            </div>
          )}

          {/* USERS LIST TABLE */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/40 font-mono">
                <tr>
                  <th className="pb-2">User Email</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {loadingMembers ? (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-white/40 font-sans">
                      Loading building users...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-white/40 font-sans">
                      No users assigned to this building yet.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.user_id} className="hover:bg-white/5">
                      <td className="py-3 text-white font-sans">{m.email || m.user_id}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(m.user_id)}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MQTT & OTHER SYSTEM SETTINGS */}
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* MQTT BROKER CONFIGURATION */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl shadow-xl">
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest font-mono mb-4">
              MQTT Gateway Configuration
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-white/60">Broker Address</label>
                <input
                  type="text"
                  value={mqttBroker}
                  onChange={(e) => setMqttBroker(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-white font-mono outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/60">Port</label>
                <input
                  type="text"
                  value={mqttPort}
                  onChange={(e) => setMqttPort(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-white font-mono outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* API & SECURITY */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl shadow-xl">
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest font-mono mb-4">
              API & Authentication
            </h2>
            <div>
              <label className="text-xs font-semibold text-white/60">Secret API Key</label>
              <div className="flex gap-3 mt-1">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-white font-mono outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(apiKey)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-white/80 hover:bg-white/10"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest font-mono mb-2">
              Notification Preferences
            </h2>
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <div className="text-xs font-bold text-white">Email Alerts</div>
                <div className="text-[10px] text-white/50">Receive system reports via email</div>
              </div>
              <button
                type="button"
                onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.email ? "bg-cyan-500" : "bg-white/10"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.email ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <div className="text-xs font-bold text-white">Telegram Bot Alerts</div>
                <div className="text-[10px] text-white/50">Get instant trigger messages on Telegram</div>
              </div>
              <button
                type="button"
                onClick={() => setNotifications({ ...notifications, telegram: !notifications.telegram })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.telegram ? "bg-cyan-500" : "bg-white/10"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.telegram ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="rounded-2xl bg-cyan-500 px-6 py-3 text-xs font-bold text-black transition hover:bg-cyan-400 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}