import { api, setTokens, clearTokens } from "./api";

export type LoginResponse = {
  access: string;
  refresh: string;
};

export type MeResponse = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  needs_password_change: boolean;
};

export async function login(username: string, password: string) {
  const data = await api.post<LoginResponse>("/api/auth/login/", {
    username,
    password,
  });
  setTokens(data.access, data.refresh);
  return data;
}

export async function me() {
  return api.get<MeResponse>("/api/auth/me/");
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  return api.post("/api/auth/change-password/", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export function logout() {
  clearTokens();
}
