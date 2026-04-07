"use client";

import { User } from "@/lib/types";
import axios from "axios";
import { Button } from "../ui/button";
import { GlassCard } from "../ui/glass-card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { useState } from "react";

type AdminPanelProps = {
  users: User[];
  currentUserId: string;
  onCreateUser: (payload: {
    name: string;
    email: string;
    password: string;
    role: User["role"];
  }) => Promise<void>;
  onUpdateUser: (id: string, payload: Partial<User>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data as
    | {
        message?: string | string[];
        details?: string[];
        error?: {
          message?: string | string[];
        };
      }
    | undefined;

  const message = data?.message ?? data?.details ?? data?.error?.message;

  return Array.isArray(message) ? message.join(", ") : message || fallback;
}

export function AdminPanel({
  users,
  currentUserId,
  onCreateUser,
  onUpdateUser,
  onDeleteUser
}: AdminPanelProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "VIEWER" as User["role"]
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [registrySuccess, setRegistrySuccess] = useState<string | null>(null);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <GlassCard>
        <div className="mb-5">
          <h3 className="font-display text-2xl font-semibold text-foreground">Provision user</h3>
          <p className="mt-1 text-sm text-foreground/55">Create users, assign a role, and onboard them securely.</p>
        </div>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setSuccess(null);
            setSubmitting(true);

            try {
              await onCreateUser(form);
              setForm({ name: "", email: "", password: "", role: "VIEWER" });
              setSuccess("User created successfully.");
            } catch (error) {
              setError(
                getApiErrorMessage(
                  error,
                  "Unable to create user. Please review the details and try again."
                )
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Input
            placeholder="Full name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
          <Input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
          <Select
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as User["role"] }))}
          >
            <option value="VIEWER">Viewer</option>
            <option value="ANALYST">Analyst</option>
            <option value="ADMIN">Admin</option>
          </Select>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating..." : "Create user"}
          </Button>
        </form>
      </GlassCard>

      <GlassCard>
        <div className="mb-5">
          <h3 className="font-display text-2xl font-semibold text-foreground">Access registry</h3>
          <p className="mt-1 text-sm text-foreground/55">Adjust roles and account status without leaving the console.</p>
        </div>
        <div className="space-y-4">
          {registryError ? <p className="text-sm text-rose-400">{registryError}</p> : null}
          {registrySuccess ? <p className="text-sm text-emerald-400">{registrySuccess}</p> : null}
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-2xl border border-white/15 bg-white/10 p-4 dark:bg-white/5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="text-sm text-foreground/55">{user.email}</div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Select
                    value={user.role}
                    onChange={async (event) => {
                      setRegistryError(null);
                      setRegistrySuccess(null);
                      try {
                        await onUpdateUser(user.id, { role: event.target.value as User["role"] });
                        setRegistrySuccess("User updated successfully.");
                      } catch (error) {
                        setRegistryError(getApiErrorMessage(error, "Unable to update this user."));
                      }
                    }}
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="ANALYST">Analyst</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                  <Select
                    value={user.status}
                    onChange={async (event) => {
                      setRegistryError(null);
                      setRegistrySuccess(null);
                      try {
                        await onUpdateUser(user.id, { status: event.target.value as User["status"] });
                        setRegistrySuccess("User updated successfully.");
                      } catch (error) {
                        setRegistryError(getApiErrorMessage(error, "Unable to update this user."));
                      }
                    }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                  <Button
                    variant="secondary"
                    disabled={user.id === currentUserId}
                    onClick={async () => {
                      setRegistryError(null);
                      setRegistrySuccess(null);

                      if (!window.confirm(`Delete ${user.name}? This action cannot be undone.`)) {
                        return;
                      }

                      try {
                        await onDeleteUser(user.id);
                        setRegistrySuccess("User deleted successfully.");
                      } catch (error) {
                        setRegistryError(getApiErrorMessage(error, "Unable to delete this user."));
                      }
                    }}
                  >
                    {user.id === currentUserId ? "Current admin" : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
