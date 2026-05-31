import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { requestLogin, verifyOtp } from "../auth/authService";

import "./login.css";

function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [otpStep, setOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();

    setError("");
    setInfo("");
    setLoading(true);

    try {
      const data = await requestLogin(username.trim(), password);

      setOtpStep(true);

      setInfo(
        data.message || "OTP sent. Check your email to continue."
      );

      if (data.otp_for_testing) {
        setInfo(`OTP sent. For testing, use: ${data.otp_for_testing}`);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await verifyOtp(username.trim(), otp.trim());

      login({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        role: data.role,
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "OTP verification failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">ShopSphere</h1>

        <p className="login-subtitle">
          {otpStep
            ? "Enter the OTP sent to your email"
            : "Sign in to your account"}
        </p>

        {error && <p className="login-error">{error}</p>}

        {info && (
          <p
            style={{
              marginBottom: "16px",
              color: "#2563eb",
              fontSize: "0.9rem",
            }}
          >
            {info}
          </p>
        )}

        {!otpStep ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <label className="login-label">Username</label>

            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label className="login-label">Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="login-form">
            <label className="login-label">One-time password</label>

            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              className="login-secondary-btn"
              onClick={() => {
                setOtpStep(false);
                setOtp("");
                setError("");
                setInfo("");
              }}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
