import api from "../api/axios";

export async function requestLogin(username, password) {
  const response = await api.post("/auth/login", { username, password });
  return response.data;
}

export async function verifyOtp(username, otp) {
  const response = await api.post("/auth/verify-otp", { username, otp });
  return response.data;
}

export async function logoutRequest() {
  const response = await api.post("/auth/logout");
  return response.data;
}
