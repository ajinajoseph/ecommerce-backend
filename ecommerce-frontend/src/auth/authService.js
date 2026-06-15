import api from "../api/axios";

export async function registerRequest(username, email, password) {
  const response = await api.post("/auth/register", {
    username,
    email,
    password,
  });

  return response.data;
}

export async function requestLogin(username, password) {
  const response = await api.post("/auth/login", {
    username,
    password,
  });

  return response.data;
}

export async function verifyOtp(username, otp) {
  const response = await api.post("/auth/verify-otp", {
    username,
    otp,
  });

  return response.data;
}

export async function logoutRequest() {
  const response = await api.post("/auth/logout");
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data;
}

export async function forgotPasswordRequest(email) {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPasswordRequest(email, otp, new_password) {
  const response = await api.post("/auth/reset-password", {
    email,
    otp,
    new_password,
  });
  return response.data;
}

export async function refreshAccessToken(refreshToken) {
  const response = await api.post(
    "/auth/refresh",
    {},
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    }
  );

  return response.data;
}