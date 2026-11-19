import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiClient, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [initializing, setInitializing] = useState(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const persistSession = useCallback((accessToken, userProfile) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));
    setToken(accessToken);
    setUser(userProfile);
  }, []);

  // Verify existing JWT token on app boot
  useEffect(() => {
    let active = true;
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!storedToken) {
      setInitializing(false);
      return undefined;
    }

    apiClient
      .get("/auth/me")
      .then((res) => {
        if (!active) return;
        const freshUser = res.data?.user || res.data;
        setUser(freshUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
      })
      .catch(() => {
        if (!active) return;
        clearSession();
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    return () => {
      active = false;
    };
  }, [clearSession]);

  // Listen for 401 unauthorized events from Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener("smartfarm:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("smartfarm:unauthorized", handleUnauthorized);
  }, [clearSession]);

  const login = async (email, password) => {
    const res = await apiClient.post("/auth/login", { email, password });
    const { access_token, user: userProfile } = res.data;
    persistSession(access_token, userProfile);
    return userProfile;
  };

  const register = async ({ full_name, farm_name, email, password }) => {
    const res = await apiClient.post("/auth/register", {
      full_name,
      farm_name,
      email,
      password,
    });
    const { access_token, user: userProfile } = res.data;
    persistSession(access_token, userProfile);
    return userProfile;
  };

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        initializing,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}