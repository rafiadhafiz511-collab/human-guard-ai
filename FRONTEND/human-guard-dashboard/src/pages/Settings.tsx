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
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Home & Member Management states
  const [homes, setHomes] = useState<Home[]>([]);
  const [selectedHomeId, setSelectedHomeId] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // New member input states
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [memberMsg, setMemberMsg] = useState<{ text: string; isError: boolean } | null>(null);

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
        } catch {
          fetchedHomes = [{ id: "default-home", name: "Main Building" }];
        }
      }

      setHomes(fetchedHomes);
      if (fetchedHomes.length > 0) {
        const firstHomeId = fetchedHomes[0].id || "default-home";
        setSelectedHomeId(firstHomeId);
        if (firstHomeId !== "default-home") {
          void fetchMembers(firstHomeId);
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
    void fetchHomes();
  }, [fetchHomes]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) {
      setMemberMsg({ text: "Please enter a valid email address.", isError: true });
      return;
    }

    let activeHomeId = selectedHomeId;
    if (!activeHomeId && homes.length > 0) {
      activeHomeId = homes[0].id;
    }

    try {
      setActionLoading(true);
      setMemberMsg(null);

      if (activeHomeId === "default-home") {
        try {
          const createHomeRes = await api.post("/homes/", { name: "Main Building" });
          if (createHomeRes.data?.id) {
            activeHomeId = createHomeRes.data.id;
            setSelectedHomeId(activeHomeId);
          }
        } catch {
          // Proceed with direct member add attempt if home creation fails
        }
      }

      await api.post(`/homes/${activeHomeId}/members`, {
        email: newMemberEmail,
        role: "member",
      });

      setMemberMsg({ text: "User added successfully!", isError: false });
      setNewMemberEmail("");
      if (activeHomeId !== "default-home") {
        void fetchMembers(activeHomeId);
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setMemberMsg({
        text: apiErr.response?.data?.detail || "Failed to add user. Please check backend API.",
        isError: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return;

    try {
      await api.delete(`/homes/${selectedHomeId}/members/${userId}`);
      setMemberMsg({ text: "User removed successfully!", isError: false });
      void fetchMembers(selectedHomeId);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setMemberMsg({
        text: apiErr.response?.data?.detail || "Failed to remove user.",
        isError: true,
      });
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice("Preferences updated.");
    setTimeout(() => setSavedNotice(null), 2500);
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-wide">
          System Settings
        </h1>
        <p className="mt-1 text-xs text-white/50">
          Manage building members and basic alert preferences
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
                  void fetchMembers(e.target.value);
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
                          onClick={() => void handleRemoveUser(m.user_id)}
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

        {/* EMAIL ALERT PREFERENCE */}
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest font-mono mb-2">
              Notification Preferences
            </h2>
            <div className="flex items-center justify-between pb-1">
              <div>
                <div className="text-xs font-bold text-white">Email Alerts</div>
                <div className="text-[10px] text-white/50">Receive system reports via email</div>
              </div>
              <button
                type="button"
                onClick={() => setEmailAlerts((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailAlerts ? "bg-cyan-500" : "bg-white/10"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailAlerts ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {savedNotice && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
              {savedNotice}
            </div>
          )}

          <div className="flex justify-end pt-1">
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