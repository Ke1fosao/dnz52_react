import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { adminAuthApi, getToken, setToken, clearToken } from './adminApi';
import type { AdminUser } from '../types';

interface AdminAuthCtx {
  user: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string, otp?: string) => Promise<void>;
  logout: () => void;
  refresh: () => void;
}

const Ctx = createContext<AdminAuthCtx | null>(null);

export function useAdminAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return c;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    adminAuthApi.me()
      .then(d => setUser(d.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string, otp?: string) => {
    const d = await adminAuthApi.login(username, password, otp);
    setToken(d.token);
    setUser(d.user);
  };

  const logout = () => {
    adminAuthApi.logout().catch(() => {});
    clearToken();
    setUser(null);
  };

  const refresh = () => { adminAuthApi.me().then(d => setUser(d.user)).catch(() => {}); };

  return <Ctx.Provider value={{ user, loading, login, logout, refresh }}>{children}</Ctx.Provider>;
}
