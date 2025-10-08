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
};

export async function login(username: string, password: string) {
  const data = await api.post<LoginResponse>("/api/auth/login/", { username, password });
  setTokens(data.access, data.refresh);
  return data;
}

export async function register(payload: {
  username: string;
  email?: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}) {
  await api.post("/api/auth/register/", payload);
}

export async function me() {
  return api.get<MeResponse>("/api/auth/me/");
}

export function logout() {
  clearTokens();
}
