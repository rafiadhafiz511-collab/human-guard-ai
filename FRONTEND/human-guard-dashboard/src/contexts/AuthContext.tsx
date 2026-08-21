import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getMe,
  type User,
} from "../api/auth";

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("access_token");
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      // LocalStorage থেকে তাজা টোকেন নিন
      const storedToken = localStorage.getItem("access_token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        // getMe কল করার আগে নিশ্চিত হোন api instance এ Authorization হেডার যাচ্ছে
        const currentUser = await getMe(storedToken);
        setUser(currentUser);
        setToken(storedToken);
      } catch (error) {
        console.error("Failed to restore session:", error);
        // Network Error হলে টোকেন মুছবেন না, কেবল 401 হলেই মুছবেন
        localStorage.removeItem("access_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  function setAuth(newToken: string, newUser: User) {
    localStorage.setItem("access_token", newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
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
    throw new Error(
      "useAuthContext must be used inside AuthProvider"
    );
  }

  return context;
}