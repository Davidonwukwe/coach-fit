// frontend/src/hooks/useAuth.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
  } from "react";
  import type { User, AuthResponse } from "../api/auth";
  import { getMe } from "../api/auth";
  
  interface AuthContextValue {
    user: User | null;
    token: string | null;
    loading: boolean;
    loginWithResponse: (data: AuthResponse) => void;
    logout: () => void;
  }
  
  const AuthContext = createContext<AuthContextValue | undefined>(undefined);
  
  const TOKEN_KEY = "coachfit_token";
  
  export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) {
        setLoading(false);
        return;
      }
  
      setToken(stored);
  
      getMe()
        .then((u) => {
          setUser(u);
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        })
        .finally(() => setLoading(false));
    }, []);
  
    const loginWithResponse = (data: AuthResponse) => {
      if (!data.token) {
        return;
      }
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
    };
  
    const logout = () => {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
    };
  
    return (
      <AuthContext.Provider
        value={{ user, token, loading, loginWithResponse, logout }}
      >
        {children}
      </AuthContext.Provider>
    );
  };
  
  export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
      throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
  };
  