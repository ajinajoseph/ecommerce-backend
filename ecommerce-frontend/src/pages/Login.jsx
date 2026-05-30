import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { requestLogin, verifyOtp } from "../auth/authService";

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
    return <Navigate to="/" replace />;
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const data = await requestLogin(username.trim(), password);
      setOtpStep(true);
      setInfo(data.message || "OTP sent. Check your email to continue.");
      if (data.otp_for_testing) {
        setInfo(`OTP sent. For testing, use: ${data.otp_for_testing}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
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
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-mark">SS</div>
          <div>
            <h2>Welcome back</h2>
            <p>Sign in to ShopSphere with your account</p>
          </div>
        </div>

        {error && <div className="login-alert error">{error}</div>}
        {info && <div className="login-alert info">{info}</div>}

        {!otpStep ? (
          <form className="login-form" onSubmit={handleLoginSubmit}>
            <label className="login-field">
              <span>Username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Sending OTP…" : "Login"}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleOtpSubmit}>
            <label className="login-field">
              <span>One-time password</span>
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter 6-digit OTP"
                inputMode="numeric"
                maxLength={6}
                required
              />
            </label>

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Verifying…" : "Verify OTP"}
            </button>

            <button
              type="button"
              className="login-link-button"
              onClick={() => {
                setOtpStep(false);
                setOtp("");
                setInfo("");
                setError("");
              }}
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
