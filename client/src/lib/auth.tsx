import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiRequest, queryClient, setAuthToken, getAuthToken } from "./queryClient";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  smileStreak: number;
  totalSmiles: number;
  tipsReceived: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; displayName: string; username: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    (async () => {
      try {
        const token = getAuthToken();
        if (token) {
          const res = await apiRequest("GET", "/api/auth/me");
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch {
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await res.json();
    if (data.token) {
      setAuthToken(data.token);
    }
    setUser(data.user);
    queryClient.clear();
  }, []);

  const register = useCallback(async (input: { email: string; password: string; displayName: string; username: string }) => {
    const res = await apiRequest("POST", "/api/auth/register", input);
    const data = await res.json();
    if (data.token) {
      setAuthToken(data.token);
    }
    setUser(data.user);
    queryClient.clear();
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
    queryClient.clear();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}