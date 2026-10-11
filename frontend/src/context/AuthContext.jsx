import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on page load
  useEffect(() => {
    let cancelled = false;
    if (!api.tokenStore.get()) {
      setLoading(false);
      return;
    }
    api.getMe()
      .then((u) => { if (!cancelled) setUser(u); })
      .catch(() => api.tokenStore.clear())
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // api.js fires this when the server says the token is no longer valid
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const login = useCallback(async (identifier, password) => {
    const data = await api.login({ identifier, password });
    api.tokenStore.set(data.access_token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.register(payload);
    api.tokenStore.set(data.access_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    api.tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);