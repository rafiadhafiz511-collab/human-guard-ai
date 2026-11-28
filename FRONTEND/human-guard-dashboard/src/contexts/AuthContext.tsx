import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type User = {
  id?: string;
  email: string;
  name?: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

function mapSupabaseUser(session: Session | null): User | null {
  const sbUser = session?.user;
  if (!sbUser) return null;

  return {
    id: sbUser.id,
    email: sbUser.email || "",
    name:
      (sbUser.user_metadata?.name as string | undefined) ||
      (sbUser.user_metadata?.full_name as string | undefined) ||
      sbUser.email?.split("@")[0] ||
      "User",
    role: (sbUser.app_metadata?.role as string | undefined) || "user",
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(currentSession);
        setToken(currentSession?.access_token ?? null);
        setUser(mapSupabaseUser(currentSession));

        if (currentSession?.access_token) {
          localStorage.setItem("access_token", currentSession.access_token);
        } else {
          localStorage.removeItem("access_token");
        }
      } catch (err) {
        console.error("[Auth] Failed to get Supabase session:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setToken(nextSession?.access_token ?? null);
      setUser(mapSupabaseUser(nextSession));

      if (nextSession?.access_token) {
        localStorage.setItem("access_token", nextSession.access_token);
      } else {
        localStorage.removeItem("access_token");
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function setAuth(newToken: string, newUser: User) {
    localStorage.setItem("access_token", newToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    setSession(null);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token,
        loading,
        isAuthenticated: Boolean(session?.access_token || token) && Boolean(user),
        setAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }

  return context;
}
