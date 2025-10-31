import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import React, { createContext, useEffect, useRef, useState } from "react";

if (!Constants.expoConfig?.extra?.wssUrl) {
  throw new Error("WSS URL is missing in expoConfig.extra");
}

export const WSS_URL = Constants.expoConfig.extra.wssUrl;

interface SocketContextValue {
  socket: WebSocket | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextValue & { setTokenFromOutside?: (t: string) => void }>({
  socket: null,
  isConnected: false,
});

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const ws = useRef<WebSocket | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  


    const connectWebSocket = (token: string) => {

    if (ws.current) {
    console.log("🔌 Closing existing WebSocket before reconnecting...");
    ws.current.close();
  }
    console.log("🔑 Connecting WebSocket with token:", token);
    ws.current = new WebSocket(`${WSS_URL}?token=${token}`);

    ws.current.onopen = () => {
      console.log("✅ Connected to WebSocket");
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 WS message:", data);
    };

    ws.current.onclose = () => {
      console.log("🚪 WS closed");
      setIsConnected(false);
    };

    ws.current.onerror = (err) => {
      console.error("⚠️ WS error:", err);
      setIsConnected(false);
    };
  };

  

  

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        console.log("🔐 Token loaded:", storedToken ? "✓ Found" : "✗ Not found");
        setToken(storedToken);
        if (storedToken) connectWebSocket(storedToken);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();

    return () => {
      ws.current?.close();
    };
  }, []);

    const setTokenFromOutside = (newToken: string) => {
    setToken(newToken);
    connectWebSocket(newToken);
  };
  

  return (
    <SocketContext.Provider value={{ socket: ws.current, isConnected, setTokenFromOutside }}>
      {children}
    </SocketContext.Provider>
  );
};