import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutRequest } from "./authService";

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const ROLE_KEY = "role";
const USERNAME_KEY = "username";
const EMAIL_KEY = "email";

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem(ACCESS_TOKEN_KEY) || ""
  );

  const [refreshToken, setRefreshToken] = useState(
    () => localStorage.getItem(REFRESH_TOKEN_KEY) || ""
  );

  const [role, setRole] = useState(
    () => localStorage.getItem(ROLE_KEY) || ""
  );

  const [username, setUsername] = useState(
    () => localStorage.getItem(USERNAME_KEY) || ""
  );

  const [email, setEmail] = useState(
    () => localStorage.getItem(EMAIL_KEY) || ""
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);

    function handleSessionCleared() {
      setAccessToken("");
      setRefreshToken("");
      setRole("");
      setUsername("");
      setEmail("");
      navigate("/login", { replace: true });
    }

    window.addEventListener("auth-session-cleared", handleSessionCleared);

    return () =>
      window.removeEventListener("auth-session-cleared", handleSessionCleared);
  }, [navigate]);

  const login = useCallback(
    ({ access_token, refresh_token, role: userRole, username, email }) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
      localStorage.setItem(ROLE_KEY, userRole || "");
      localStorage.setItem(USERNAME_KEY, username || "");
      localStorage.setItem(EMAIL_KEY, email || "");

      setAccessToken(access_token);
      setRefreshToken(refresh_token);
      setRole(userRole || "");
      setUsername(username || "");
      setEmail(email || "");
    },
    []
  );

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
      // ignore
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(USERNAME_KEY);
      localStorage.removeItem(EMAIL_KEY);

      setAccessToken("");
      setRefreshToken("");
      setRole("");
      setUsername("");
      setEmail("");

      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      role,
      username,
      email,
      loading,
      isAuthenticated: Boolean(accessToken),
      login,
      logout,
      setAccessToken: setAccessTokenValue,
    }),
    [
      accessToken,
      refreshToken,
      role,
      username,
      email,
      loading,
      login,
      logout,
      setAccessTokenValue,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export { AuthContext };
