// frontend/src/hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, AuthResponse } from "../api/auth";
import { fetchMe } from "../api/auth";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithResponse: (data: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "coachfit_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: read token from localStorage and fetch /auth/me
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }

    setToken(stored);
    fetchMe(stored)
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const loginWithResponse = (data: AuthResponse) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem(TOKEN_KEY, data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const value: AuthContextValue = {
    user,
    token,
    loading,
    loginWithResponse,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
