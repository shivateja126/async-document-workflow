"use client";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { AmbientScene } from "@/components/three/ambient-scene";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowUpRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

const quickAccounts = [
  {
    label: "Admin",
    email: "admin@finance.local",
    password: "Password123!",
    role: "ADMIN"
  },
  {
    label: "Analyst",
    email: "analyst@finance.local",
    password: "Password123!",
    role: "ANALYST"
  },
  {
    label: "Viewer",
    email: "viewer@finance.local",
    password: "Password123!",
    role: "VIEWER"
  }
] as const;

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("admin@finance.local");
  const [password, setPassword] = useState("Password123!");
  const [role, setRole] = useState("ADMIN");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AmbientScene />

      <GlassCard className="w-full max-w-[500px] p-8">
        <div className="mb-6 flex items-center gap-4">
          <LockKeyhole />
          <h2 className="text-2xl font-semibold">Sign in</h2>
        </div>

        <div className="mb-6">
          <div className="mb-2 text-xs uppercase text-gray-400">Access</div>
          <div className="grid gap-2">
            {quickAccounts.map((account) => (
              <button
                key={account.label}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                  setRole(account.role);
                  setError(null);
                }}
                className={cn(
                  "flex justify-between rounded border p-3",
                  role === account.role && "border-blue-500"
                )}
              >
                <span>{account.label}</span>
                <span>Use</span>
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            try {
              await login(email, password, role);
            } catch {
              setError("Login failed. Check your credentials.");
            }
          }}
          className="space-y-4"
        >
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
          />

          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
          />

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
