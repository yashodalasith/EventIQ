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
  deleteProfile,
  getProfile,
  loginUser,
  logoutAllSessions,
  logoutUser,
  refreshSession,
  registerUser,
  updateProfile,
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
  const refreshInFlightRef = useRef(null);

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
      const nextUser =
        payload?.user || (nextToken ? await getProfile(nextToken) : null);

      persist(nextToken, nextRefreshToken, nextUser);
      return nextUser;
    },
    [persist],
  );

  const refreshWithDedup = useCallback(async (tokenToUse) => {
    if (!tokenToUse) {
      throw new Error("No refresh token available");
    }

    const inFlight = refreshInFlightRef.current;
    if (inFlight?.token === tokenToUse) {
      return inFlight.promise;
    }

    const promise = refreshSession(tokenToUse).finally(() => {
      if (refreshInFlightRef.current?.promise === promise) {
        refreshInFlightRef.current = null;
      }
    });

    refreshInFlightRef.current = { token: tokenToUse, promise };
    return promise;
  }, []);

  const restoreSession = useCallback(
    async (storedSession) => {
      if (storedSession?.token) {
        const tokenExpiry = getExpiryMs(storedSession.token);
        const tokenStillValid =
          typeof tokenExpiry === "number" && tokenExpiry > Date.now() + 30_000;

        if (tokenStillValid) {
          const profile = await getProfile(storedSession.token);
          persist(storedSession.token, storedSession.refreshToken, profile);
          return profile;
        }
      }

      if (storedSession?.refreshToken) {
        const refreshed = await refreshWithDedup(storedSession.refreshToken);
        return applyAuthPayload(refreshed);
      }

      return null;
    },
    [applyAuthPayload, persist, refreshWithDedup],
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
      const payload = await refreshWithDedup(refreshToken);
      return await applyAuthPayload(payload);
    } catch (_error) {
      clearSession();
      return null;
    }
  }, [applyAuthPayload, clearSession, refreshToken, refreshWithDedup]);

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
    const refreshInMs = expiryMs
      ? Math.max(expiryMs - Date.now() - 60_000, 5_000)
      : 5 * 60_000;

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
    const session = await registerUser({
      name,
      email,
      password,
      role,
      profile,
    });
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

  const updateAccount = async (input) => {
    if (!token) {
      return null;
    }

    const payload = await updateProfile(token, input);
    if (payload?.token || payload?.accessToken || payload?.refreshToken) {
      return applyAuthPayload(payload);
    }

    // Always re-fetch profile after non-token updates to avoid stale UI state.
    return refreshProfile();
  };

  const deleteAccount = async ({ password }) => {
    if (!token) {
      return;
    }
    await deleteProfile(token, password);
    clearSession();
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
      updateAccount,
      deleteAccount,
    }),
    [
      token,
      refreshToken,
      user,
      loading,
      signOut,
      signOutAll,
      renewSession,
      clearSession,
      refreshProfile,
      applyAuthPayload,
      persist,
    ],
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
