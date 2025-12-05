import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useContext, useEffect, useState } from "react";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface AuthContextValue {
  token: string | null;
  refreshToken: string | null;
  rememberMe: boolean;
  setTokens: (access: string, refresh: string, remember: boolean) => Promise<void>;
  clearTokens: () => Promise<void>;
  getValidToken: () => Promise<string | null>;
  isTokenExpired: (token: string) => boolean;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Initialize: Check AsyncStorage on mount (for "remember me" users)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedRememberMe = await AsyncStorage.getItem("rememberMe");
        
        if (storedRememberMe === "true") {
          const storedToken = await AsyncStorage.getItem("token");
          console.log("Token:", token)
          const storedRefresh = await AsyncStorage.getItem("refreshToken");
          
          if (storedToken && storedRefresh) {
            console.log("🔐 Restoring session from AsyncStorage (Remember Me)");
            setToken(storedToken);
            setRefreshToken(storedRefresh);
            setRememberMe(true);
          }
        } else {
          console.log("🔐 No Remember Me - starting fresh session");
        }
      } catch (error) {
        console.error("❌ Error initializing auth:", error);
      }
    };

    initAuth();
  }, [token]);

  const isTokenExpired = (token: string): boolean => {
    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      return exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  const setTokens = async (access: string, refresh: string, remember: boolean) => {
    console.log(`🔑 Setting tokens (Remember Me: ${remember})`);
    
    // Always set in Context (in-memory)
    setToken(access);
    setRefreshToken(refresh);
    setRememberMe(remember);

    // Only persist to AsyncStorage if "remember me" is enabled
    if (remember) {
      await AsyncStorage.setItem("token", access);
      await AsyncStorage.setItem("refreshToken", refresh);
      await AsyncStorage.setItem("rememberMe", "true");
      console.log("💾 Tokens saved to AsyncStorage");
    } else {
      // Clear AsyncStorage if "remember me" is disabled
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("rememberMe");
      console.log("🗑️ Tokens cleared from AsyncStorage (not persisting)");
    }
  };

  const clearTokens = async () => {
    console.log("🚪 Clearing all tokens");
    
    // Clear Context
    setToken(null);
    setRefreshToken(null);
    setRememberMe(false);

    // Clear AsyncStorage
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("refreshToken");
    await AsyncStorage.removeItem("rememberMe");
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      // Get refresh token from Context first, then AsyncStorage
      let refresh = refreshToken;
      if (!refresh) {
        refresh = await AsyncStorage.getItem("refreshToken");
      }

      if (!refresh) {
        console.error("❌ No refresh token available");
        return null;
      }

      console.log("🔄 Refreshing access token...");

      const res = await fetch(`${API_URL}auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await res.json();
      const newAccessToken = data.data.access;

      // Update Context
      setToken(newAccessToken);

      // Update AsyncStorage only if "remember me" is enabled
      if (rememberMe) {
        await AsyncStorage.setItem("token", newAccessToken);
      }

      console.log("✅ Token refreshed successfully");
      return newAccessToken;
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      await clearTokens();
      return null;
    }
  };

  const getValidToken = async (): Promise<string | null> => {
    // 1. Try Context first (primary source)
    if (token && !isTokenExpired(token)) {
      return token;
    }

    // 2. If Context token is expired, try refreshing
    if (token && isTokenExpired(token)) {
      console.log("⏰ Context token expired, refreshing...");
      return await refreshAccessToken();
    }

    // 3. Fallback: Check AsyncStorage (for "remember me" sessions)
    const storedToken = await AsyncStorage.getItem("token");
    if (storedToken && !isTokenExpired(storedToken)) {
      console.log("📦 Using token from AsyncStorage");
      setToken(storedToken);
      return storedToken;
    }

    // 4. If AsyncStorage token is expired, try refreshing
    if (storedToken && isTokenExpired(storedToken)) {
      console.log("⏰ AsyncStorage token expired, refreshing...");
      return await refreshAccessToken();
    }

    console.log("❌ No valid token available");
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        rememberMe,
        setTokens,
        clearTokens,
        getValidToken,
        isTokenExpired,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};