import axios, { AxiosInstance, RawAxiosRequestHeaders } from "axios";
import { API_URL } from "../constants/api";
import { authEvents } from "../utils/authEvents";

console.log("🔧 [API Config] Base URL:", API_URL);

// Store a reference to getValidToken function
// This will be set by the AuthProvider after initialization
let getValidTokenFn: (() => Promise<string | null>) | null = null;

export const setAuthTokenGetter = (fn: () => Promise<string | null>) => {
  getValidTokenFn = fn;
  console.log("✅ Auth token getter registered");
};

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  } as RawAxiosRequestHeaders,
});

api.interceptors.request.use(async (config) => {
  const requestId = Math.random().toString(36).substring(7);

  try {
    console.log(`🔧 [API Request ${requestId}] Starting request to:`, config.url);
    console.log(`🔧 [API Request ${requestId}] Method:`, config.method?.toUpperCase());

    // Skip token for all auth routes
    if (!config.url?.includes("auth/")) {
      // Use AuthContext's getValidToken if available
      let token: string | null = null;

      if (getValidTokenFn) {
        token = await getValidTokenFn();
        console.log(`🔐 [API Request ${requestId}] Token from Context:`, !!token);
      } else {
        console.warn(`⚠️ [API Request ${requestId}] Auth getter not initialized yet`);
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`✅ [API Request ${requestId}] Authorization header set`);
        console.log('token-----------', token)
      } else {
        console.log(`❌ [API Request ${requestId}] No valid token available`);
      }
    } else {
      console.log(`⚡ [API Request ${requestId}] Skipping token for auth endpoint`);
    }

    const safeHeaders = { ...config.headers };
    if (safeHeaders.Authorization && typeof safeHeaders.Authorization === "string") {
      safeHeaders.Authorization = safeHeaders.Authorization.substring(0, 20) + "...";
    }
    console.log(`📋 [API Request ${requestId}] Request headers:`, safeHeaders);

    if (config.data) {
      console.log(`📦 [API Request ${requestId}] Request data:`, config.data);
    }
  } catch (e) {
    console.error(`🚨 [API Request ${requestId}] Token read error:`, e);
  }

  if (config.url?.includes("auth/") && config.headers.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response ${response.config.url}] Status:`, response.status);
    console.log(`✅ [API Response ${response.config.url}] Data:`, response.data);
    return response;
  },
  (error) => {
    const requestId = Math.random().toString(36).substring(7);

    console.error(`🚨 [API Error ${requestId}] URL:`, error.config?.url);
    console.error(`🚨 [API Error ${requestId}] Method:`, error.config?.method?.toUpperCase());
    console.error(`🚨 [API Error ${requestId}] Status:`, error.response?.status);
    console.error(`🚨 [API Error ${requestId}] Status Text:`, error.response?.statusText);
    console.error(`🚨 [API Error ${requestId}] Message:`, error.message);

    if (error.response) {
      console.error(`🚨 [API Error ${requestId}] Response headers:`, error.response.headers);
      console.error(`🚨 [API Error ${requestId}] Response data:`, error.response.data);

      if (error.response.status === 401) {
        console.error(`🔐 [API Error ${requestId}] AUTHENTICATION ERROR - Invalid or missing token`);
        if (!error.config?.url?.includes("auth/")) {
          authEvents.emitLogout();
        }
      } else if (error.response.status === 404) {
        console.error(`🔍 [API Error ${requestId}] ENDPOINT NOT FOUND`);
      } else if (error.response.status === 500) {
        console.error(`💥 [API Error ${requestId}] SERVER ERROR`);
      }
    } else if (error.request) {
      console.error(`🌐 [API Error ${requestId}] NETWORK ERROR - No response received`);
      console.error(`🌐 [API Error ${requestId}] Request:`, error.request);
    } else {
      console.error(`⚡ [API Error ${requestId}] UNKNOWN ERROR:`, error.message);
    }

    console.error(`🚨 [API Error ${requestId}] Full error config:`, error.config);

    return Promise.reject(error);
  }
);

export const logoutApi: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

console.log("🔧 [API Init] API instance created with interceptors");