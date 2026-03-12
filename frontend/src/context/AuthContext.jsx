import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, loginUser, registerUser } from "../lib/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "eventiq_auth";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setToken(parsed.token || null);
      setUser(parsed.user || null);
    } catch (_error) {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
  };

  const signIn = async ({ email, password }) => {
    const login = await loginUser({ email, password });
    const profile = await getProfile(login.token);
    persist(login.token, profile);
    return profile;
  };

  const signUp = async ({ name, email, password, role }) => {
    await registerUser({ name, email, password, role });
    return signIn({ email, password });
  };

  const refreshProfile = async () => {
    if (!token) {
      return null;
    }
    const profile = await getProfile(token);
    persist(token, profile);
    return profile;
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      signIn,
      signUp,
      signOut,
      refreshProfile
    }),
    [token, user, loading]
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
