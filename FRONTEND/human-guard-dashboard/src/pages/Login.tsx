import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.ts";
import useAuth from "../hooks/useAuth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  "https://human-guard-ai-api.onrender.com";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanEmail = email.trim();

      // ১. Supabase Auth দিয়ে Email + Password লগইন
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (authError || !data.session || !data.user) {
        throw new Error(authError?.message || "Invalid email or password.");
      }

      const token = data.session.access_token;
      localStorage.setItem("access_token", token);

      // ২. `setAuth`-এর User টাইপ অনুযায়ী নিরাপদ ইউজার অবজেক্ট তৈরি
      let currentUser: Record<string, unknown> = {
        id: data.user.id,
        email: data.user.email ?? cleanEmail,
        role: (data.user.user_metadata?.role as string) || "user",
      };

      // ৩. ব্যাকএন্ড থেকে বর্তমান ইউজার তথ্য আনার চেষ্টা (নিরাপদ টাইমআউটসহ)
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 4000);

      try {
        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (meRes.ok) {
          const backendUser = (await meRes.json()) as Record<string, unknown>;
          currentUser = {
            ...currentUser,
            ...backendUser,
            email:
              typeof backendUser.email === "string" && backendUser.email
                ? backendUser.email
                : (currentUser.email as string),
          };
        }
      } catch (meErr) {
        console.warn("Could not fetch /auth/me from backend yet:", meErr);
      } finally {
        window.clearTimeout(timeoutId);
      }

      // ৪. Auth state আপডেট
      setAuth(token, currentUser as Parameters<typeof setAuth>[1]);

      // ৫. পূর্বের পেজ বা ড্যাশবোর্ডে রিডাইরেক্ট
      const from =
        (location.state as { from?: { pathname?: string } } | null)
          ?.from?.pathname || "/";

      navigate(from, { replace: true });
    } catch (err) {
      console.error("Supabase login failed:", err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Human Guard AI
          </h1>
          <p className="mt-2 text-slate-500">
            Sign in to your security dashboard
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="rafiadhafiz511@gmail.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}