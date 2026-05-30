import axios from "axios";
import { refreshAccessToken } from "../auth/authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

function clearAuthStorage() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("role");
  window.dispatchEvent(new Event("auth-session-cleared"));
}

function shouldSkipAuthHeader(url = "") {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/verify-otp") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/register")
  );
}

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("access_token");
  if (accessToken && !shouldSkipAuthHeader(config.url)) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      shouldSkipAuthHeader(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const storedRefreshToken = localStorage.getItem("refresh_token");
    if (!storedRefreshToken) {
      clearAuthStorage();
      isRefreshing = false;
      return Promise.reject(error);
    }

    try {
      const data = await refreshAccessToken(storedRefreshToken);

      const newAccessToken = data.access_token;
      localStorage.setItem("access_token", newAccessToken);
      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthStorage();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
