import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase.ts";
import useAuth from "../hooks/useAuth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  "https://human-guard-ai-api.onrender.com";

type AuthMode = "signin" | "signup" | "reset";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/";

  // সেশন তৈরি হলে টোকেন ও ব্যাকএন্ড /auth/me সিঙ্ক করে ড্যাশবোর্ডে নেওয়ার কমন হেল্পার
  async function finalizeSessionLogin(session: Session, user: User) {
    const token = session.access_token;
    try {
      localStorage.setItem("access_token", token);
    } catch {
      // স্টোরেজ ব্লক থাকলে অ্যাপ যেন ক্র্যাশ না করে
    }

    let currentUser: Record<string, unknown> = {
      id: user.id,
      email: user.email ?? email.trim().toLowerCase(),
      name:
        (user.user_metadata?.full_name as string) ||
        fullName.trim() ||
        undefined,
      role: (user.user_metadata?.role as string) || "user",
    };

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

    setAuth(token, currentUser as Parameters<typeof setAuth>[1]);
    navigate(redirectPath, { replace: true });
  }

  // আগে থেকেই বৈধ সেশন থাকলে /login থেকে সরাসরি ড্যাশবোর্ডে পাঠানো
  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted && data.session && data.session.user) {
          await finalizeSessionLogin(data.session, data.session.user);
          return;
        }
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }

    checkExistingSession();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setInfo("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (mode === "signin") {
        const { data, error: authError } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (authError || !data.session || !data.user) {
          throw new Error(authError?.message || "Invalid email or password.");
        }

        await finalizeSessionLogin(data.session, data.user);
      } else if (mode === "signup") {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        if (data.session && data.user) {
          await finalizeSessionLogin(data.session, data.user);
        } else {
          setInfo(
            "Account created! Please check your email inbox (or Spam folder) to confirm your account, then Sign In."
          );
          setMode("signin");
        }
      } else if (mode === "reset") {
        const { error: resetError } =
          await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: `${window.location.origin}/login`,
          });

        if (resetError) {
          throw new Error(resetError.message);
        }

        setInfo("Password reset link has been sent to your email.");
      }
    } catch (err) {
      console.error("Auth action failed:", err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071311] px-4 text-emerald-200">
        <p className="text-sm">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#071311] px-4 py-8 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-emerald-900/60 bg-[#0e1f1c] p-6 shadow-2xl sm:p-8">
        {/* Brand & System Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-400">
            <span>⚡ Human Tech</span>
          </div>
          <h1 className="mt-3 text-xl font-bold leading-snug text-white sm:text-2xl">
            Human Tech Smart Home Automation
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {mode === "signin" && "Sign in to your smart home & security dashboard"}
            {mode === "signup" && "Create a new account to manage your devices"}
            {mode === "reset" && "Enter your email to reset your password"}
          </p>
        </div>

        {/* Sign In / Sign Up Tabs */}
        {mode !== "reset" && (
          <div className="mb-6 grid grid-cols-2 rounded-xl border border-emerald-900/50 bg-[#071311] p-1">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`cursor-pointer rounded-lg py-2 text-sm font-medium transition ${
                mode === "signin"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`cursor-pointer rounded-lg py-2 text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Error & Info Messages */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {info}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                autoComplete="name"
                className="w-full rounded-lg border border-emerald-900/60 bg-[#071311] px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-400"
                placeholder="Your full name"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-300"
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
              className="w-full rounded-lg border border-emerald-900/60 bg-[#071311] px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-400"
              placeholder="name@example.com"
            />
          </div>

          {mode !== "reset" && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-300"
                >
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => switchMode("reset")}
                    className="cursor-pointer text-xs text-emerald-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  className="w-full rounded-lg border border-emerald-900/60 bg-[#071311] px-4 py-2.5 pr-16 text-white placeholder-slate-500 outline-none focus:border-emerald-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-xs text-slate-400 hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Send Reset Link"}
          </button>
        </form>

        {mode === "reset" && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="cursor-pointer text-sm text-slate-400 hover:text-white"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}