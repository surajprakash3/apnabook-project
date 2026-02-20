import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateProfile: () => {}
});

const AUTH_STORAGE_KEY = 'apnabook_auth';

const getStoredAuth = () => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return { user: null, token: null };
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.user) {
      return { user: parsed.user, token: parsed.token ?? null };
    }
    return { user: parsed, token: null };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { user: null, token: null };
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth();
    setUser(stored.user);
    setToken(stored.token);
    setLoading(false);
  }, []);

  const login = (payload) => {
    const nextUser = payload?.user ?? null;
    const nextToken = payload?.token ?? null;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: nextUser, token: nextToken }));
    setUser(nextUser);
    setToken(nextToken);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setToken(null);
  };

  const updateProfile = (updates) => {
    setUser((prev) => {
      const nextUser = { ...(prev || {}), ...updates };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: nextUser, token }));
      return nextUser;
    });
  };

  const value = useMemo(
    () => ({ user, token, loading, login, logout, updateProfile }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
