import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
export const TOKEN_STORAGE_KEY = "smartfarm_access_token";
export const USER_STORAGE_KEY = "smartfarm_user_profile";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Attach JWT Bearer token to every outgoing API request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function extractValidationDetails(details) {
  if (!Array.isArray(details) || details.length === 0) return null;

  return details
    .map((item) => {
      if (typeof item === "string") return item;
      const field = Array.isArray(item.loc)
        ? item.loc[item.loc.length - 1]
        : item.field || "field";
      const msg = item.msg || item.message || "Invalid value";
      return `${field}: ${msg}`;
    })
    .join(" | ");
}

// Extract human-readable messages from FastAPI structured errors & handle 401 expiry
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      window.dispatchEvent(new Event("smartfarm:unauthorized"));
    }

    const data = error.response?.data;

    const detailedError =
      extractValidationDetails(data?.error?.details) ||
      extractValidationDetails(data?.details) ||
      extractValidationDetails(data?.detail);

    if (detailedError) {
      return Promise.reject(new Error(detailedError));
    }

    if (data?.error?.message) {
      return Promise.reject(new Error(data.error.message));
    }

    if (typeof data?.detail === "string") {
      return Promise.reject(new Error(data.detail));
    }

    if (error.code === "ECONNABORTED") {
      return Promise.reject(
        new Error("Request timed out. The server may be waking up—please retry.")
      );
    }

    return Promise.reject(
      new Error(error.message || "Unable to connect to SmartFarm API server.")
    );
  }
);

export const getApiBaseUrl = () => API_BASE_URL;