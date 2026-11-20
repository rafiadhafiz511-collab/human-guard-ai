
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getHomes,
  type Home,
} from "../api/homes";

import { useAuthContext } from "./AuthContext";

// ============================================================
// HOME CONTEXT TYPE
// ============================================================

type HomeContextType = {
  homes: Home[];
  currentHome: Home | null;
  currentHomeId: string | null;
  loading: boolean;
  error: string;
  switchHome: (homeId: string) => void;
  refreshHomes: () => Promise<void>;
};

// ============================================================
// CONTEXT
// ============================================================

const HomeContext =
  createContext<HomeContextType | undefined>(
    undefined
  );

// ============================================================
// PROVIDER PROPS
// ============================================================

type HomeProviderProps = {
  children: ReactNode;
};

// ============================================================
// STORAGE KEY
// ============================================================

const CURRENT_HOME_STORAGE_KEY =
  "current_home_id";

// ============================================================
// PROVIDER
// ============================================================

export function HomeProvider({
  children,
}: HomeProviderProps) {
  const {
    isAuthenticated,
    loading: authLoading,
  } = useAuthContext();

  const [homes, setHomes] = useState<Home[]>([]);

  const [currentHomeId, setCurrentHomeId] =
    useState<string | null>(() => {
      return localStorage.getItem(
        CURRENT_HOME_STORAGE_KEY
      );
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================================
  // LOAD HOMES
  // ==========================================================

  const refreshHomes = async () => {
    if (!isAuthenticated) {
      setHomes([]);
      setCurrentHomeId(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getHomes();

      setHomes(data);

      // --------------------------------------------------------
      // Restore previously selected home
      // --------------------------------------------------------

      const storedHomeId =
        localStorage.getItem(
          CURRENT_HOME_STORAGE_KEY
        );

      const storedHomeExists =
        storedHomeId &&
        data.some(
          (home) => home.id === storedHomeId
        );

      if (storedHomeExists) {
        setCurrentHomeId(storedHomeId);
        return;
      }

      // --------------------------------------------------------
      // Otherwise select first available home
      // --------------------------------------------------------

      if (data.length > 0) {
        const firstHome = data[0];

        setCurrentHomeId(firstHome.id);

        localStorage.setItem(
          CURRENT_HOME_STORAGE_KEY,
          firstHome.id
        );
      } else {
        setCurrentHomeId(null);

        localStorage.removeItem(
          CURRENT_HOME_STORAGE_KEY
        );
      }
    } catch (err) {
      console.error(
        "[HOME] Failed to load homes:",
        err
      );

      setError(
        "Failed to load homes from server."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // LOAD WHEN AUTH IS READY
  // ==========================================================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void refreshHomes();
  }, [authLoading, isAuthenticated]);

  // ==========================================================
  // SWITCH HOME
  // ==========================================================

  const switchHome = (homeId: string) => {
    const homeExists = homes.some(
      (home) => home.id === homeId
    );

    if (!homeExists) {
      return;
    }

    setCurrentHomeId(homeId);

    localStorage.setItem(
      CURRENT_HOME_STORAGE_KEY,
      homeId
    );
  };

  // ==========================================================
  // CURRENT HOME
  // ==========================================================

  const currentHome =
    homes.find(
      (home) => home.id === currentHomeId
    ) ?? null;

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <HomeContext.Provider
      value={{
        homes,
        currentHome,
        currentHomeId,
        loading,
        error,
        switchHome,
        refreshHomes,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useHomeContext() {
  const context =
    useContext(HomeContext);

  if (!context) {
    throw new Error(
      "useHomeContext must be used inside HomeProvider"
    );
  }

  return context;
}