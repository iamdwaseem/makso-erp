import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useWarehouseStore } from "../store/warehouseStore";
import api from "../api";


interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  organization_id?: string | null;
  organizationId?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("wareflow_token");
    const storedUser = localStorage.getItem("wareflow_user");
    if (!storedToken || !storedUser) {
      setIsLoading(false);
      return;
    }

    const validateSession = async () => {
      try {
        const parsedUser = JSON.parse(storedUser);
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        setToken(storedToken);
        setUser(res.data?.id ? res.data : parsedUser);
      } catch {
        localStorage.removeItem("wareflow_token");
        localStorage.removeItem("wareflow_user");
        setToken(null);
        setUser(null);
        useWarehouseStore.getState().clearWarehouses();
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
      localStorage.setItem("wareflow_token", data.token);
      localStorage.setItem("wareflow_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      throw new Error(err.response?.data?.error || err.message || "Login failed");
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { data } = await api.post<{ token: string; user: User }>("/auth/register", { name, email, password });
      localStorage.setItem("wareflow_token", data.token);
      localStorage.setItem("wareflow_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      throw new Error(err.response?.data?.error || err.message || "Registration failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("wareflow_token");
    localStorage.removeItem("wareflow_user");
    setToken(null);
    setUser(null);
    useWarehouseStore.getState().clearWarehouses();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
