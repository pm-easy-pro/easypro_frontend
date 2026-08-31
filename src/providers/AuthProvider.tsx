"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import {
  fetchMe,
  login as apiLogin,
  updateMe,
  verifyOtp,
  type ProfileUpdatePayload,
} from "@/lib/api";
import { clearTokens, getAccessToken, setTokens } from "@/lib/auth";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Username/password — dashboard superadmin */
  login: (username: string, password: string) => Promise<User>;
  /** Phone OTP — public users */
  loginWithOtp: (phone: string, code: string) => Promise<User>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (username: string, password: string) => {
    const tokens = await apiLogin(username, password);
    setTokens(tokens.access, tokens.refresh);
    const me = await fetchMe();
    setUser(me);
    return me;
  };

  const loginWithOtp = async (phone: string, code: string) => {
    const result = await verifyOtp(phone, code);
    setTokens(result.access, result.refresh);
    setUser(result.user);
    return result.user;
  };

  const updateProfile = async (payload: ProfileUpdatePayload) => {
    const me = await updateMe(payload);
    setUser(me);
    return me;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithOtp, updateProfile, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
