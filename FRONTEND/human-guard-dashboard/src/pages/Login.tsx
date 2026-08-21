import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  login,
  getMe,
  firebaseLogin,
} from "../api/auth";
import useAuth from "../hooks/useAuth";
import { auth } from "../config/firebase";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      console.log("GOOGLE USER:", result.user);

      const idToken = await result.user.getIdToken();

      console.log("FIREBASE ID TOKEN:", idToken);

      const loginResponse = await firebaseLogin(idToken);

      console.log(
        "BACKEND LOGIN RESPONSE:",
        loginResponse
      );

      const token = loginResponse.access_token;

      console.log(
        "BACKEND JWT:",
        token
      );

      localStorage.setItem("access_token", token);

      const user = await getMe(token);

      console.log(
        "BACKEND USER:",
        user
      );

      setAuth(token, user);

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "GOOGLE LOGIN FAILED:",
        error
      );

      setError(
        "Google sign-in failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      // 1. Login
      const loginResponse = await login({
        email,
        password,
      });

      const token = loginResponse.access_token;

      // LocalStorage এ টোকেন সেভ
      localStorage.setItem("access_token", token);

      // 2. Get current user using JWT token
      const user = await getMe(token);

      // 3. Save authentication state
      setAuth(token, user);

      // 4. Redirect
      const from =
        (location.state as { from?: { pathname?: string } } | null)
          ?.from?.pathname || "/";

      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login failed:", error);

      setError("Invalid email or password.");
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

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mb-5 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue with Google
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-sm text-slate-400">OR</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
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
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="admin@humanguard.ai"
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
              onChange={(event) =>
                setPassword(event.target.value)
              }
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