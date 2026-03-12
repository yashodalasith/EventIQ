import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getProfile,
  loginUser,
  logoutAllSessions,
  logoutUser,
  refreshSession,
  registerUser,
} from "../lib/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "eventiq_auth";

function getExpiryMs(token) {
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    return decoded?.exp ? decoded.exp * 1000 : null;
  } catch (_error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimeoutRef = useRef(null);

  const clearSession = useCallback(() => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const persist = useCallback((nextToken, nextRefreshToken, nextUser) => {
    setToken(nextToken);
    setRefreshToken(nextRefreshToken || null);
    setUser(nextUser);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: nextToken,
        refreshToken: nextRefreshToken || null,
        user: nextUser,
      }),
    );
  }, []);

  const applyAuthPayload = useCallback(
    async (payload) => {
      const nextToken = payload?.accessToken || payload?.token || null;
      const nextRefreshToken = payload?.refreshToken || null;
      const nextUser = payload?.user || (nextToken ? await getProfile(nextToken) : null);

      persist(nextToken, nextRefreshToken, nextUser);
      return nextUser;
    },
    [persist],
  );

  const restoreSession = useCallback(
    async (storedSession) => {
      if (storedSession?.refreshToken) {
        const refreshed = await refreshSession(storedSession.refreshToken);
        return applyAuthPayload(refreshed);
      }

      if (storedSession?.token) {
        const profile = await getProfile(storedSession.token);
        persist(storedSession.token, storedSession.refreshToken, profile);
        return profile;
      }

      return null;
    },
    [applyAuthPayload, persist],
  );

  useEffect(() => {
    const bootstrap = async () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        await restoreSession(parsed);
      } catch (_error) {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [clearSession, restoreSession]);

  const renewSession = useCallback(async () => {
    if (!refreshToken) {
      clearSession();
      return null;
    }

    try {
      const payload = await refreshSession(refreshToken);
      return await applyAuthPayload(payload);
    } catch (_error) {
      clearSession();
      return null;
    }
  }, [applyAuthPayload, clearSession, refreshToken]);

  useEffect(() => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    if (!refreshToken) {
      return undefined;
    }

    const tokenToTrack = token || refreshToken;
    const expiryMs = getExpiryMs(tokenToTrack);
    const refreshInMs = expiryMs ? Math.max(expiryMs - Date.now() - 60_000, 5_000) : 5 * 60_000;

    refreshTimeoutRef.current = window.setTimeout(() => {
      renewSession();
    }, refreshInMs);

    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [renewSession, refreshToken, token]);

  const signIn = async ({ email, password }) => {
    const session = await loginUser({ email, password });
    return applyAuthPayload(session);
  };

  const signUp = async ({ name, email, password, role, profile }) => {
    const session = await registerUser({ name, email, password, role, profile });
    return applyAuthPayload(session);
  };

  const refreshProfile = async () => {
    if (!token) {
      return null;
    }
    const profile = await getProfile(token);
    persist(token, refreshToken, profile);
    return profile;
  };

  const signOut = useCallback(async () => {
    try {
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    } finally {
      clearSession();
    }
  }, [clearSession, refreshToken]);

  const signOutAll = useCallback(async () => {
    try {
      if (token) {
        await logoutAllSessions(token);
      }
    } finally {
      clearSession();
    }
  }, [clearSession, token]);

  const value = useMemo(
    () => ({
      token,
      refreshToken,
      user,
      loading,
      isAuthenticated: Boolean(token),
      signIn,
      signUp,
      signOut,
      signOutAll,
      renewSession,
      refreshProfile,
    }),
    [token, refreshToken, user, loading, signOut, signOutAll, renewSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
