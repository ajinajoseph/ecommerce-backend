import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutRequest } from "./authService";

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const ROLE_KEY = "role";

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem(ACCESS_TOKEN_KEY) || ""
  );
  const [refreshToken, setRefreshToken] = useState(
    () => localStorage.getItem(REFRESH_TOKEN_KEY) || ""
  );
  const [role, setRole] = useState(() => localStorage.getItem(ROLE_KEY) || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);

    function handleSessionCleared() {
      setAccessToken("");
      setRefreshToken("");
      setRole("");
      navigate("/login", { replace: true });
    }

    window.addEventListener("auth-session-cleared", handleSessionCleared);
    return () => window.removeEventListener("auth-session-cleared", handleSessionCleared);
  }, [navigate]);

  const login = useCallback(({ access_token, refresh_token, role: userRole }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    localStorage.setItem(ROLE_KEY, userRole || "");

    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    setRole(userRole || "");
  }, []);

  const setAccessTokenValue = useCallback((token) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    setAccessToken(token);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await logoutRequest();
      }
    } catch {
      // Clear local session even if the server request fails.
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(ROLE_KEY);

      setAccessToken("");
      setRefreshToken("");
      setRole("");
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      role,
      loading,
      isAuthenticated: Boolean(accessToken),
      login,
      logout,
      setAccessToken: setAccessTokenValue,
    }),
    [accessToken, refreshToken, role, loading, login, logout, setAccessTokenValue]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
