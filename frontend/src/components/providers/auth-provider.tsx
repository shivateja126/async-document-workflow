"use client";

import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  startTransition,
  useContext,
  useCallback,
  useEffect,
  useState
} from "react";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    if (typeof window === "undefined") return;

    const existingToken = window.localStorage.getItem("finance-token");
    const existingUser = window.localStorage.getItem("finance-user");

    if (!existingToken || !existingUser) {
      setLoading(false);
      return;
    }

    setToken(existingToken);
    setUser(JSON.parse(existingUser) as User);

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.data as User);
      window.localStorage.setItem("finance-user", JSON.stringify(response.data.data));
    } catch {
      window.localStorage.removeItem("finance-token");
      window.localStorage.removeItem("finance-user");
      setToken(null);
      setUser(null);
      if (!pathname.startsWith("/login")) {
        startTransition(() => router.replace("/login"));
      }
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // ✅ FIXED LOGIN (includes role)
  const login = async (email: string, password: string, role: string) => {
    setLoading(true);

    const response = await api.post("/auth/login", {
      email,
      password,
      role
    });

    const nextToken = response.data.data.accessToken as string;
    const nextUser = response.data.data.user as User;

    window.localStorage.setItem("finance-token", nextToken);
    window.localStorage.setItem("finance-user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    setLoading(false);

    startTransition(() => router.replace("/dashboard"));
  };

  const logout = () => {
    window.localStorage.removeItem("finance-token");
    window.localStorage.removeItem("finance-user");
    setToken(null);
    setUser(null);
    startTransition(() => router.replace("/login"));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hydrate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}