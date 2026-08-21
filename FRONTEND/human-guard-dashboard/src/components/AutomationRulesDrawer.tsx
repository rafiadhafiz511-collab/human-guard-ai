import { useState, useEffect } from "react";
import api from "../api/client";
import type { AutomationRule, Device } from "../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
};

export default function AutomationRulesDrawer({ isOpen, onClose, devices }: Props) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // New Rule Form State
  const [ruleName, setRuleName] = useState("");
  const [sensorType, setSensorType] = useState("SOIL_MOISTURE");
  const [threshold, setThreshold] = useState(30);
  const [operator, setOperator] = useState("<");
  const [targetDeviceId, setTargetDeviceId] = useState("");
  const [action, setAction] = useState("PUMP_ON");

  useEffect(() => {
    if (isOpen) fetchRules();
  }, [isOpen]);

  async function fetchRules() {
    try {
      setError("");
      const res = await api.get("/automations");
      setRules(res.data);
    } catch (err) {
      console.error("Rules fetch error:", err);
      setError("Failed to load automation rules");
    }
  }

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!targetDeviceId || !ruleName) return;

    try {
      setLoading(true);
      setError("");
      await api.post("/automations", {
        rule_name: ruleName,
        sensor_type: sensorType,
        threshold: Number(threshold),
        operator,
        target_device_id: targetDeviceId,
        action,
        is_active: true,
      });
      // Reset form
      setRuleName("");
      setSensorType("SOIL_MOISTURE");
      setThreshold(30);
      setOperator("<");
      setTargetDeviceId("");
      setAction("PUMP_ON");
      await fetchRules();
    } catch (err) {
      console.error("Failed to create rule:", err);
      setError("Failed to create rule");
    } finally {
      setLoading(false);
    }
  }

  async function toggleRule(ruleId: string) {
    try {
      setError("");
      await api.patch(`/automations/${ruleId}/toggle`);
      await fetchRules();
    } catch (err) {
      console.error("Failed to toggle rule:", err);
      setError("Failed to update rule");
    }
  }

  async function deleteRule(ruleId: string) {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;

    try {
      setError("");
      await api.delete(`/automations/${ruleId}`);
      await fetchRules();
    } catch (err) {
      console.error("Failed to delete rule:", err);
      setError("Failed to delete rule");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-lg flex-col justify-between border-l border-slate-200 bg-white p-6 text-slate-900 shadow-2xl overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                FastAPI Engine
              </span>
              <h2 className="text-xl font-bold">Automation Rules</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 hover:text-slate-900"
            >
              ✕
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Add New Rule Form */}
          <form onSubmit={handleCreateRule} className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-xs font-bold uppercase text-slate-500">Create New Automation</h3>

            <input
              type="text"
              placeholder="Rule Name (e.g. Auto Crop Watering)"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              required
            />

            <div className="grid grid-cols-3 gap-2">
              <select
                value={sensorType}
                onChange={(e) => setSensorType(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900"
              >
                <option value="SOIL_MOISTURE">Soil Moisture</option>
                <option value="TEMPERATURE">Temperature</option>
                <option value="WATER_LEVEL">Water Level</option>
              </select>

              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900"
              >
                <option value="<">Less Than (&lt;)</option>
                <option value=">">Greater Than (&gt;)</option>
                <option value="==">Equals (==)</option>
              </select>

              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900"
                placeholder="Value"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={targetDeviceId}
                onChange={(e) => setTargetDeviceId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900"
                required
              >
                <option value="">Select Target Device</option>
                {devices.map((d) => (
                  <option key={d.device_id} value={d.device_id}>
                    {d.device_name}
                  </option>
                ))}
              </select>

              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900"
              >
                <option value="PUMP_ON">Turn ON</option>
                <option value="PUMP_OFF">Turn OFF</option>
                <option value="LIGHT_ON">Light ON</option>
                <option value="LIGHT_OFF">Light OFF</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "+ Add Rule"}
            </button>
          </form>

          {/* Existing Rules List */}
          <div className="mt-6 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-500">Active Automation Engine Rules</h3>
            {rules.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                No automation rules yet. Create one to get started!
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{rule.rule_name}</p>
                    <p className="text-xs text-slate-500">
                      IF {rule.sensor_type} {rule.operator} {rule.threshold} ➔ {rule.action}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleRule(rule.id)}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        rule.is_active
                          ? "bg-emerald-500/20 text-emerald-700 border border-emerald-200"
                          : "bg-rose-500/20 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {rule.is_active ? "ACTIVE" : "PAUSED"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRule(rule.id)}
                      className="rounded-full px-2 py-1 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-900 hover:bg-white"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
}
